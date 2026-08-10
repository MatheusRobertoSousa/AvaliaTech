import { AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type SubmissionResult } from "../services/api";

export function Result() {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const endpoint = submissionId ? `/submissions/${submissionId}` : "/submissions/latest";
    api.get<SubmissionResult>(endpoint)
      .then((response) => setResult(response.data))
      .catch((requestError) => {
        const message = requestError?.response?.data?.message ?? "Resultado não encontrado.";
        setError(message);
      });
  }, [submissionId]);

  if (error) {
    return (
      <section className="page centeredState">
        <article className="panel stateCard">
          <AlertCircle size={38} />
          <h1>Resultado indisponível</h1>
          <p>{error}</p>
          <Link className="secondaryButton" to="/">Voltar</Link>
        </article>
      </section>
    );
  }

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
          <div><small>Classificação geral</small><strong>Atualizada</strong></div>
          <div><small>Tempo de conclusão</small><strong>{result.time}</strong></div>
        </div>
        <Link className="primaryButton compact" to="/">Finalizar</Link>
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
