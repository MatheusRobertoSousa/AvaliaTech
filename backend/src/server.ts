import cors from "cors";
import "dotenv/config";
import express from "express";
import { z } from "zod";
import { candidates, questions, tests } from "./data.js";

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "avaliatech-api" });
});

app.post("/auth/login", (request, response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(4) });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Credenciais inválidas." });
  }

  return response.json({
    token: "demo-jwt-token",
    user: {
      id: "user-1",
      name: "Tech Solutions",
      email: result.data.email,
      role: "recruiter",
      company: "Tech Solutions"
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

  return response.status(201).json({
    id: "company-demo",
    company: result.data.companyName,
    user: result.data.name,
    email: result.data.email
  });
});

app.get("/dashboard", (_request, response) => {
  const totalCandidates = candidates.length + tests.reduce((sum, test) => sum + test.candidates, 0);
  const activeTests = tests.filter((test) => test.status === "active").length;
  const averageScore = Math.round(candidates.reduce((sum, candidate) => sum + candidate.score, 0) / candidates.length);
  const completionRate = Math.round(tests.reduce((sum, test) => sum + test.completionRate, 0) / tests.length);

  response.json({
    company: "Tech Solutions",
    metrics: {
      activeTests,
      candidatesEvaluated: totalCandidates,
      completionRate,
      averageScore
    },
    recentTests: tests,
    activity: [
      "João Silva concluiu o teste Desenvolvedor Frontend",
      "Mariana Souza iniciou o teste Analista de Dados",
      "Novo candidato convidado para Assistente Administrativo"
    ]
  });
});

app.get("/tests", (_request, response) => {
  response.json(tests);
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

  const test = {
    id: `test-${Date.now()}`,
    status: "draft" as const,
    candidates: 0,
    completionRate: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    ...result.data
  };
  tests.unshift(test);
  return response.status(201).json(test);
});

app.get("/questions", (request, response) => {
  const testId = String(request.query.testId ?? "test-frontend");
  response.json(questions.filter((question) => question.testId === testId));
});

app.post("/questions", (request, response) => {
  const schema = z.object({
    testId: z.string(),
    statement: z.string().min(5),
    type: z.enum(["objective", "discursive"]),
    score: z.number().int().min(1),
    category: z.string().min(2)
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Dados da questão inválidos." });
  }

  const question = { id: `q-${Date.now()}`, ...result.data };
  questions.push(question);
  return response.status(201).json(question);
});

app.get("/candidates", (_request, response) => {
  response.json(candidates);
});

app.post("/submissions", (request, response) => {
  const schema = z.object({
    candidateId: z.string(),
    testId: z.string(),
    answers: z.array(z.unknown()).default([])
  });
  const result = schema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ message: "Submissão inválida." });
  }

  response.status(201).json({
    id: `submission-${Date.now()}`,
    score: 85,
    categoryPerformance: [
      { category: "HTML / CSS", score: 90 },
      { category: "JavaScript", score: 80 },
      { category: "Lógica de Programação", score: 85 },
      { category: "UI/UX Básico", score: 70 }
    ],
    feedback: "Excelente desempenho. Você demonstrou domínio dos principais conceitos avaliados."
  });
});

app.get("/ranking", (_request, response) => {
  response.json([...candidates].sort((a, b) => b.score - a.score));
});

app.listen(port, () => {
  console.log(`AvaliaTech API running on http://localhost:${port}`);
});
