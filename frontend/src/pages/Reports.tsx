import { Cloud, Database, Server, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { PageSkeleton } from "../components/Skeleton";
import { api, type ReportsResponse } from "../services/api";

export function Reports() {
  const [reports, setReports] = useState<ReportsResponse | null>(null);

  useEffect(() => {
    api.get<ReportsResponse>("/reports").then((response) => setReports(response.data));
  }, []);

  if (!reports) {
    return <PageSkeleton columns={6} />;
  }

  const totalInvitations = reports.tests.reduce((sum, test) => sum + test.invitations, 0);
  const totalSubmissions = reports.tests.reduce((sum, test) => sum + test.submissions, 0);
  const scoredTests = reports.tests.filter((test) => test.submissions > 0);
  const averageScore = scoredTests.length
    ? Math.round(scoredTests.reduce((sum, test) => sum + test.averageScore, 0) / scoredTests.length)
    : 0;
  const approved = reports.candidates.find((item) => item.status === "approved")?.total ?? 0;
  const rejected = reports.candidates.find((item) => item.status === "rejected")?.total ?? 0;

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Relatórios</h1>
          <p>Visão executiva para acompanhar performance, qualidade do funil e prontidão para cloud.</p>
        </div>
      </header>

      <div className="metricsGrid">
        <MetricCard label="Convites enviados" value={totalInvitations} icon={Users} />
        <MetricCard label="Submissões concluídas" value={totalSubmissions} icon={Server} tone="teal" />
        <MetricCard label="Média dos testes" value={`${averageScore}%`} icon={Trophy} tone="amber" />
        <MetricCard label="Aprovados / recusados" value={`${approved}/${rejected}`} icon={Trophy} tone="green" />
      </div>

      <div className="splitGrid reportsGrid">
        <article className="panel wide">
          <div className="panelTitle">
            <div>
              <h2>Desempenho por teste</h2>
              <p>Indicadores calculados em tempo real a partir dos convites e submissões.</p>
            </div>
          </div>
          <div className="tableScroller">
            <table className="reportTable">
              <thead>
                <tr>
                  <th>Teste</th>
                  <th>Status</th>
                  <th>Convites</th>
                  <th>Submissões</th>
                  <th>Conclusão</th>
                  <th>Média</th>
                </tr>
              </thead>
              <tbody>
                {reports.tests.map((test) => (
                  <tr key={test.id}>
                    <td className="wrapCell">{test.title}</td>
                    <td>
                      <span className={`badge ${test.status}`}>
                        {test.status === "active" ? "Ativo" : test.status === "draft" ? "Rascunho" : "Finalizado"}
                      </span>
                    </td>
                    <td>{test.invitations}</td>
                    <td>{test.submissions}</td>
                    <td>
                      <div className="completionCell">
                        <span className="miniProgress"><i style={{ width: `${test.completionRate}%` }} /></span>
                        <strong>{test.completionRate}%</strong>
                      </div>
                    </td>
                    <td>{test.averageScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel cloudPanel">
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
