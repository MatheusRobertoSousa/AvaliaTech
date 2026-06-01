import { ArrowLeft, ArrowRight, Edit, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, type AssessmentTest, type Question } from "../services/api";

export function Questions() {
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [statement, setStatement] = useState("");

  function loadQuestions(testId = selectedTestId) {
    if (!testId) return;
    api.get<Question[]>(`/questions?testId=${testId}`).then((response) => setQuestions(response.data));
  }

  useEffect(() => {
    api.get<AssessmentTest[]>("/tests").then((response) => {
      setTests(response.data);
      setSelectedTestId(response.data[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    loadQuestions(selectedTestId);
  }, [selectedTestId]);

  async function addQuestion(event: FormEvent) {
    event.preventDefault();
    if (!statement.trim() || !selectedTestId) return;

    await api.post("/questions", {
      testId: selectedTestId,
      statement,
      type: "objective",
      score: 10,
      category: "JavaScript",
      options: ["Alternativa A", "Alternativa B", "Alternativa C"],
      answer: "Alternativa A"
    });

    setStatement("");
    loadQuestions();
  }

  return (
    <section className="page">
      <div className="steps">
        <span>1. Informações</span>
        <strong>2. Questões</strong>
        <span>3. Configurações</span>
        <span>4. Revisão</span>
      </div>
      <article className="panel">
        <div className="panelTitle">
          <div>
            <h1>Questões do teste</h1>
            <p>Adicione e organize as questões do teste selecionado.</p>
          </div>
          <form className="inlineForm" onSubmit={addQuestion}>
            <select value={selectedTestId} onChange={(event) => setSelectedTestId(event.target.value)}>
              {tests.map((test) => <option value={test.id} key={test.id}>{test.title}</option>)}
            </select>
            <input placeholder="Nova questão" value={statement} onChange={(event) => setStatement(event.target.value)} />
            <button className="primaryButton compact"><Plus size={16} /> Adicionar</button>
          </form>
        </div>
        <div className="questionList">
          {questions.map((question, index) => (
            <div className="questionRow" key={question.id}>
              <strong>{index + 1}. {question.statement}</strong>
              <span className="tag">{question.type === "objective" ? "Objetiva" : "Discursiva"}</span>
              <span>{question.score} pts</span>
              <button><Plus size={15} /></button>
              <button><Edit size={15} /></button>
              <button><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="footerActions">
          <button className="secondaryButton"><ArrowLeft size={16} /> Anterior</button>
          <a className="primaryButton compact" href="/exam">Abrir prova <ArrowRight size={16} /></a>
        </div>
      </article>
    </section>
  );
}
