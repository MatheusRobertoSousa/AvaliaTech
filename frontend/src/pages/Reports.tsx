import { Cloud, Database, Server, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { api, type ReportsResponse } from "../services/api";

export function Reports() {
  const [reports, setReports] = useState<ReportsResponse | null>(null);

  useEffect(() => {
    api.get<ReportsResponse>("/reports").then((response) => setReports(response.data));
  }, []);

  if (!reports) {
    return <div className="loading">Carregando relatórios...</div>;
  }

  const totalSubmissions = reports.tests.reduce((sum, test) => sum + test.submissions, 0);
  const scoredTests = reports.tests.filter((test) => test.submissions > 0);
  const averageScore = scoredTests.length
    ? Math.round(scoredTests.reduce((sum, test) => sum + test.averageScore, 0) / scoredTests.length)
    : 0;
  const approved = reports.candidates.find((item) => item.status === "approved")?.total ?? 0;

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Relatórios</h1>
          <p>Visão executiva para acompanhar performance, qualidade do funil e prontidão para cloud.</p>
        </div>
      </header>

      <div className="metricsGrid">
        <MetricCard label="Submissões concluídas" value={totalSubmissions} icon={Server} />
        <MetricCard label="Média dos testes" value={`${averageScore}%`} icon={Trophy} tone="amber" />
        <MetricCard label="Candidatos aprovados" value={approved} icon={Trophy} tone="green" />
        <MetricCard label="Cloud alvo" value={reports.cloudPlan.provider} icon={Cloud} tone="teal" />
      </div>

      <div className="splitGrid">
        <article className="panel wide">
          <h2>Desempenho por teste</h2>
          <table>
            <thead>
              <tr>
                <th>Teste</th>
                <th>Status</th>
                <th>Submissões</th>
                <th>Média</th>
              </tr>
            </thead>
            <tbody>
              {reports.tests.map((test) => (
                <tr key={test.id}>
                  <td>{test.title}</td>
                  <td><span className={`badge ${test.status}`}>{test.status === "active" ? "Ativo" : test.status === "draft" ? "Rascunho" : "Finalizado"}</span></td>
                  <td>{test.submissions}</td>
                  <td>{test.averageScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h2>Plano de cloud</h2>
          <div className="cloudList">
            <p><Cloud size={18} /> Provedor: <strong>{reports.cloudPlan.provider}</strong></p>
            <p><Database size={18} /> Banco: <strong>{reports.cloudPlan.database}</strong></p>
            <p><Server size={18} /> Deploy: <strong>{reports.cloudPlan.deploy}</strong></p>
          </div>
        </article>
      </div>

      <article className="panel">
        <h2>Melhores candidatos</h2>
        <div className="candidateCards">
          {reports.bestCandidates.map((candidate) => (
            <div className="miniCard" key={`${candidate.name}-${candidate.testTitle}`}>
              <strong>{candidate.name}</strong>
              <span>{candidate.testTitle}</span>
              <b>{candidate.score}%</b>
              <small>{candidate.time}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
