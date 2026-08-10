import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, LogOut, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { api, type InvitationExam, type Question, type SubmissionResult } from "../services/api";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }
  return fallback;
}

export function CandidateExam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [exam, setExam] = useState<InvitationExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState(Date.now());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inviteToken) {
      setError("Convite não informado. Solicite um novo link para a empresa recrutadora.");
      setLoading(false);
      return;
    }

    api.get<InvitationExam>(`/invitations/${inviteToken}`)
      .then((response) => {
        if (response.data.invitation.status === "completed" && response.data.invitation.submissionId) {
          navigate(`/result?submissionId=${response.data.invitation.submissionId}`, { replace: true });
          return;
        }

        setExam(response.data);
        setQuestions(response.data.questions);
        setStartedAt(Date.now());
        setRemainingSeconds(response.data.test.durationMinutes * 60);
      })
      .catch((requestError) => setError(getErrorMessage(requestError, "Não foi possível carregar a prova.")))
      .finally(() => setLoading(false));
  }, [inviteToken, navigate]);

  useEffect(() => {
    if (!exam || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [exam, remainingSeconds]);

  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id]?.trim())).length,
    [answers, questions]
  );

  async function submitAnswers() {
    if (!inviteToken || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const response = await api.post<SubmissionResult>("/submissions", {
        invitationToken: inviteToken,
        durationSeconds,
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value }))
      });

      navigate(`/result?submissionId=${response.data.id}`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Não foi possível enviar suas respostas."));
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitAnswers();
  }

  if (loading) {
    return <div className="loading">Carregando prova do candidato...</div>;
  }

  if (error && !exam) {
    return (
      <main className="examPage centeredState">
        <article className="panel stateCard">
          <AlertCircle size={38} />
          <h1>Não foi possível abrir a prova</h1>
          <p>{error}</p>
          <Link className="secondaryButton" to="/">Voltar para o acesso</Link>
        </article>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] ?? "" : "";

  return (
    <main className="examPage">
      <header className="examHeader">
        <Logo />
        <strong>{exam?.test.title ?? "Avaliação técnica"}</strong>
        <span><UserRound size={16} /> {exam?.candidate.name}</span>
        <span><Clock size={16} /> Tempo restante <b>{formatClock(remainingSeconds)}</b></span>
        <Link to="/"><LogOut size={16} /> Sair da prova</Link>
      </header>

      {error && (
        <div className="inlineAlert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form className="examLayout" onSubmit={handleSubmit}>
        <aside className="examNav">
          <h3>Navegação</h3>
          <div className="numberGrid">
            {questions.map((question, index) => (
              <button
                type="button"
                className={index === currentIndex ? "active" : answers[question.id] ? "answered" : ""}
                key={question.id}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p><span className="dot blue" /> Respondida</p>
          <p><span className="dot soft" /> Atual</p>
          <p><span className="dot muted" /> Não respondida</p>
          <div className="examProgress">
            <strong>{answeredCount}/{questions.length}</strong>
            <span>questões respondidas</span>
          </div>
        </aside>

        <section className="examCard">
          <div className="questionMeta">
            <span className="tag">{currentQuestion?.type === "objective" ? "Objetiva" : "Discursiva"}</span>
            <span>{currentQuestion?.category}</span>
            <strong>{currentQuestion?.score} pts</strong>
          </div>
          <h1>{currentQuestion?.statement ?? "Nenhuma questão cadastrada para esta prova."}</h1>

          {currentQuestion?.type === "objective" && (currentQuestion.options ?? []).map((option) => (
            <label className={`answer ${selectedAnswer === option ? "selected" : ""}`} key={option}>
              <input
                type="radio"
                name={`answer-${currentQuestion.id}`}
                checked={selectedAnswer === option}
                onChange={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: option }))}
              />
              {option}
            </label>
          ))}

          {currentQuestion?.type === "discursive" && (
            <textarea
              placeholder="Digite sua resposta com exemplos práticos."
              value={selectedAnswer}
              onChange={(event) => setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))}
            />
          )}

          {currentQuestion?.type === "objective" && !currentQuestion.options?.length && (
            <div className="inlineAlert">
              <AlertCircle size={18} />
              Esta questão objetiva ainda não possui alternativas cadastradas.
            </div>
          )}

          <div className="footerActions">
            <button
              type="button"
              className="secondaryButton"
              onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} /> Anterior
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                className="primaryButton compact"
                onClick={() => setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))}
              >
                Próxima <ArrowRight size={16} />
              </button>
            ) : (
              <button className="primaryButton compact" disabled={submitting || questions.length === 0}>
                <CheckCircle2 size={16} /> {submitting ? "Enviando..." : "Enviar respostas"}
              </button>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}
