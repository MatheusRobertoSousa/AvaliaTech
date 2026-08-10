import { Copy, Mail, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type AssessmentTest, type Candidate, type CandidateInvite } from "../services/api";

const invitationLabels: Record<string, string> = {
  invited: "Convite enviado",
  started: "Prova iniciada",
  completed: "Concluído",
  expired: "Expirado"
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

  function loadCandidates() {
    api.get<Candidate[]>("/candidates").then((response) => setCandidates(response.data));
  }

  useEffect(() => {
    api.get<AssessmentTest[]>("/tests").then((response) => {
      setTests(response.data);
      setSelectedTestId((current) => current || response.data[0]?.id || "");
    });
    loadCandidates();
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
      loadCandidates();
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

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Candidatos</h1>
          <p>Convide pessoas, acompanhe pendências e monitore resultados por avaliação.</p>
        </div>
      </header>

      <div className="splitGrid">
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

        <article className="panel wide">
          <div className="panelTitle">
            <div>
              <h2>Pipeline de candidatos</h2>
              <p>{candidates.length} pessoas cadastradas no processo seletivo</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Candidato</th>
                <th>E-mail</th>
                <th>Teste</th>
                <th>Pontuação</th>
                <th>Status</th>
                <th>Convite</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.testTitle}</td>
                  <td>{candidate.score ? `${candidate.score}%` : "-"}</td>
                  <td>
                    <span className={`badge ${candidate.status}`}>
                      {candidate.status === "approved" ? "Aprovado" : candidate.status === "review" ? "Em revisão" : "Pendente"}
                    </span>
                  </td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
