import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

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
  status: "approved" | "review" | "pending";
  createdAt: string;
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

  const now = new Date().toISOString();

  db.prepare("INSERT INTO companies (id, name, email, createdAt) VALUES (?, ?, ?, ?)").run(
    "company-demo",
    "Tech Solutions",
    "contato@techsolutions.com",
    now
  );

  db.prepare("INSERT INTO users (id, companyId, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "user-demo",
    "company-demo",
    "Recrutador Tech",
    "recrutador@techsolutions.com",
    "123456",
    "recruiter",
    now
  );

  const insertTest = db.prepare(`
    INSERT INTO tests (id, companyId, title, description, difficulty, durationMinutes, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  [
    ["test-frontend", "Desenvolvedor Frontend", "Avaliação de conhecimentos em HTML, CSS, JavaScript e lógica de programação.", "Intermediário", 60, "active"],
    ["test-data", "Analista de Dados", "SQL, interpretação de métricas e raciocínio analítico.", "Intermediário", 75, "active"],
    ["test-admin", "Assistente Administrativo", "Rotinas administrativas, organização e comunicação escrita.", "Básico", 45, "finished"]
  ].forEach(([id, title, description, difficulty, durationMinutes, status]) => {
    insertTest.run(id, "company-demo", title, description, difficulty, durationMinutes, status, now);
  });

  const insertQuestion = db.prepare(`
    INSERT INTO questions (id, testId, statement, type, score, category, options, answer, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedQuestions: Array<[
    id: string,
    statement: string,
    type: "objective" | "discursive",
    score: number,
    category: string,
    options: string[] | null,
    answer: string | null
  ]> = [
    ["q1", "O que é HTML?", "objective", 10, "HTML / CSS", ["Uma linguagem de marcação", "Um banco de dados", "Um framework CSS"], "Uma linguagem de marcação"],
    ["q2", "Qual a diferença entre let e const no JavaScript?", "objective", 10, "JavaScript", ["let é usado para variáveis globais e const para locais.", "let permite reatribuição e const cria constantes.", "Não há diferença, são sinônimos."], "let permite reatribuição e const cria constantes."],
    ["q3", "Flexbox é um modelo de layout unidimensional.", "objective", 10, "HTML / CSS", ["Verdadeiro", "Falso"], "Verdadeiro"],
    ["q4", "Explique o que é o DOM.", "discursive", 20, "JavaScript", null, null],
    ["q5", "Escreva uma função que retorne o maior número de um array.", "discursive", 30, "Lógica de Programação", null, null]
  ];

  seedQuestions.forEach(([id, statement, type, score, category, options, answer]) => {
    insertQuestion.run(id, "test-frontend", statement, type, score, category, options ? JSON.stringify(options) : null, answer, now);
  });

  const insertCandidate = db.prepare("INSERT INTO candidates (id, name, email, status, createdAt) VALUES (?, ?, ?, ?, ?)");
  const insertSubmission = db.prepare(`
    INSERT INTO submissions (id, candidateId, testId, score, answers, durationSeconds, startedAt, finishedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  [
    ["c1", "Mariana Costa", "mariana@email.com", "approved", 95, 2292],
    ["c2", "Gabriel Lima", "gabriel@email.com", "approved", 92, 2465],
    ["c3", "Ana Beatriz", "ana@email.com", "approved", 89, 2387],
    ["c4", "Lucas Martins", "lucas@email.com", "review", 87, 2650],
    ["c5", "João Silva", "joao@email.com", "review", 85, 2535],
    ["c6", "Fernanda Alves", "fernanda@email.com", "review", 83, 2730]
  ].forEach(([id, name, email, status, score, durationSeconds]) => {
    insertCandidate.run(id, name, email, status, now);
    insertSubmission.run(
      `submission-${id}`,
      id,
      "test-frontend",
      score,
      "[]",
      durationSeconds,
      new Date(Date.now() - Number(durationSeconds) * 1000).toISOString(),
      now
    );
  });
}

export function parseOptions(options: string | null) {
  if (!options) return null;
  return JSON.parse(options) as string[];
}
