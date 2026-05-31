import { ArrowRight, CheckCircle2, FileText, ListChecks } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function TestBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Desenvolvedor Frontend");
  const [description, setDescription] = useState("Avaliação de conhecimentos em HTML, CSS, JavaScript e lógica de programação.");
  const [difficulty, setDifficulty] = useState("Intermediário");
  const [durationMinutes, setDurationMinutes] = useState(60);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.post("/tests", { title, description, difficulty, durationMinutes });
    navigate("/questions");
  }

  return (
    <section className="page">
      <div className="steps">
        <strong><CheckCircle2 size={16} /> 1. Informações</strong>
        <span>2. Questões</span>
        <span>3. Configurações</span>
        <span>4. Revisão</span>
      </div>
      <form className="builderPanel" onSubmit={handleSubmit}>
        <h1>Informações do teste</h1>
        <p>Preencha os dados básicos do seu teste.</p>
        <label>Nome do teste<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <div>
          <h3>Tipo de questões</h3>
          <div className="choiceGrid">
            <button type="button" className="choice active"><ListChecks size={20} /> Objetivas <small>Múltipla escolha</small></button>
            <button type="button" className="choice"><FileText size={20} /> Discursivas <small>Respostas abertas</small></button>
          </div>
        </div>
        <div className="formGrid">
          <label>Nível de dificuldade<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>Intermediário</option><option>Básico</option><option>Avançado</option></select></label>
          <label>Tempo total<input type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} /></label>
        </div>
        <button className="primaryButton alignRight">Próximo <ArrowRight size={16} /></button>
      </form>
    </section>
  );
}
