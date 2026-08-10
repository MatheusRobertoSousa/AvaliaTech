import cors from "cors";
import "dotenv/config";
import express from "express";
import { z } from "zod";
import { createId, createToken, hashPassword, verifyPassword, verifyToken } from "./auth.js";
import {
  db,
  initializeDatabase,
  parseOptions,
  seedDatabase,
  type DbCandidate,
  type DbInvitation,
  type DbQuestion,
  type DbSubmission,
  type DbTest
} from "./database.js";

type AuthContext = {
  userId: string;
  companyId: string;
  role: string;
};

type AuthenticatedRequest = express.Request & {
  auth?: AuthContext;
};

type CountedTest = DbTest & {
  submissions?: number;
};

const app = express();
const port = Number(process.env.PORT ?? 3333);

initializeDatabase();
seedDatabase();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

function requireAuth(request: AuthenticatedRequest, response: express.Response, next: express.NextFunction) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return response.status(401).json({ message: "Sessão inválida ou expirada." });
  }

  request.auth = {
    userId: payload.userId,
    companyId: payload.companyId,
    role: payload.role
  };
  next();
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return "00:00";
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function publicQuestion(question: DbQuestion) {
  return {
    ...question,
    options: parseOptions(question.options)
  };
}

function examQuestion(question: DbQuestion) {
  const { answer: _answer, ...safeQuestion } = publicQuestion(question);
  return safeQuestion;
}

function publicTest(test: CountedTest) {
  const candidates = test.candidates ?? 0;
  const submissions = test.submissions ?? 0;
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    difficulty: test.difficulty,
    durationMinutes: test.durationMinutes,
    status: test.status,
    candidates,
    submissions,
    completionRate: candidates ? Math.round((submissions / candidates) * 100) : 0,
    createdAt: test.createdAt.slice(0, 10)
  };
}

function categoryPerformance(score: number) {
  return [
    { category: "Conhecimentos técnicos", score: Math.max(score, 70) },
    { category: "Raciocínio lógico", score: Math.min(score + 4, 100) },
    { category: "Boas práticas", score: Math.max(score - 8, 55) },
    { category: "Comunicação", score: Math.max(score - 4, 58) }
  ];
}

function getTestList(companyId: string) {
  return db.prepare(`
    SELECT
      tests.*,
      COUNT(DISTINCT invitations.id) as candidates,
      COUNT(DISTINCT submissions.id) as submissions
    FROM tests
    LEFT JOIN invitations ON invitations.testId = tests.id
    LEFT JOIN submissions ON submissions.testId = tests.id
    WHERE tests.companyId = ?
    GROUP BY tests.id
    ORDER BY tests.createdAt DESC
  `).all(companyId) as CountedTest[];
}

function getCandidatePipeline(companyId: string) {
  return db.prepare(`
    SELECT
      candidates.*,
      invitations.token as invitationToken,
      invitations.status as invitationStatus,
      invitations.testId as invitedTestId,
      tests.title as testTitle,
      submissions.score,
      submissions.durationSeconds
    FROM candidates
    JOIN invitations ON invitations.id = (
      SELECT id FROM invitations
      WHERE invitations.candidateId = candidates.id
      AND invitations.companyId = ?
      ORDER BY invitations.createdAt DESC
      LIMIT 1
    )
    JOIN tests ON tests.id = invitations.testId
    LEFT JOIN submissions ON submissions.id = (
      SELECT id FROM submissions
      WHERE submissions.candidateId = candidates.id
      AND submissions.testId = invitations.testId
      ORDER BY submissions.finishedAt DESC
      LIMIT 1
    )
    ORDER BY candidates.createdAt DESC
  `).all(companyId) as Array<DbCandidate & {
    invitationToken: string;
    invitationStatus: string;
    invitedTestId: string;
    testTitle: string;
    score: number | null;
    durationSeconds: number | null;
  }>;
}

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "avaliatech-api",
    database: "sqlite",
    environment: process.env.NODE_ENV ?? "development"
  });
});

app.post("/auth/login", (request, response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(4) });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Credenciais inválidas." });
  }

  const user = db.prepare(`
    SELECT users.id, users.companyId, users.name, users.email, users.passwordHash, users.role, companies.name as company
    FROM users
    JOIN companies ON companies.id = users.companyId
    WHERE users.email = ?
  `).get(result.data.email) as { id: string; companyId: string; name: string; email: string; passwordHash: string; role: string; company: string } | undefined;

  if (!user || !verifyPassword(result.data.password, user.passwordHash)) {
    return response.status(401).json({ message: "E-mail ou senha incorretos." });
  }

  return response.json({
    token: createToken({ userId: user.id, companyId: user.companyId, role: user.role }),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company
    }
  });
});

app.post("/auth/register", (request, response) => {
  const schema = z.object({
    companyName: z.string().min(2),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6)
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados de cadastro inválidos." });
  }

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(result.data.email);
  if (existingUser) {
    return response.status(409).json({ message: "Este e-mail já está cadastrado." });
  }

  const companyId = createId("company");
  const userId = createId("user");
  const now = new Date().toISOString();

  db.prepare("INSERT INTO companies (id, name, email, createdAt) VALUES (?, ?, ?, ?)").run(companyId, result.data.companyName, result.data.email, now);
  db.prepare("INSERT INTO users (id, companyId, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    userId,
    companyId,
    result.data.name,
    result.data.email,
    hashPassword(result.data.password),
    "recruiter",
    now
  );

  return response.status(201).json({
    token: createToken({ userId, companyId, role: "recruiter" }),
    user: {
      id: userId,
      name: result.data.name,
      email: result.data.email,
      role: "recruiter",
      company: result.data.companyName
    }
  });
});

app.get("/auth/me", requireAuth, (request: AuthenticatedRequest, response) => {
  const user = db.prepare(`
    SELECT users.id, users.name, users.email, users.role, companies.name as company
    FROM users
    JOIN companies ON companies.id = users.companyId
    WHERE users.id = ?
  `).get(request.auth!.userId) as { id: string; name: string; email: string; role: string; company: string } | undefined;

  if (!user) {
    return response.status(404).json({ message: "Usuário não encontrado." });
  }

  response.json(user);
});

app.get("/dashboard", requireAuth, (request: AuthenticatedRequest, response) => {
  const company = db.prepare("SELECT id, name FROM companies WHERE id = ?").get(request.auth!.companyId) as { id: string; name: string };
  const tests = getTestList(company.id);
  const candidatesTotal = (db.prepare("SELECT COUNT(DISTINCT candidateId) as total FROM invitations WHERE companyId = ?").get(company.id) as { total: number }).total;
  const scoreSummary = db.prepare(`
    SELECT COUNT(*) as total, AVG(score) as averageScore
    FROM submissions
    JOIN tests ON tests.id = submissions.testId
    WHERE tests.companyId = ?
    AND submissions.finishedAt IS NOT NULL
  `).get(company.id) as { total: number; averageScore: number | null };
  const submissions = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    WHERE tests.companyId = ?
    ORDER BY submissions.finishedAt DESC
    LIMIT 6
  `).all(company.id) as DbSubmission[];

  response.json({
    company: company.name,
    metrics: {
      activeTests: tests.filter((test) => test.status === "active").length,
      candidatesEvaluated: candidatesTotal,
      completionRate: candidatesTotal ? Math.round((scoreSummary.total / candidatesTotal) * 100) : 0,
      averageScore: Math.round(scoreSummary.averageScore ?? 0)
    },
    recentTests: tests.map(publicTest),
    activity: submissions.map((submission) => `${submission.candidateName} concluiu ${submission.testTitle} com ${submission.score}%`)
  });
});

app.get("/tests", requireAuth, (request: AuthenticatedRequest, response) => {
  response.json(getTestList(request.auth!.companyId).map(publicTest));
});

app.get("/tests/:id", requireAuth, (request: AuthenticatedRequest, response) => {
  const testId = String(request.params.id);
  const test = db.prepare("SELECT * FROM tests WHERE id = ? AND companyId = ?").get(testId, request.auth!.companyId) as DbTest | undefined;
  if (!test) return response.status(404).json({ message: "Teste não encontrado." });
  response.json(publicTest(test));
});

app.post("/tests", requireAuth, (request: AuthenticatedRequest, response) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    difficulty: z.string().min(3),
    durationMinutes: z.number().int().min(10),
    status: z.enum(["active", "finished", "draft"]).default("draft")
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados do teste inválidos." });
  }

  const test: CountedTest = {
    id: createId("test"),
    companyId: request.auth!.companyId,
    createdAt: new Date().toISOString(),
    candidates: 0,
    submissions: 0,
    ...result.data
  };

  db.prepare(`
    INSERT INTO tests (id, companyId, title, description, difficulty, durationMinutes, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(test.id, test.companyId, test.title, test.description, test.difficulty, test.durationMinutes, test.status, test.createdAt);

  return response.status(201).json(publicTest(test));
});

app.put("/tests/:id", requireAuth, (request: AuthenticatedRequest, response) => {
  const testId = String(request.params.id);
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    difficulty: z.string().min(3),
    durationMinutes: z.number().int().min(10),
    status: z.enum(["active", "finished", "draft"])
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados do teste inválidos." });
  }

  const update = db.prepare(`
    UPDATE tests
    SET title = ?, description = ?, difficulty = ?, durationMinutes = ?, status = ?
    WHERE id = ? AND companyId = ?
  `).run(result.data.title, result.data.description, result.data.difficulty, result.data.durationMinutes, result.data.status, testId, request.auth!.companyId);

  if (update.changes === 0) return response.status(404).json({ message: "Teste não encontrado." });
  response.json(publicTest(db.prepare("SELECT * FROM tests WHERE id = ?").get(testId) as DbTest));
});

app.delete("/tests/:id", requireAuth, (request: AuthenticatedRequest, response) => {
  const testId = String(request.params.id);
  const test = db.prepare("SELECT id FROM tests WHERE id = ? AND companyId = ?").get(testId, request.auth!.companyId);
  if (!test) return response.status(404).json({ message: "Teste não encontrado." });

  db.prepare("DELETE FROM submissions WHERE testId = ?").run(testId);
  db.prepare("DELETE FROM invitations WHERE testId = ?").run(testId);
  db.prepare("DELETE FROM questions WHERE testId = ?").run(testId);
  db.prepare("DELETE FROM tests WHERE id = ?").run(testId);
  response.status(204).send();
});

app.get("/questions", requireAuth, (request: AuthenticatedRequest, response) => {
  const fallback = db.prepare("SELECT id FROM tests WHERE companyId = ? ORDER BY createdAt ASC LIMIT 1").get(request.auth!.companyId) as { id: string } | undefined;
  const testId = String(request.query.testId ?? fallback?.id ?? "");
  const questions = db.prepare(`
    SELECT questions.*
    FROM questions
    JOIN tests ON tests.id = questions.testId
    WHERE questions.testId = ?
    AND tests.companyId = ?
    ORDER BY questions.createdAt ASC
  `).all(testId, request.auth!.companyId) as DbQuestion[];

  response.json(questions.map(publicQuestion));
});

app.post("/questions", requireAuth, (request: AuthenticatedRequest, response) => {
  const schema = z.object({
    testId: z.string(),
    statement: z.string().min(5),
    type: z.enum(["objective", "discursive"]),
    score: z.number().int().min(1),
    category: z.string().min(2),
    options: z.array(z.string()).nullable().optional(),
    answer: z.string().nullable().optional()
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados da questão inválidos." });
  }

  const test = db.prepare("SELECT id FROM tests WHERE id = ? AND companyId = ?").get(result.data.testId, request.auth!.companyId);
  if (!test) return response.status(404).json({ message: "Teste não encontrado." });

  const options = result.data.type === "objective" ? result.data.options ?? [] : null;
  const answer = result.data.type === "objective" ? result.data.answer ?? options?.[0] ?? null : null;
  const question = {
    id: createId("question"),
    createdAt: new Date().toISOString(),
    ...result.data,
    options,
    answer
  };

  db.prepare(`
    INSERT INTO questions (id, testId, statement, type, score, category, options, answer, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    question.id,
    question.testId,
    question.statement,
    question.type,
    question.score,
    question.category,
    question.options ? JSON.stringify(question.options) : null,
    question.answer,
    question.createdAt
  );

  return response.status(201).json(question);
});

app.put("/questions/:id", requireAuth, (request: AuthenticatedRequest, response) => {
  const questionId = String(request.params.id);
  const schema = z.object({
    statement: z.string().min(5),
    type: z.enum(["objective", "discursive"]),
    score: z.number().int().min(1),
    category: z.string().min(2),
    options: z.array(z.string()).nullable().optional(),
    answer: z.string().nullable().optional()
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados da questão inválidos." });
  }

  const options = result.data.type === "objective" ? result.data.options ?? [] : null;
  const answer = result.data.type === "objective" ? result.data.answer ?? options?.[0] ?? null : null;
  const update = db.prepare(`
    UPDATE questions
    SET statement = ?, type = ?, score = ?, category = ?, options = ?, answer = ?
    WHERE id = ?
    AND testId IN (SELECT id FROM tests WHERE companyId = ?)
  `).run(result.data.statement, result.data.type, result.data.score, result.data.category, options ? JSON.stringify(options) : null, answer, questionId, request.auth!.companyId);

  if (update.changes === 0) return response.status(404).json({ message: "Questão não encontrada." });

  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as DbQuestion;
  response.json(publicQuestion(question));
});

app.delete("/questions/:id", requireAuth, (request: AuthenticatedRequest, response) => {
  const questionId = String(request.params.id);
  const deleteResult = db.prepare(`
    DELETE FROM questions
    WHERE id = ?
    AND testId IN (SELECT id FROM tests WHERE companyId = ?)
  `).run(questionId, request.auth!.companyId);
  if (deleteResult.changes === 0) return response.status(404).json({ message: "Questão não encontrada." });
  response.status(204).send();
});

app.get("/candidates", requireAuth, (request: AuthenticatedRequest, response) => {
  const candidates = getCandidatePipeline(request.auth!.companyId);
  response.json(candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    status: candidate.status,
    invitationStatus: candidate.invitationStatus,
    testTitle: candidate.testTitle,
    score: candidate.score ?? 0,
    time: formatDuration(candidate.durationSeconds),
    inviteUrl: `/exam?invite=${candidate.invitationToken}`
  })));
});

app.post("/candidates", requireAuth, (request: AuthenticatedRequest, response) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    testId: z.string()
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados do candidato inválidos." });
  }

  const test = db.prepare("SELECT id, title FROM tests WHERE id = ? AND companyId = ?").get(result.data.testId, request.auth!.companyId) as { id: string; title: string } | undefined;
  if (!test) return response.status(404).json({ message: "Teste não encontrado." });

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const existingCandidate = db.prepare("SELECT id, name, email, status FROM candidates WHERE email = ?").get(result.data.email) as DbCandidate | undefined;
  const candidateId = existingCandidate?.id ?? createId("candidate");

  if (!existingCandidate) {
    db.prepare("INSERT INTO candidates (id, name, email, status, createdAt) VALUES (?, ?, ?, ?, ?)").run(
      candidateId,
      result.data.name,
      result.data.email,
      "pending",
      now
    );
  }

  const existingInvitation = db.prepare(`
    SELECT * FROM invitations
    WHERE candidateId = ?
    AND testId = ?
    AND companyId = ?
    AND status IN ('invited', 'started')
    ORDER BY createdAt DESC
    LIMIT 1
  `).get(candidateId, result.data.testId, request.auth!.companyId) as DbInvitation | undefined;

  const invitation = existingInvitation ?? {
    id: createId("invite"),
    companyId: request.auth!.companyId,
    candidateId,
    testId: result.data.testId,
    token: createId("token"),
    status: "invited" as const,
    createdAt: now,
    expiresAt,
    completedAt: null
  };

  if (!existingInvitation) {
    db.prepare(`
      INSERT INTO invitations (id, companyId, candidateId, testId, token, status, createdAt, expiresAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invitation.id, invitation.companyId, invitation.candidateId, invitation.testId, invitation.token, invitation.status, invitation.createdAt, invitation.expiresAt, null);
  }

  response.status(201).json({
    id: candidateId,
    name: existingCandidate?.name ?? result.data.name,
    email: existingCandidate?.email ?? result.data.email,
    status: existingCandidate?.status ?? "pending",
    invitationStatus: invitation.status,
    testTitle: test.title,
    score: 0,
    time: "00:00",
    inviteUrl: `/exam?invite=${invitation.token}`
  });
});

app.get("/invitations/:token", (request, response) => {
  const token = String(request.params.token);
  const invitation = db.prepare(`
    SELECT invitations.*, candidates.name as candidateName, candidates.email as candidateEmail, tests.title as testTitle
    FROM invitations
    JOIN candidates ON candidates.id = invitations.candidateId
    JOIN tests ON tests.id = invitations.testId
    WHERE invitations.token = ?
  `).get(token) as DbInvitation | undefined;

  if (!invitation) return response.status(404).json({ message: "Convite não encontrado." });
  if (new Date(invitation.expiresAt).getTime() < Date.now() && invitation.status !== "completed") {
    db.prepare("UPDATE invitations SET status = 'expired' WHERE id = ?").run(invitation.id);
    return response.status(410).json({ message: "Convite expirado." });
  }

  let invitationStatus = invitation.status;
  if (invitation.status === "invited") {
    db.prepare("UPDATE invitations SET status = 'started' WHERE id = ?").run(invitation.id);
    invitationStatus = "started";
  }

  const test = db.prepare("SELECT * FROM tests WHERE id = ?").get(invitation.testId) as DbTest;
  const questions = db.prepare("SELECT * FROM questions WHERE testId = ? ORDER BY createdAt ASC").all(invitation.testId) as DbQuestion[];
  const completedSubmission = invitationStatus === "completed"
    ? db.prepare(`
      SELECT id FROM submissions
      WHERE candidateId = ?
      AND testId = ?
      ORDER BY finishedAt DESC
      LIMIT 1
    `).get(invitation.candidateId, invitation.testId) as { id: string } | undefined
    : undefined;

  response.json({
    invitation: {
      id: invitation.id,
      token: invitation.token,
      status: invitationStatus,
      expiresAt: invitation.expiresAt,
      submissionId: completedSubmission?.id ?? null
    },
    candidate: {
      id: invitation.candidateId,
      name: invitation.candidateName,
      email: invitation.candidateEmail
    },
    test: publicTest(test),
    questions: questions.map(examQuestion)
  });
});

app.post("/submissions", (request, response) => {
  const schema = z.object({
    invitationToken: z.string().optional(),
    candidateId: z.string().optional(),
    testId: z.string().optional(),
    answers: z.array(z.object({ questionId: z.string(), value: z.string() })).default([]),
    durationSeconds: z.number().int().min(1).optional()
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Submissão inválida." });
  }

  const invitation = result.data.invitationToken
    ? db.prepare("SELECT * FROM invitations WHERE token = ?").get(result.data.invitationToken) as DbInvitation | undefined
    : undefined;
  const candidateId = invitation?.candidateId ?? result.data.candidateId;
  const testId = invitation?.testId ?? result.data.testId;

  if (!candidateId || !testId) {
    return response.status(400).json({ message: "Submissão precisa de convite ou candidato/teste." });
  }

  if (invitation) {
    if (invitation.status === "completed") {
      return response.status(409).json({ message: "Este convite já foi concluído." });
    }
    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      db.prepare("UPDATE invitations SET status = 'expired' WHERE id = ?").run(invitation.id);
      return response.status(410).json({ message: "Convite expirado." });
    }
  }

  const questions = db.prepare("SELECT * FROM questions WHERE testId = ?").all(testId) as DbQuestion[];
  const objectiveQuestions = questions.filter((question) => question.type === "objective");
  const maxScore = objectiveQuestions.reduce((sum, question) => sum + question.score, 0);
  const earnedScore = objectiveQuestions.reduce((sum, question) => {
    const answer = result.data.answers.find((item) => item.questionId === question.id);
    return answer?.value === question.answer ? sum + question.score : sum;
  }, 0);
  const score = maxScore ? Math.round((earnedScore / maxScore) * 100) : 0;
  const now = new Date();
  const durationSeconds = result.data.durationSeconds ?? 2535;
  const id = createId("submission");

  db.prepare(`
    INSERT INTO submissions (id, candidateId, testId, score, answers, durationSeconds, startedAt, finishedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    candidateId,
    testId,
    score,
    JSON.stringify(result.data.answers),
    durationSeconds,
    new Date(now.getTime() - durationSeconds * 1000).toISOString(),
    now.toISOString()
  );

  db.prepare("UPDATE candidates SET status = ? WHERE id = ?").run(score >= 85 ? "approved" : "review", candidateId);
  if (invitation) {
    db.prepare("UPDATE invitations SET status = 'completed', completedAt = ? WHERE id = ?").run(now.toISOString(), invitation.id);
  }

  response.status(201).json({
    id,
    score,
    categoryPerformance: categoryPerformance(score),
    feedback: score >= 80
      ? "Excelente desempenho. Você demonstrou domínio dos principais conceitos avaliados."
      : "Bom início. Revise os conceitos principais antes da próxima etapa."
  });
});

app.get("/submissions/latest", requireAuth, (request: AuthenticatedRequest, response) => {
  const submission = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    WHERE tests.companyId = ?
    ORDER BY submissions.finishedAt DESC
    LIMIT 1
  `).get(request.auth!.companyId) as DbSubmission | undefined;

  if (!submission) {
    return response.status(404).json({ message: "Nenhuma submissão encontrada." });
  }

  response.json({
    id: submission.id,
    candidate: submission.candidateName,
    testTitle: submission.testTitle,
    score: submission.score,
    time: formatDuration(submission.durationSeconds),
    categoryPerformance: categoryPerformance(submission.score),
    feedback: submission.score >= 80
      ? "Excelente desempenho. Você demonstrou domínio dos principais conceitos avaliados. Continue assim!"
      : "Resultado em análise. Reforce os fundamentos e acompanhe o retorno da empresa."
  });
});

app.get("/submissions/:id", (request, response) => {
  const submissionId = String(request.params.id);
  const submission = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    WHERE submissions.id = ?
  `).get(submissionId) as DbSubmission | undefined;

  if (!submission) return response.status(404).json({ message: "Resultado não encontrado." });

  response.json({
    id: submission.id,
    candidate: submission.candidateName,
    testTitle: submission.testTitle,
    score: submission.score,
    time: formatDuration(submission.durationSeconds),
    categoryPerformance: categoryPerformance(submission.score),
    feedback: submission.score >= 80
      ? "Excelente desempenho. Você demonstrou domínio dos principais conceitos avaliados. Continue assim!"
      : "Resultado em análise. Reforce os fundamentos e acompanhe o retorno da empresa."
  });
});

app.get("/ranking", requireAuth, (request: AuthenticatedRequest, response) => {
  const submissions = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, candidates.email as candidateEmail, candidates.status as candidateStatus, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    WHERE tests.companyId = ?
    ORDER BY submissions.score DESC, submissions.durationSeconds ASC
  `).all(request.auth!.companyId) as DbSubmission[];

  response.json(submissions.map((submission) => ({
    id: submission.candidateId,
    name: submission.candidateName,
    email: submission.candidateEmail,
    status: submission.candidateStatus,
    testTitle: submission.testTitle,
    score: submission.score,
    time: formatDuration(submission.durationSeconds)
  })));
});

app.get("/reports", requireAuth, (request: AuthenticatedRequest, response) => {
  const tests = db.prepare(`
    SELECT tests.id, tests.title, tests.status, COUNT(DISTINCT invitations.id) as invitations, COUNT(DISTINCT submissions.id) as submissions, AVG(submissions.score) as averageScore
    FROM tests
    LEFT JOIN invitations ON invitations.testId = tests.id
    LEFT JOIN submissions ON submissions.testId = tests.id
    WHERE tests.companyId = ?
    GROUP BY tests.id
    ORDER BY tests.createdAt DESC
  `).all(request.auth!.companyId) as Array<{ id: string; title: string; status: string; invitations: number; submissions: number; averageScore: number | null }>;
  const candidates = db.prepare(`
    SELECT candidates.status, COUNT(DISTINCT candidates.id) as total
    FROM candidates
    JOIN invitations ON invitations.candidateId = candidates.id
    WHERE invitations.companyId = ?
    GROUP BY candidates.status
  `).all(request.auth!.companyId) as Array<{ status: string; total: number }>;
  const bestCandidates = db.prepare(`
    SELECT candidates.name, tests.title as testTitle, submissions.score, submissions.durationSeconds
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    WHERE tests.companyId = ?
    ORDER BY submissions.score DESC, submissions.durationSeconds ASC
    LIMIT 5
  `).all(request.auth!.companyId) as Array<{ name: string; testTitle: string; score: number; durationSeconds: number }>;

  response.json({
    tests: tests.map((test) => ({
      id: test.id,
      title: test.title,
      status: test.status,
      invitations: test.invitations,
      submissions: test.submissions,
      completionRate: test.invitations ? Math.round((test.submissions / test.invitations) * 100) : 0,
      averageScore: Math.round(test.averageScore ?? 0)
    })),
    candidates,
    bestCandidates: bestCandidates.map((candidate) => ({
      name: candidate.name,
      testTitle: candidate.testTitle,
      score: candidate.score,
      time: formatDuration(candidate.durationSeconds)
    })),
    cloudPlan: {
      provider: "AWS",
      database: "Amazon RDS PostgreSQL",
      storage: "Amazon S3 para anexos e relatórios",
      deploy: "ECS/Fargate ou Elastic Beanstalk para API e frontend"
    }
  });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Erro interno no servidor." });
});

app.listen(port, () => {
  console.log(`AvaliaTech API running on http://localhost:${port}`);
});
