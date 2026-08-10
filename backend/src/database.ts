import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createId, hashPassword } from "./auth.js";

const dataDir = path.resolve(process.cwd(), "data");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(path.join(dataDir, "avaliatech.sqlite"));

export type DbTest = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  status: string;
  createdAt: string;
  candidates?: number;
};

export type DbQuestion = {
  id: string;
  testId: string;
  statement: string;
  type: "objective" | "discursive";
  score: number;
  category: string;
  options: string | null;
  answer: string | null;
  createdAt: string;
};

export type DbCandidate = {
  id: string;
  name: string;
  email: string;
  status: "approved" | "review" | "pending" | "rejected";
  createdAt: string;
};

export type DbInvitation = {
  id: string;
  companyId: string;
  candidateId: string;
  testId: string;
  token: string;
  status: "invited" | "started" | "completed" | "expired";
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  candidateName?: string;
  candidateEmail?: string;
  testTitle?: string;
};

export type DbSubmission = {
  id: string;
  candidateId: string;
  testId: string;
  score: number;
  answers: string | null;
  durationSeconds: number | null;
  startedAt: string;
  finishedAt: string | null;
  candidateName?: string;
  candidateEmail?: string;
  candidateStatus?: string;
  testTitle?: string;
};

type SeedTest = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  status: string;
  createdAt: string;
};

type SeedQuestion = {
  id: string;
  testId: string;
  statement: string;
  type: "objective" | "discursive";
  score: number;
  category: string;
  options: string[] | null;
  answer: string | null;
  createdAt: string;
};

type SeedCandidate = {
  id: string;
  name: string;
  email: string;
  status: "approved" | "review" | "pending" | "rejected";
  createdAt: string;
  submissions?: Array<{
    id: string;
    testId: string;
    score: number;
    durationSeconds: number;
    finishedAt: string;
  }>;
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      durationMinutes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      testId TEXT NOT NULL,
      statement TEXT NOT NULL,
      type TEXT NOT NULL,
      score INTEGER NOT NULL,
      category TEXT NOT NULL,
      options TEXT,
      answer TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      candidateId TEXT NOT NULL,
      testId TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'invited',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expiresAt TEXT NOT NULL,
      completedAt TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id),
      FOREIGN KEY (candidateId) REFERENCES candidates(id),
      FOREIGN KEY (testId) REFERENCES tests(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      candidateId TEXT NOT NULL,
      testId TEXT NOT NULL,
      score INTEGER NOT NULL,
      answers TEXT,
      durationSeconds INTEGER,
      startedAt TEXT NOT NULL,
      finishedAt TEXT,
      FOREIGN KEY (candidateId) REFERENCES candidates(id),
      FOREIGN KEY (testId) REFERENCES tests(id)
    );
  `);
}

export function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS submissions;
    DROP TABLE IF EXISTS invitations;
    DROP TABLE IF EXISTS candidates;
    DROP TABLE IF EXISTS questions;
    DROP TABLE IF EXISTS tests;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS companies;
  `);
  initializeDatabase();
  seedDatabase();
}

export function seedDatabase() {
  const companyCount = db.prepare("SELECT COUNT(*) as total FROM companies").get() as { total: number };
  if (companyCount.total > 0) return;

  const createdAt = daysAgo(42);

  db.prepare("INSERT INTO companies (id, name, email, createdAt) VALUES (?, ?, ?, ?)").run(
    "company-demo",
    "Nexa People Consultoria",
    "contato@nexapeople.example",
    createdAt
  );

  db.prepare("INSERT INTO users (id, companyId, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "user-demo",
    "company-demo",
    "Marina Duarte",
    "recrutador@techsolutions.com",
    hashPassword("123456"),
    "recruiter",
    createdAt
  );

  const tests: SeedTest[] = [
    {
      id: "test-frontend-pleno",
      title: "Desenvolvedor Frontend React Pleno",
      description: "Avaliação de React, TypeScript, acessibilidade, consumo de APIs e raciocínio de interface.",
      difficulty: "Intermediário",
      durationMinutes: 70,
      status: "active",
      createdAt: daysAgo(18)
    },
    {
      id: "test-backend-node",
      title: "Desenvolvedor Backend Node.js",
      description: "Desafio de APIs REST, modelagem de dados, autenticação, testes e boas práticas de segurança.",
      difficulty: "Avançado",
      durationMinutes: 90,
      status: "active",
      createdAt: daysAgo(16)
    },
    {
      id: "test-data-analytics",
      title: "Analista de Dados Júnior",
      description: "Teste de SQL, interpretação de indicadores, limpeza de dados e comunicação de insights.",
      difficulty: "Básico",
      durationMinutes: 55,
      status: "active",
      createdAt: daysAgo(13)
    },
    {
      id: "test-customer-success",
      title: "Customer Success B2B",
      description: "Avaliação de comunicação, priorização de contas, leitura de métricas e resolução de conflitos.",
      difficulty: "Intermediário",
      durationMinutes: 45,
      status: "draft",
      createdAt: daysAgo(6)
    },
    {
      id: "test-ux-ui",
      title: "Designer UX/UI Produto SaaS",
      description: "Avaliação de heurísticas, fluxo de usuário, componentes de interface e tomada de decisão.",
      difficulty: "Intermediário",
      durationMinutes: 60,
      status: "finished",
      createdAt: daysAgo(24)
    }
  ];

  const insertTest = db.prepare(`
    INSERT INTO tests (id, companyId, title, description, difficulty, durationMinutes, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  tests.forEach((test) => {
    insertTest.run(test.id, "company-demo", test.title, test.description, test.difficulty, test.durationMinutes, test.status, test.createdAt);
  });

  const questions: SeedQuestion[] = [
    {
      id: "front-q1",
      testId: "test-frontend-pleno",
      statement: "Qual hook é mais adequado para sincronizar um componente React com uma API externa?",
      type: "objective",
      score: 10,
      category: "React",
      options: ["useMemo", "useEffect", "useRef", "useId"],
      answer: "useEffect",
      createdAt: daysAgo(18)
    },
    {
      id: "front-q2",
      testId: "test-frontend-pleno",
      statement: "Em TypeScript, qual recurso ajuda a restringir valores possíveis para um campo de status?",
      type: "objective",
      score: 10,
      category: "TypeScript",
      options: ["Union types", "Any", "Console", "Prototype"],
      answer: "Union types",
      createdAt: daysAgo(18)
    },
    {
      id: "front-q3",
      testId: "test-frontend-pleno",
      statement: "Explique como você validaria acessibilidade básica em um formulário de cadastro.",
      type: "discursive",
      score: 20,
      category: "Acessibilidade",
      options: null,
      answer: null,
      createdAt: daysAgo(18)
    },
    {
      id: "front-q4",
      testId: "test-frontend-pleno",
      statement: "Qual prática melhora a percepção de performance em uma tela de dashboard?",
      type: "objective",
      score: 10,
      category: "UX / Performance",
      options: ["Bloquear a tela até tudo carregar", "Usar estados de carregamento e dados parciais", "Remover feedback visual", "Aumentar animações"],
      answer: "Usar estados de carregamento e dados parciais",
      createdAt: daysAgo(18)
    },
    {
      id: "back-q1",
      testId: "test-backend-node",
      statement: "Qual status HTTP é mais adequado para criação bem-sucedida de um recurso?",
      type: "objective",
      score: 10,
      category: "APIs REST",
      options: ["200", "201", "302", "500"],
      answer: "201",
      createdAt: daysAgo(16)
    },
    {
      id: "back-q2",
      testId: "test-backend-node",
      statement: "Qual técnica reduz risco ao armazenar senhas de usuários?",
      type: "objective",
      score: 10,
      category: "Segurança",
      options: ["Salvar em texto puro", "Hash com salt", "Base64", "Enviar por e-mail"],
      answer: "Hash com salt",
      createdAt: daysAgo(16)
    },
    {
      id: "back-q3",
      testId: "test-backend-node",
      statement: "Descreva uma estratégia para versionar endpoints sem quebrar clientes existentes.",
      type: "discursive",
      score: 20,
      category: "Arquitetura",
      options: null,
      answer: null,
      createdAt: daysAgo(16)
    },
    {
      id: "data-q1",
      testId: "test-data-analytics",
      statement: "Qual comando SQL agrupa linhas para cálculo de métricas por categoria?",
      type: "objective",
      score: 10,
      category: "SQL",
      options: ["ORDER BY", "GROUP BY", "JOIN", "LIMIT"],
      answer: "GROUP BY",
      createdAt: daysAgo(13)
    },
    {
      id: "data-q2",
      testId: "test-data-analytics",
      statement: "Uma taxa de conversão caiu de 40% para 32%. Qual foi a queda em pontos percentuais?",
      type: "objective",
      score: 10,
      category: "Métricas",
      options: ["8 p.p.", "20 p.p.", "12 p.p.", "4 p.p."],
      answer: "8 p.p.",
      createdAt: daysAgo(13)
    },
    {
      id: "ux-q1",
      testId: "test-ux-ui",
      statement: "Qual heurística de Nielsen trata de informar o usuário sobre o que está acontecendo?",
      type: "objective",
      score: 10,
      category: "Heurísticas",
      options: ["Visibilidade do status do sistema", "Controle de versão", "Normalização", "Cache local"],
      answer: "Visibilidade do status do sistema",
      createdAt: daysAgo(24)
    },
    {
      id: "ux-q2",
      testId: "test-ux-ui",
      statement: "Explique como reduzir atrito em um fluxo de convite de candidatos.",
      type: "discursive",
      score: 20,
      category: "Fluxo de usuário",
      options: null,
      answer: null,
      createdAt: daysAgo(24)
    }
  ];

  const insertQuestion = db.prepare(`
    INSERT INTO questions (id, testId, statement, type, score, category, options, answer, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  questions.forEach((question) => {
    insertQuestion.run(
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
  });

  const candidates: SeedCandidate[] = [
    { id: "cand-ana-paula", name: "Ana Paula Ribeiro", email: "ana.ribeiro@example.com", status: "approved", createdAt: daysAgo(12), submissions: [{ id: "sub-ana-front", testId: "test-frontend-pleno", score: 94, durationSeconds: 2980, finishedAt: daysAgo(10) }] },
    { id: "cand-lucas-martins", name: "Lucas Martins", email: "lucas.martins@example.com", status: "approved", createdAt: daysAgo(14), submissions: [{ id: "sub-lucas-back", testId: "test-backend-node", score: 91, durationSeconds: 3520, finishedAt: daysAgo(8) }] },
    { id: "cand-mariana-costa", name: "Mariana Costa", email: "mariana.costa@example.com", status: "approved", createdAt: daysAgo(15), submissions: [{ id: "sub-mariana-ux", testId: "test-ux-ui", score: 89, durationSeconds: 2410, finishedAt: daysAgo(11) }] },
    { id: "cand-gabriel-lima", name: "Gabriel Lima", email: "gabriel.lima@example.com", status: "approved", createdAt: daysAgo(9), submissions: [{ id: "sub-gabriel-front", testId: "test-frontend-pleno", score: 88, durationSeconds: 3165, finishedAt: daysAgo(7) }] },
    { id: "cand-julia-cardoso", name: "Júlia Cardoso", email: "julia.cardoso@example.com", status: "review", createdAt: daysAgo(10), submissions: [{ id: "sub-julia-data", testId: "test-data-analytics", score: 82, durationSeconds: 2140, finishedAt: daysAgo(6) }] },
    { id: "cand-rafael-santos", name: "Rafael Santos", email: "rafael.santos@example.com", status: "review", createdAt: daysAgo(8), submissions: [{ id: "sub-rafael-back", testId: "test-backend-node", score: 78, durationSeconds: 4100, finishedAt: daysAgo(5) }] },
    { id: "cand-bianca-melo", name: "Bianca Melo", email: "bianca.melo@example.com", status: "review", createdAt: daysAgo(7), submissions: [{ id: "sub-bianca-front", testId: "test-frontend-pleno", score: 76, durationSeconds: 3340, finishedAt: daysAgo(4) }] },
    { id: "cand-pedro-alves", name: "Pedro Alves", email: "pedro.alves@example.com", status: "review", createdAt: daysAgo(6), submissions: [{ id: "sub-pedro-data", testId: "test-data-analytics", score: 73, durationSeconds: 2460, finishedAt: daysAgo(3) }] },
    { id: "cand-larissa-nunes", name: "Larissa Nunes", email: "larissa.nunes@example.com", status: "pending", createdAt: daysAgo(5) },
    { id: "cand-vitor-henrique", name: "Vitor Henrique", email: "vitor.henrique@example.com", status: "pending", createdAt: daysAgo(4) },
    { id: "cand-camila-teixeira", name: "Camila Teixeira", email: "camila.teixeira@example.com", status: "pending", createdAt: daysAgo(2) },
    { id: "cand-renan-moura", name: "Renan Moura", email: "renan.moura@example.com", status: "pending", createdAt: daysAgo(1) }
  ];

  const insertCandidate = db.prepare("INSERT INTO candidates (id, name, email, status, createdAt) VALUES (?, ?, ?, ?, ?)");
  const insertInvitation = db.prepare(`
    INSERT INTO invitations (id, companyId, candidateId, testId, token, status, createdAt, expiresAt, completedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSubmission = db.prepare(`
    INSERT INTO submissions (id, candidateId, testId, score, answers, durationSeconds, startedAt, finishedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  candidates.forEach((candidate) => {
    insertCandidate.run(candidate.id, candidate.name, candidate.email, candidate.status, candidate.createdAt);
    const firstSubmission = candidate.submissions?.[0];
    const testId = firstSubmission?.testId ?? "test-frontend-pleno";
    insertInvitation.run(
      createId("invite"),
      "company-demo",
      candidate.id,
      testId,
      createId("token"),
      firstSubmission ? "completed" : "invited",
      candidate.createdAt,
      daysAgo(-14),
      firstSubmission?.finishedAt ?? null
    );
    candidate.submissions?.forEach((submission) => {
      insertSubmission.run(
        submission.id,
        candidate.id,
        submission.testId,
        submission.score,
        "[]",
        submission.durationSeconds,
        new Date(new Date(submission.finishedAt).getTime() - submission.durationSeconds * 1000).toISOString(),
        submission.finishedAt
      );
    });
  });
}

export function parseOptions(options: string | null) {
  if (!options) return null;
  return JSON.parse(options) as string[];
}
