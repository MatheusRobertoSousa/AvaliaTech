import { ArrowRight, ClipboardCheck, Edit, Plus, Trash2, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "../components/MetricCard";
import { api, type DashboardResponse } from "../services/api";

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  function loadDashboard() {
    api.get<DashboardResponse>("/dashboard").then((response) => setDashboard(response.data));
  }

  useEffect(loadDashboard, []);

  async function deleteTest(id: string) {
    await api.delete(`/tests/${id}`);
    loadDashboard();
  }

  if (!dashboard) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Olá, {dashboard.company}!</h1>
          <p>Aqui está um resumo dos seus processos seletivos.</p>
        </div>
        <Link className="primaryButton compact" to="/tests/new"><Plus size={16} /> Criar novo teste</Link>
      </header>

      <div className="metricsGrid">
        <MetricCard label="Testes ativos" value={dashboard.metrics.activeTests} icon={ClipboardCheck} />
        <MetricCard label="Candidatos avaliados" value={dashboard.metrics.candidatesEvaluated} icon={Users} tone="teal" />
        <MetricCard label="Taxa de conclusão" value={`${dashboard.metrics.completionRate}%`} icon={Zap} tone="green" />
        <MetricCard label="Média geral" value={`${dashboard.metrics.averageScore}%`} icon={ClipboardCheck} tone="amber" />
      </div>

      <div className="dashboardGrid">
        <article className="panel wide">
          <div className="panelTitle">
            <h2>Testes recentes</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome do Teste</th>
                <th>Criado em</th>
                <th>Candidatos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentTests.map((test) => (
                <tr key={test.id}>
                  <td>{test.title}</td>
                  <td>{new Date(`${test.createdAt}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                  <td>{test.candidates}</td>
                  <td><span className={`badge ${test.status}`}>{test.status === "active" ? "Ativo" : test.status === "draft" ? "Rascunho" : "Finalizado"}</span></td>
                  <td className="actions">
                    <Link to={`/questions?testId=${test.id}`}><Edit size={15} /></Link>
                    <button onClick={() => deleteTest(test.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link className="textLink" to="/questions">Ver todos os testes <ArrowRight size={15} /></Link>
        </article>

        <aside className="panel">
          <h2>Desempenho geral</h2>
          <div className="donut" style={{ "--score": `${dashboard.metrics.completionRate}%` } as React.CSSProperties}>
            <strong>{dashboard.metrics.completionRate}%</strong>
          </div>
          <div className="legend"><span className="dot blue" /> Concluídos <strong>{dashboard.metrics.completionRate}%</strong></div>
          <div className="legend"><span className="dot soft" /> Em andamento <strong>{100 - dashboard.metrics.completionRate}%</strong></div>
          <h3>Atividade recente</h3>
          {dashboard.activity.map((item) => <p className="activity" key={item}>{item}</p>)}
        </aside>
      </div>
    </section>
  );
}
