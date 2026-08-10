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
    ]).finally(() => setLoading(false));
  }, []);

  async function inviteCandidate(event: FormEvent) {
    event.preventDefault();
    if (!selectedTestId || !name.trim() || !email.trim() || saving) return;

    setSaving(true);
    try {
      const response = await api.post<CandidateInvite>("/candidates", { name, email, testId: selectedTestId });
      setInviteUrl(`${window.location.origin}${response.data.inviteUrl}`);
      setName("");
      setEmail("");
      await loadCandidates();
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
  }

  async function copyCandidateInvite(candidate: Candidate) {
    if (!candidate.inviteUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${candidate.inviteUrl}`);
  }

  async function decideCandidate(candidate: Candidate, status: "approved" | "rejected") {
    setDecidingCandidateId(candidate.id);
    try {
      const response = await api.patch<Candidate>(`/candidates/${candidate.id}/status`, { status });
      setCandidates((current) => current.map((item) => item.id === candidate.id ? response.data : item));
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
                <p>{candidates.length} pessoas cadastradas no processo seletivo</p>
              </div>
            </div>

            <div className="candidatePipeline">
              {candidates.map((candidate) => (
                <article className="candidateCardRow" key={candidate.id}>
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
                    <strong>{candidate.score ? `${candidate.score}%` : "-"}</strong>
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
                          disabled={decidingCandidateId === candidate.id}
                          onClick={() => decideCandidate(candidate, "approved")}
                        >
                          <CheckCircle2 size={14} /> Aprovar
                        </button>
                        <button
                          type="button"
                          className="decisionButton reject"
                          disabled={decidingCandidateId === candidate.id}
                          onClick={() => decideCandidate(candidate, "rejected")}
                        >
                          <XCircle size={14} /> Recusar
                        </button>
                      </div>
                    ) : (
                      <span className="mutedText">
                        {candidate.status === "pending" ? "Aguardando prova" : "Decidido"}
                      </span>
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
