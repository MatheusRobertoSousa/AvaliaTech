import { ArrowLeft, ArrowRight, Clock, LogOut } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { api, type AssessmentTest, type Question } from "../services/api";

export function CandidateExam() {
  const navigate = useNavigate();
  const [test, setTest] = useState<AssessmentTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<AssessmentTest[]>("/tests").then(async (response) => {
      const selectedTest = response.data[0];
      setTest(selectedTest);
      if (selectedTest) {
        const questionsResponse = await api.get<Question[]>(`/questions?testId=${selectedTest.id}`);
        setQuestions(questionsResponse.data);
      }
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!test) return;

    await api.post("/submissions", {
      candidateId: "c5",
      testId: test.id,
      durationSeconds: 2535,
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value }))
    });

    navigate("/result");
  }

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] ?? "" : "";

  return (
    <main className="examPage">
      <header className="examHeader">
        <Logo />
        <strong>{test?.title ?? "Carregando teste"}</strong>
        <span><Clock size={16} /> Tempo restante <b>45:20</b></span>
        <a href="/"><LogOut size={16} /> Sair da prova</a>
      </header>
      <form className="examLayout" onSubmit={handleSubmit}>
        <aside className="examNav">
          <h3>Navegação</h3>
          <div className="numberGrid">
            {questions.map((question, index) => (
              <button type="button" className={index === currentIndex ? "active" : answers[question.id] ? "answered" : ""} key={question.id} onClick={() => setCurrentIndex(index)}>
                {index + 1}
              </button>
            ))}
          </div>
          <p><span className="dot blue" /> Respondida</p>
          <p><span className="dot soft" /> Atual</p>
          <p><span className="dot muted" /> Não respondida</p>
        </aside>
        <section className="examCard">
          <h1>{currentQuestion?.statement ?? "Carregando questão..."}</h1>
          {(currentQuestion?.options ?? []).map((option) => (
            <label className={`answer ${selectedAnswer === option ? "selected" : ""}`} key={option}>
              <input type="radio" name="answer" checked={selectedAnswer === option} onChange={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: option }))} />
              {option}
            </label>
          ))}
          {currentQuestion?.type === "discursive" && (
            <textarea placeholder="Digite sua resposta" value={selectedAnswer} onChange={(event) => setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))} />
          )}
          <div className="footerActions">
            <button type="button" className="secondaryButton" onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}><ArrowLeft size={16} /> Anterior</button>
            {currentIndex < questions.length - 1 ? (
              <button type="button" className="primaryButton compact" onClick={() => setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))}>Próxima <ArrowRight size={16} /></button>
            ) : (
              <button className="primaryButton compact">Enviar respostas <ArrowRight size={16} /></button>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}
