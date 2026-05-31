import { CheckCircle2, ChevronDown, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { label: "HTML / CSS", score: 90, color: "blue" },
  { label: "JavaScript", score: 80, color: "green" },
  { label: "Lógica de Programação", score: 85, color: "green" },
  { label: "UI/UX Básico", score: 70, color: "orange" }
];

export function Result() {
  return (
    <section className="page resultGrid">
      <article className="resultCard">
        <CheckCircle2 className="successIcon" size={44} />
        <h1>Parabéns, João!</h1>
        <p>Você concluiu o teste com sucesso.</p>
        <span>Sua pontuação</span>
        <strong className="score">85%</strong>
        <small>85 de 100 pontos</small>
        <div className="resultStats">
          <div><small>Classificação geral</small><strong>5º Lugar</strong></div>
          <div><small>Tempo de conclusão</small><strong>42:15</strong></div>
        </div>
        <Link className="primaryButton compact" to="/ranking">Ver ranking completo</Link>
        <button className="secondaryButton">Ver detalhamento <ChevronDown size={16} /></button>
      </article>
      <article className="panel">
        <h2>Desempenho por categoria</h2>
        {categories.map((category) => (
          <div className="progressLine" key={category.label}>
            <div><span>{category.label}</span><strong>{category.score}%</strong></div>
            <span className={`progress ${category.color}`}><i style={{ width: `${category.score}%` }} /></span>
          </div>
        ))}
        <div className="feedback">
          <Trophy size={20} />
          <div>
            <strong>Feedback geral</strong>
            <p>Excelente desempenho. Você demonstrou domínio dos principais conceitos avaliados. Continue assim!</p>
          </div>
        </div>
      </article>
    </section>
  );
}
