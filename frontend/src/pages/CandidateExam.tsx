import { ArrowLeft, ArrowRight, Clock, LogOut } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { api, type Question } from "../services/api";

export function CandidateExam() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("let permite reatribuição e const cria constantes.");

  useEffect(() => {
    api.get<Question[]>("/questions?testId=test-frontend").then((response) => setQuestions(response.data));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.post("/submissions", {
      candidateId: "c5",
      testId: "test-frontend",
      answers: [{ questionId: "q2", value: selectedAnswer }]
    });
    navigate("/result");
  }

  const currentQuestion = questions[1] ?? questions[0];

  return (
    <main className="examPage">
      <header className="examHeader">
        <Logo />
        <strong>Desenvolvedor Frontend</strong>
        <span><Clock size={16} /> Tempo restante <b>45:20</b></span>
        <a href="/"><LogOut size={16} /> Sair da prova</a>
      </header>
      <form className="examLayout" onSubmit={handleSubmit}>
        <aside className="examNav">
          <h3>Navegação</h3>
          <div className="numberGrid">
            {Array.from({ length: 10 }, (_, index) => <button type="button" className={index === 1 ? "active" : ""} key={index}>{index + 1}</button>)}
          </div>
          <p><span className="dot blue" /> Respondida</p>
          <p><span className="dot soft" /> Atual</p>
          <p><span className="dot muted" /> Não respondida</p>
        </aside>
        <section className="examCard">
          <h1>{currentQuestion?.statement ?? "Carregando questão..."}</h1>
          {(currentQuestion?.options ?? []).map((option) => (
            <label className={`answer ${selectedAnswer === option ? "selected" : ""}`} key={option}>
              <input type="radio" name="answer" checked={selectedAnswer === option} onChange={() => setSelectedAnswer(option)} />
              {option}
            </label>
          ))}
          <div className="footerActions">
            <button type="button" className="secondaryButton"><ArrowLeft size={16} /> Anterior</button>
            <button className="primaryButton compact">Próxima <ArrowRight size={16} /></button>
          </div>
        </section>
      </form>
    </main>
  );
}
