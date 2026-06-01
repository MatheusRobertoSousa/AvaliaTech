import cors from "cors";
import "dotenv/config";
import express from "express";
import { z } from "zod";
import { db, initializeDatabase, parseOptions, seedDatabase, type DbCandidate, type DbQuestion, type DbSubmission, type DbTest } from "./database.js";

const app = express();
const port = Number(process.env.PORT ?? 3333);

initializeDatabase();
seedDatabase();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

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

function publicTest(test: DbTest) {
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    difficulty: test.difficulty,
    durationMinutes: test.durationMinutes,
    status: test.status,
    candidates: test.candidates ?? 0,
    completionRate: test.candidates ? 100 : 0,
    createdAt: test.createdAt.slice(0, 10)
  };
}

function categoryPerformance(score: number) {
  return [
    { category: "HTML / CSS", score: Math.max(score, 70) },
    { category: "JavaScript", score },
    { category: "Lógica de Programação", score: Math.min(score + 5, 100) },
    { category: "UI/UX Básico", score: Math.max(score - 10, 50) }
  ];
}

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "avaliatech-api", database: "sqlite" });
});

app.post("/auth/login", (request, response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(4) });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Credenciais inválidas." });
  }

  const user = db.prepare(`
    SELECT users.id, users.name, users.email, users.passwordHash, users.role, companies.name as company
    FROM users
    JOIN companies ON companies.id = users.companyId
    WHERE users.email = ?
  `).get(result.data.email) as { id: string; name: string; email: string; passwordHash: string; role: string; company: string } | undefined;

  if (!user || user.passwordHash !== result.data.password) {
    return response.status(401).json({ message: "E-mail ou senha incorretos." });
  }

  return response.json({
    token: "demo-jwt-token",
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

  const companyId = `company-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare("INSERT INTO companies (id, name, email, createdAt) VALUES (?, ?, ?, ?)").run(companyId, result.data.companyName, result.data.email, now);
  db.prepare("INSERT INTO users (id, companyId, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    userId,
    companyId,
    result.data.name,
    result.data.email,
    result.data.password,
    "recruiter",
    now
  );

  return response.status(201).json({
    id: companyId,
    company: result.data.companyName,
    user: result.data.name,
    email: result.data.email
  });
});

app.get("/dashboard", (_request, response) => {
  const company = db.prepare("SELECT id, name FROM companies WHERE id = ?").get("company-demo") as { id: string; name: string };
  const tests = db.prepare(`
    SELECT tests.*, COUNT(submissions.id) as candidates
    FROM tests
    LEFT JOIN submissions ON submissions.testId = tests.id
    WHERE tests.companyId = ?
    GROUP BY tests.id
    ORDER BY tests.createdAt DESC
  `).all(company.id) as DbTest[];
  const candidatesTotal = (db.prepare("SELECT COUNT(*) as total FROM candidates").get() as { total: number }).total;
  const scoreSummary = db.prepare("SELECT COUNT(*) as total, AVG(score) as averageScore FROM submissions WHERE finishedAt IS NOT NULL").get() as { total: number; averageScore: number | null };
  const submissions = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    ORDER BY submissions.finishedAt DESC
    LIMIT 6
  `).all() as DbSubmission[];

  response.json({
    company: company.name,
    metrics: {
      activeTests: tests.filter((test) => test.status === "active").length,
      candidatesEvaluated: candidatesTotal,
      completionRate: scoreSummary.total ? 100 : 0,
      averageScore: Math.round(scoreSummary.averageScore ?? 0)
    },
    recentTests: tests.map(publicTest),
    activity: submissions.map((submission) => `${submission.candidateName} concluiu o teste ${submission.testTitle} com ${submission.score}%`)
  });
});

app.get("/tests", (_request, response) => {
  const tests = db.prepare(`
    SELECT tests.*, COUNT(submissions.id) as candidates
    FROM tests
    LEFT JOIN submissions ON submissions.testId = tests.id
    WHERE tests.companyId = ?
    GROUP BY tests.id
    ORDER BY tests.createdAt DESC
  `).all("company-demo") as DbTest[];

  response.json(tests.map(publicTest));
});

app.post("/tests", (request, response) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    difficulty: z.string().min(3),
    durationMinutes: z.number().int().min(10)
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados do teste inválidos." });
  }

  const test: DbTest = {
    id: `test-${Date.now()}`,
    companyId: "company-demo",
    status: "draft",
    createdAt: new Date().toISOString(),
    candidates: 0,
    ...result.data
  };

  db.prepare(`
    INSERT INTO tests (id, companyId, title, description, difficulty, durationMinutes, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(test.id, test.companyId, test.title, test.description, test.difficulty, test.durationMinutes, test.status, test.createdAt);

  return response.status(201).json(publicTest(test));
});

app.get("/questions", (request, response) => {
  const fallback = db.prepare("SELECT id FROM tests ORDER BY createdAt ASC LIMIT 1").get() as { id: string } | undefined;
  const testId = String(request.query.testId ?? fallback?.id ?? "");
  const questions = db.prepare("SELECT * FROM questions WHERE testId = ? ORDER BY createdAt ASC").all(testId) as DbQuestion[];

  response.json(questions.map(publicQuestion));
});

app.post("/questions", (request, response) => {
  const schema = z.object({
    testId: z.string(),
    statement: z.string().min(5),
    type: z.enum(["objective", "discursive"]),
    score: z.number().int().min(1),
    category: z.string().min(2),
    options: z.array(z.string()).optional(),
    answer: z.string().optional()
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados da questão inválidos." });
  }

  const question = {
    id: `q-${Date.now()}`,
    createdAt: new Date().toISOString(),
    options: result.data.options ?? null,
    answer: result.data.answer ?? null,
    ...result.data
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

app.get("/candidates", (_request, response) => {
  const candidates = db.prepare(`
    SELECT candidates.*, submissions.score, submissions.durationSeconds, tests.title as testTitle
    FROM candidates
    LEFT JOIN submissions ON submissions.id = (
      SELECT id FROM submissions WHERE submissions.candidateId = candidates.id ORDER BY finishedAt DESC LIMIT 1
    )
    LEFT JOIN tests ON tests.id = submissions.testId
    ORDER BY candidates.createdAt DESC
  `).all() as Array<DbCandidate & { score: number | null; durationSeconds: number | null; testTitle: string | null }>;

  response.json(candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    status: candidate.status,
    testTitle: candidate.testTitle ?? "Sem teste",
    score: candidate.score ?? 0,
    time: formatDuration(candidate.durationSeconds)
  })));
});

app.post("/submissions", (request, response) => {
  const schema = z.object({
    candidateId: z.string(),
    testId: z.string(),
    answers: z.array(z.object({ questionId: z.string(), value: z.string() })).default([]),
    durationSeconds: z.number().int().min(1).optional()
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Submissão inválida." });
  }

  const questions = db.prepare("SELECT * FROM questions WHERE testId = ?").all(result.data.testId) as DbQuestion[];
  const objectiveQuestions = questions.filter((question) => question.type === "objective");
  const maxScore = objectiveQuestions.reduce((sum, question) => sum + question.score, 0);
  const earnedScore = objectiveQuestions.reduce((sum, question) => {
    const answer = result.data.answers.find((item) => item.questionId === question.id);
    return answer?.value === question.answer ? sum + question.score : sum;
  }, 0);
  const score = maxScore ? Math.round((earnedScore / maxScore) * 100) : 85;
  const now = new Date();
  const durationSeconds = result.data.durationSeconds ?? 2535;
  const id = `submission-${Date.now()}`;

  db.prepare(`
    INSERT INTO submissions (id, candidateId, testId, score, answers, durationSeconds, startedAt, finishedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    result.data.candidateId,
    result.data.testId,
    score,
    JSON.stringify(result.data.answers),
    durationSeconds,
    new Date(now.getTime() - durationSeconds * 1000).toISOString(),
    now.toISOString()
  );

  response.status(201).json({
    id,
    score,
    categoryPerformance: categoryPerformance(score),
    feedback: score >= 80
      ? "Excelente desempenho. Você demonstrou domínio dos principais conceitos avaliados."
      : "Bom início. Revise os conceitos principais antes da próxima etapa."
  });
});

app.get("/submissions/latest", (_request, response) => {
  const submission = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    ORDER BY submissions.finishedAt DESC
    LIMIT 1
  `).get() as DbSubmission | undefined;

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

app.get("/ranking", (_request, response) => {
  const submissions = db.prepare(`
    SELECT submissions.*, candidates.name as candidateName, candidates.email as candidateEmail, candidates.status as candidateStatus, tests.title as testTitle
    FROM submissions
    JOIN candidates ON candidates.id = submissions.candidateId
    JOIN tests ON tests.id = submissions.testId
    ORDER BY submissions.score DESC, submissions.durationSeconds ASC
  `).all() as DbSubmission[];

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

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Erro interno no servidor." });
});

app.listen(port, () => {
  console.log(`AvaliaTech API running on http://localhost:${port}`);
});
