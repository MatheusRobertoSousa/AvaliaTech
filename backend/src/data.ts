export type TestStatus = "active" | "finished" | "draft";

export type AssessmentTest = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  status: TestStatus;
  candidates: number;
  completionRate: number;
  createdAt: string;
};

export type Question = {
  id: string;
  testId: string;
  statement: string;
  type: "objective" | "discursive";
  score: number;
  category: string;
  options?: string[];
  answer?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  testTitle: string;
  score: number;
  time: string;
  status: "approved" | "review" | "pending";
};

export const tests: AssessmentTest[] = [
  {
    id: "test-frontend",
    title: "Desenvolvedor Frontend",
    description: "Avaliação de HTML, CSS, JavaScript e lógica de programação.",
    difficulty: "Intermediário",
    durationMinutes: 60,
    status: "active",
    candidates: 45,
    completionRate: 78,
    createdAt: "2026-05-12"
  },
  {
    id: "test-data",
    title: "Analista de Dados",
    description: "SQL, interpretação de métricas e raciocínio analítico.",
    difficulty: "Intermediário",
    durationMinutes: 75,
    status: "active",
    candidates: 32,
    completionRate: 71,
    createdAt: "2026-05-10"
  },
  {
    id: "test-admin",
    title: "Assistente Administrativo",
    description: "Rotinas administrativas, organização e comunicação escrita.",
    difficulty: "Básico",
    durationMinutes: 45,
    status: "finished",
    candidates: 28,
    completionRate: 84,
    createdAt: "2026-05-08"
  }
];

export const questions: Question[] = [
  {
    id: "q1",
    testId: "test-frontend",
    statement: "O que é HTML?",
    type: "objective",
    score: 10,
    category: "HTML / CSS",
    options: ["Uma linguagem de marcação", "Um banco de dados", "Um framework CSS"],
    answer: "Uma linguagem de marcação"
  },
  {
    id: "q2",
    testId: "test-frontend",
    statement: "Qual a diferença entre let e const no JavaScript?",
    type: "objective",
    score: 10,
    category: "JavaScript",
    options: [
      "let é usado para variáveis globais e const para locais.",
      "let permite reatribuição e const cria constantes.",
      "Não há diferença, são sinônimos."
    ],
    answer: "let permite reatribuição e const cria constantes."
  },
  {
    id: "q3",
    testId: "test-frontend",
    statement: "Flexbox é um modelo de layout unidimensional.",
    type: "objective",
    score: 10,
    category: "HTML / CSS"
  },
  {
    id: "q4",
    testId: "test-frontend",
    statement: "Explique o que é o DOM.",
    type: "discursive",
    score: 20,
    category: "JavaScript"
  },
  {
    id: "q5",
    testId: "test-frontend",
    statement: "Escreva uma função que retorne o maior número de um array.",
    type: "discursive",
    score: 30,
    category: "Lógica de Programação"
  }
];

export const candidates: Candidate[] = [
  { id: "c1", name: "Mariana Costa", email: "mariana@email.com", testTitle: "Desenvolvedor Frontend", score: 95, time: "38:12", status: "approved" },
  { id: "c2", name: "Gabriel Lima", email: "gabriel@email.com", testTitle: "Desenvolvedor Frontend", score: 92, time: "41:05", status: "approved" },
  { id: "c3", name: "Ana Beatriz", email: "ana@email.com", testTitle: "Desenvolvedor Frontend", score: 89, time: "39:47", status: "approved" },
  { id: "c4", name: "Lucas Martins", email: "lucas@email.com", testTitle: "Desenvolvedor Frontend", score: 87, time: "44:10", status: "review" },
  { id: "c5", name: "João Silva", email: "joao@email.com", testTitle: "Desenvolvedor Frontend", score: 85, time: "42:15", status: "review" },
  { id: "c6", name: "Fernanda Alves", email: "fernanda@email.com", testTitle: "Desenvolvedor Frontend", score: 83, time: "45:30", status: "review" }
];
