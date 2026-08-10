import { ArrowLeft, ArrowRight, Copy, Edit, Plus, Save, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type AssessmentTest, type Question } from "../services/api";

const defaultOptions = ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"].join("\n");

export function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(searchParams.get("testId") ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [statement, setStatement] = useState("");
  const [type, setType] = useState<Question["type"]>("objective");
  const [category, setCategory] = useState("Conhecimentos técnicos");
  const [score, setScore] = useState(10);
  const [optionsText, setOptionsText] = useState(defaultOptions);
  const [answer, setAnswer] = useState("Alternativa A");
  const [saving, setSaving] = useState(false);

  const options = useMemo(
    () => optionsText.split("\n").map((option) => option.trim()).filter(Boolean),
    [optionsText]
  );

  function loadQuestions(testId = selectedTestId) {
    if (!testId) return;
    api.get<Question[]>(`/questions?testId=${testId}`).then((response) => setQuestions(response.data));
  }

  function resetForm() {
    setEditingQuestionId("");
    setStatement("");
    setType("objective");
    setCategory("Conhecimentos técnicos");
    setScore(10);
    setOptionsText(defaultOptions);
    setAnswer("Alternativa A");
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

  async function saveQuestion(event: FormEvent) {
    event.preventDefault();
    if (!statement.trim() || !selectedTestId || saving) return;

    const payload = {
      statement: statement.trim(),
      type,
      score,
      category: category.trim(),
      options: type === "objective" ? options : null,
      answer: type === "objective" ? answer || options[0] || "" : null
    };

    if (type === "objective" && options.length < 2) {
      window.alert("Cadastre pelo menos duas alternativas para questões objetivas.");
      return;
    }

    setSaving(true);
    try {
      if (editingQuestionId) {
        await api.put(`/questions/${editingQuestionId}`, payload);
      } else {
        await api.post("/questions", { testId: selectedTestId, ...payload });
      }
      resetForm();
      loadQuestions();
    } finally {
      setSaving(false);
    }
  }

  function editQuestion(question: Question) {
    setEditingQuestionId(question.id);
    setStatement(question.statement);
    setType(question.type);
    setCategory(question.category);
    setScore(question.score);
    setOptionsText(question.options?.join("\n") || defaultOptions);
    setAnswer(question.answer || question.options?.[0] || "");
  }

  async function duplicateQuestion(question: Question) {
    await api.post("/questions", {
      testId: selectedTestId,
      statement: `${question.statement} (cópia)`,
      type: question.type,
      score: question.score,
      category: question.category,
      options: question.options ?? null,
      answer: question.answer ?? null
    });
    loadQuestions();
  }

  async function deleteQuestion(id: string) {
    const shouldDelete = window.confirm("Excluir esta questão definitivamente?");
    if (!shouldDelete) return;
    await api.delete(`/questions/${id}`);
    if (editingQuestionId === id) resetForm();
    loadQuestions();
  }

  function changeTest(testId: string) {
    setSelectedTestId(testId);
    setSearchParams({ testId });
    resetForm();
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
            <p>Crie, edite, duplique e remova perguntas que alimentam a prova real do candidato.</p>
          </div>
          <label className="selectCompact">Teste
            <select value={selectedTestId} onChange={(event) => changeTest(event.target.value)}>
              {tests.map((test) => <option value={test.id} key={test.id}>{test.title}</option>)}
            </select>
          </label>
        </div>

        <form className="questionForm" onSubmit={saveQuestion}>
          <div className="questionFormHeader">
            <strong>{editingQuestionId ? "Editar questão" : "Nova questão"}</strong>
            {editingQuestionId && (
              <button type="button" className="secondaryButton compact" onClick={resetForm}>
                <X size={16} /> Cancelar edição
              </button>
            )}
          </div>
          <label>Enunciado
            <textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Ex.: Qual prática reduz risco ao armazenar senhas de usuários?" />
          </label>
          <div className="questionFormGrid">
            <label>Tipo
              <select value={type} onChange={(event) => setType(event.target.value as Question["type"])}>
                <option value="objective">Objetiva</option>
                <option value="discursive">Discursiva</option>
              </select>
            </label>
            <label>Categoria
              <input value={category} onChange={(event) => setCategory(event.target.value)} />
            </label>
            <label>Pontuação
              <input type="number" min={1} value={score} onChange={(event) => setScore(Number(event.target.value))} />
            </label>
          </div>
          {type === "objective" && (
            <div className="questionFormGrid wideFields">
              <label>Alternativas
                <textarea value={optionsText} onChange={(event) => setOptionsText(event.target.value)} placeholder="Uma alternativa por linha" />
              </label>
              <label>Resposta correta
                <select value={answer} onChange={(event) => setAnswer(event.target.value)}>
                  {options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
          )}
          <button className="primaryButton alignRight" disabled={saving}>
            {editingQuestionId ? <Save size={16} /> : <Plus size={16} />}
            {saving ? "Salvando..." : editingQuestionId ? "Atualizar questão" : "Adicionar questão"}
          </button>
        </form>

        <div className="questionList">
          {questions.map((question, index) => (
            <div className="questionRow" key={question.id}>
              <strong>{index + 1}. {question.statement}</strong>
              <span className="tag">{question.type === "objective" ? "Objetiva" : "Discursiva"}</span>
              <span>{question.category}</span>
              <span>{question.score} pts</span>
              <button type="button" onClick={() => duplicateQuestion(question)} aria-label="Duplicar questão"><Copy size={15} /></button>
              <button type="button" onClick={() => editQuestion(question)} aria-label="Editar questão"><Edit size={15} /></button>
              <button type="button" onClick={() => deleteQuestion(question.id)} aria-label="Excluir questão"><Trash2 size={15} /></button>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="emptyState">
              <strong>Nenhuma questão cadastrada ainda.</strong>
              <span>Cadastre a primeira pergunta para liberar a prova do candidato.</span>
            </div>
          )}
        </div>

        <div className="footerActions">
          <Link className="secondaryButton" to="/tests/new"><ArrowLeft size={16} /> Voltar</Link>
          <Link className="primaryButton compact" to={`/candidates?testId=${selectedTestId}`}>Convidar candidatos <ArrowRight size={16} /></Link>
        </div>
      </article>
    </section>
  );
}
