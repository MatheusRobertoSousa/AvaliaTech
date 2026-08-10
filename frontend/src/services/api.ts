import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("avaliatech.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isProtectedPage = !window.location.pathname.startsWith("/exam") && window.location.pathname !== "/";
    if (error.response?.status === 401 && isProtectedPage) {
      localStorage.removeItem("avaliatech.token");
      localStorage.removeItem("avaliatech.user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    company: string;
  };
};

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
  submissions?: number;
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
  status: "approved" | "review" | "pending" | "rejected";
  invitationStatus?: "invited" | "started" | "completed" | "expired";
  inviteUrl?: string;
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

export type InvitationExam = {
  invitation: {
    id: string;
    token: string;
    status: "invited" | "started" | "completed" | "expired";
    expiresAt: string;
    submissionId?: string | null;
  };
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  test: AssessmentTest;
  questions: Question[];
};

export type ReportsResponse = {
  tests: Array<{ id: string; title: string; status: string; invitations: number; submissions: number; completionRate: number; averageScore: number }>;
  candidates: Array<{ status: "approved" | "review" | "pending" | "rejected"; total: number }>;
  bestCandidates: Array<{ name: string; testTitle: string; score: number; time: string }>;
  cloudPlan: {
    provider: string;
    database: string;
    storage: string;
    deploy: string;
  };
};
