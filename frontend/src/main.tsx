import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CandidateExam } from "./pages/CandidateExam";
import { Candidates } from "./pages/Candidates";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Questions } from "./pages/Questions";
import { Ranking } from "./pages/Ranking";
import { Reports } from "./pages/Reports";
import { Result } from "./pages/Result";
import { TestBuilder } from "./pages/TestBuilder";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tests/new" element={<TestBuilder />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/result" element={<Result />} />
        </Route>
        <Route path="/exam" element={<CandidateExam />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
