import { CheckCircle2, ChevronDown, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type SubmissionResult } from "../services/api";

export function Result() {
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    api.get<SubmissionResult>("/submissions/latest").then((response) => setResult(response.data));
  }, []);

  if (!result) {
    return <div className="loading">Carregando resultado...</div>;
  }

  return (
    <section className="page resultGrid">
      <article className="resultCard">
        <CheckCircle2 className="successIcon" size={44} />
        <h1>Parabéns, {result.candidate}!</h1>
        <p>Você concluiu o teste {result.testTitle} com sucesso.</p>
        <span>Sua pontuação</span>
        <strong className="score">{result.score}%</strong>
        <small>{result.score} de 100 pontos</small>
        <div className="resultStats">
          <div><small>Classificação geral</small><strong>Top 5</strong></div>
          <div><small>Tempo de conclusão</small><strong>{result.time}</strong></div>
        </div>
        <Link className="primaryButton compact" to="/ranking">Ver ranking completo</Link>
        <button className="secondaryButton">Ver detalhamento <ChevronDown size={16} /></button>
      </article>
      <article className="panel">
        <h2>Desempenho por categoria</h2>
        {result.categoryPerformance.map((category, index) => (
          <div className="progressLine" key={category.category}>
            <div><span>{category.category}</span><strong>{category.score}%</strong></div>
            <span className={`progress ${index === 0 ? "blue" : index === 3 ? "orange" : "green"}`}><i style={{ width: `${category.score}%` }} /></span>
          </div>
        ))}
        <div className="feedback">
          <Trophy size={20} />
          <div>
            <strong>Feedback geral</strong>
            <p>{result.feedback}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
