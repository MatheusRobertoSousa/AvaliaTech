import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333"
});

export type DashboardResponse = {
  company: string;
  metrics: {
    activeTests: number;
    candidatesEvaluated: number;
    completionRate: number;
    averageScore: number;
  };
  recentTests: AssessmentTest[];
  activity: string[];
};

export type AssessmentTest = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  status: "active" | "finished" | "draft";
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
  options?: string[] | null;
  answer?: string | null;
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

export type CandidateInvite = Candidate & {
  inviteUrl: string;
};

export type SubmissionResult = {
  id: string;
  candidate: string;
  testTitle: string;
  score: number;
  time: string;
  categoryPerformance: Array<{ category: string; score: number }>;
  feedback: string;
};

export type ReportsResponse = {
  tests: Array<{ id: string; title: string; status: string; submissions: number; averageScore: number }>;
  candidates: Array<{ status: "approved" | "review" | "pending"; total: number }>;
  bestCandidates: Array<{ name: string; testTitle: string; score: number; time: string }>;
  cloudPlan: {
    provider: string;
    database: string;
    storage: string;
    deploy: string;
  };
};
