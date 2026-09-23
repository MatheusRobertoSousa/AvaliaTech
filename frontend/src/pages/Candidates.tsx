import { CheckCircle2, Copy, Mail, Send, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MetricSkeleton, TableSkeleton } from "../components/Skeleton";
import { api, type AssessmentTest, type Candidate, type CandidateInvite } from "../services/api";

const invitationLabels: Record<string, string> = {
  invited: "Convite enviado",
  started: "Prova iniciada",
  completed: "Concluído",
  expired: "Expirado"
};

const candidateStatusLabels: Record<Candidate["status"], string> = {
  approved: "Aprovado",
  review: "Em revisão",
  pending: "Pendente",
  rejected: "Recusado"
};

export function Candidates() {
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(searchParams.get("testId") ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [decidingCandidateId, setDecidingCandidateId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function showError(error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    setError(message ?? "Não foi possível atualizar os candidatos. Tente novamente.");
  }

  function loadCandidates() {
    return api.get<Candidate[]>("/candidates").then((response) => setCandidates(response.data));
  }

  useEffect(() => {
    Promise.all([
      api.get<AssessmentTest[]>("/tests").then((response) => {
        setTests(response.data);
        setSelectedTestId((current) => current || response.data[0]?.id || "");
      }),
      loadCandidates()
    ]).catch(showError).finally(() => setLoading(false));
    const refresh = () => { loadCandidates().catch(showError); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  async function inviteCandidate(event: FormEvent) {
    event.preventDefault();
    if (!selectedTestId || !name.trim() || !email.trim() || saving) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post<CandidateInvite>("/candidates", { name, email, testId: selectedTestId });
      setInviteUrl(`${window.location.origin}${response.data.inviteUrl}`);
      setName("");
      setEmail("");
      await loadCandidates();
      setNotice("Convite disponível. Um convite ainda ativo para o mesmo e-mail e teste é reutilizado.");
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try { await navigator.clipboard.writeText(inviteUrl); setNotice("Link copiado."); } catch { setError("Não foi possível copiar. Selecione e copie o link do convite."); }
  }

  async function copyCandidateInvite(candidate: Candidate) {
    if (!candidate.inviteUrl) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}${candidate.inviteUrl}`); setNotice("Link copiado."); } catch { setError("Não foi possível copiar o link."); }
  }

  async function decideCandidate(candidate: Candidate, status: "approved" | "rejected" | "review") {
    setDecidingCandidateId(candidate.invitationId);
    setError("");
    try {
      const response = await api.patch<Candidate>(`/candidates/${candidate.id}/status`, { status, invitationId: candidate.invitationId });
      setCandidates((current) => current.map((item) => item.invitationId === candidate.invitationId ? response.data : item));
    } catch (error) {
      showError(error);
    } finally {
      setDecidingCandidateId("");
    }
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Candidatos</h1>
          <p>Convide pessoas, acompanhe pendências e decida candidatos em revisão.</p>
        </div>
      </header>

      {error && <div className="inlineAlert" role="alert">{error}</div>}
      {notice && <p role="status">{notice}</p>}

      {loading ? (
        <>
          <MetricSkeleton count={3} />
          <article className="panel wide">
            <TableSkeleton rows={6} columns={5} />
          </article>
        </>
      ) : (
        <div className="splitGrid candidatesGrid">
          <article className="panel">
            <h2>Novo convite</h2>
            <form onSubmit={inviteCandidate}>
              <label>Teste
                <select value={selectedTestId} onChange={(event) => setSelectedTestId(event.target.value)}>
                  {tests.map((test) => <option value={test.id} key={test.id}>{test.title}</option>)}
                </select>
              </label>
              <label>Nome do candidato
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Carla Mendes" />
              </label>
              <label>E-mail
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="candidato@email.com" />
              </label>
              <button className="primaryButton" disabled={!selectedTestId || !name || !email || saving}>
                <Send size={16} /> {saving ? "Gerando..." : "Gerar convite"}
              </button>
            </form>
            {inviteUrl && (
              <div className="inviteBox">
                <span><Mail size={16} /> Link pronto para envio ao candidato</span>
                <strong>{inviteUrl}</strong>
                <button className="secondaryButton" onClick={copyInvite}><Copy size={16} /> Copiar link</button>
              </div>
            )}
          </article>

          <article className="panel wide candidatePanel">
            <div className="panelTitle">
              <div>
                <h2>Pipeline de candidatos</h2>
                <p>{new Set(candidates.map(candidate => candidate.id)).size} pessoas · {candidates.length} participações. Cada convite mantém seu próprio resultado e decisão.</p>
              </div>
              <button type="button" className="secondaryButton" onClick={() => { setError(""); loadCandidates().catch(showError); }}>Atualizar</button>
            </div>

            <div className="candidatePipeline">
              {candidates.length === 0 && <p>Nenhum candidato convidado. Selecione um teste e gere o primeiro convite.</p>}
              {candidates.map((candidate) => (
                <article className="candidateCardRow" key={candidate.invitationId}>
                  <div className="candidateIdentity">
                    <strong>{candidate.name}</strong>
                    <span>{candidate.email}</span>
                  </div>

                  <div className="candidateMeta">
                    <small>Teste</small>
                    <strong>{candidate.testTitle}</strong>
                  </div>

                  <div className="candidateScore">
                    <small>Pontuação</small>
                    <strong>{candidate.score !== null ? `${candidate.score}%` : "—"}</strong>
                  </div>

                  <div className="candidateStatus">
                    <small>Status</small>
                    <span className={`badge ${candidate.status}`}>
                      {candidateStatusLabels[candidate.status]}
                    </span>
                  </div>

                  <div className="candidateActions">
                    <button
                      className={`linkButton ${candidate.invitationStatus ?? "invited"}`}
                      type="button"
                      onClick={() => copyCandidateInvite(candidate)}
                      disabled={!candidate.inviteUrl || candidate.invitationStatus === "completed"}
                      title={candidate.inviteUrl ? "Copiar link do convite" : "Sem convite ativo"}
                    >
                      <Copy size={14} />
                      {invitationLabels[candidate.invitationStatus ?? "invited"] ?? "Convite"}
                    </button>

                    {candidate.status === "review" ? (
                      <div className="decisionActions">
                        <button
                          type="button"
                          className="decisionButton approve"
                          disabled={decidingCandidateId === candidate.invitationId}
                          onClick={() => decideCandidate(candidate, "approved")}
                        >
                          <CheckCircle2 size={14} /> Aprovar
                        </button>
                        <button
                          type="button"
                          className="decisionButton reject"
                          disabled={decidingCandidateId === candidate.invitationId}
                          onClick={() => decideCandidate(candidate, "rejected")}
                        >
                          <XCircle size={14} /> Recusar
                        </button>
                      </div>
                    ) : (
                      candidate.status === "pending" ? <span className="mutedText">Aguardando prova</span> :
                        <button type="button" className="linkButton" disabled={decidingCandidateId === candidate.invitationId} onClick={() => decideCandidate(candidate, "review")}>Reabrir revisão</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
