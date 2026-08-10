import { ArrowLeft, ArrowRight, Edit, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type AssessmentTest, type Question } from "../services/api";

export function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(searchParams.get("testId") ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [statement, setStatement] = useState("");

  function loadQuestions(testId = selectedTestId) {
    if (!testId) return;
    api.get<Question[]>(`/questions?testId=${testId}`).then((response) => setQuestions(response.data));
  }

  useEffect(() => {
    api.get<AssessmentTest[]>("/tests").then((response) => {
      setTests(response.data);
      const nextTestId = selectedTestId || response.data[0]?.id || "";
      setSelectedTestId(nextTestId);
      if (nextTestId) setSearchParams({ testId: nextTestId });
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
      category: "Geral",
      options: ["Alternativa A", "Alternativa B", "Alternativa C"],
      answer: "Alternativa A"
    });

    setStatement("");
    loadQuestions();
  }

  async function deleteQuestion(id: string) {
    await api.delete(`/questions/${id}`);
    loadQuestions();
  }

  function changeTest(testId: string) {
    setSelectedTestId(testId);
    setSearchParams({ testId });
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
            <h1>Banco de questões</h1>
            <p>Selecione um teste, revise perguntas existentes e adicione novas questões objetivas.</p>
          </div>
          <form className="inlineForm" onSubmit={addQuestion}>
            <select value={selectedTestId} onChange={(event) => changeTest(event.target.value)}>
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
              <span>{question.category}</span>
              <span>{question.score} pts</span>
              <button aria-label="Duplicar questão"><Plus size={15} /></button>
              <button aria-label="Editar questão"><Edit size={15} /></button>
              <button onClick={() => deleteQuestion(question.id)} aria-label="Excluir questão"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="footerActions">
          <Link className="secondaryButton" to="/tests/new"><ArrowLeft size={16} /> Voltar</Link>
          <Link className="primaryButton compact" to={`/candidates?testId=${selectedTestId}`}>Convidar candidatos <ArrowRight size={16} /></Link>
        </div>
      </article>
    </section>
  );
}
