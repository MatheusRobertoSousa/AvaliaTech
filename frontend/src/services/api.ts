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
  options?: string[];
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
