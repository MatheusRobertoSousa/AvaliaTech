import { ArrowRight, CheckCircle2, FileText, ListChecks } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type AssessmentTest } from "../services/api";

export function TestBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Engenheiro(a) de Software Full Stack");
  const [description, setDescription] = useState("Avaliação de fundamentos web, APIs, modelagem de dados e tomada de decisão técnica.");
  const [difficulty, setDifficulty] = useState("Intermediário");
  const [durationMinutes, setDurationMinutes] = useState(75);
  const [status, setStatus] = useState<AssessmentTest["status"]>("active");
  const [format, setFormat] = useState<"objective" | "mixed">("objective");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const response = await api.post<AssessmentTest>("/tests", { title, description, difficulty, durationMinutes, status });
      navigate(`/questions?testId=${response.data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="steps">
        <strong><CheckCircle2 size={16} /> 1. Informações</strong>
        <span>2. Questões</span>
        <span>3. Convites</span>
        <span>4. Ranking</span>
      </div>
      <form className="builderPanel" onSubmit={handleSubmit}>
        <h1>Informações do teste</h1>
        <p>Defina o escopo da avaliação. Depois você poderá cadastrar perguntas e convidar candidatos.</p>
        <label>Nome do teste<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <div>
          <h3>Formato da avaliação</h3>
          <div className="choiceGrid">
            <button type="button" className={`choice ${format === "objective" ? "active" : ""}`} onClick={() => setFormat("objective")}>
              <ListChecks size={20} /> Objetivas <small>Correção automática e ranking imediato</small>
            </button>
            <button type="button" className={`choice ${format === "mixed" ? "active" : ""}`} onClick={() => setFormat("mixed")}>
              <FileText size={20} /> Mistas <small>Objetivas com discursivas para revisão técnica</small>
            </button>
          </div>
        </div>
        <div className="formGrid">
          <label>Nível de dificuldade
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option>Intermediário</option>
              <option>Básico</option>
              <option>Avançado</option>
            </select>
          </label>
          <label>Tempo total
            <input type="number" min={10} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
          </label>
          <label>Status
            <select value={status} onChange={(event) => setStatus(event.target.value as AssessmentTest["status"])}>
              <option value="active">Ativo para convites</option>
              <option value="draft">Rascunho interno</option>
              <option value="finished">Finalizado</option>
            </select>
          </label>
        </div>
        <button className="primaryButton alignRight" disabled={saving}>
          {saving ? "Criando..." : "Continuar"} <ArrowRight size={16} />
        </button>
      </form>
    </section>
  );
}
