import { Copy, Mail, Plus, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type AssessmentTest, type Candidate, type CandidateInvite } from "../services/api";

export function Candidates() {
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(searchParams.get("testId") ?? "");
  const [name, setName] = useState("Carla Mendes");
  const [email, setEmail] = useState("carla.mendes@email.com");
  const [inviteUrl, setInviteUrl] = useState("");

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
    const response = await api.post<CandidateInvite>("/candidates", { name, email, testId: selectedTestId });
    setInviteUrl(`${window.location.origin}${response.data.inviteUrl}`);
    setName("");
    setEmail("");
    loadCandidates();
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Candidatos</h1>
          <p>Convide pessoas para realizar o teste e acompanhe o status do processo.</p>
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
            <label>Nome do candidato<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <button className="primaryButton"><Send size={16} /> Gerar convite</button>
          </form>
          {inviteUrl && (
            <div className="inviteBox">
              <span><Mail size={16} /> Link gerado para teste de usabilidade</span>
              <strong>{inviteUrl}</strong>
              <button className="secondaryButton" onClick={copyInvite}><Copy size={16} /> Copiar link</button>
            </div>
          )}
        </article>

        <article className="panel wide">
          <div className="panelTitle">
            <h2>Lista de candidatos</h2>
            <span className="tag">{candidates.length} pessoas</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Candidato</th>
                <th>E-mail</th>
                <th>Teste</th>
                <th>Pontuação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.testTitle}</td>
                  <td>{candidate.score}%</td>
                  <td><span className={`badge ${candidate.status}`}>{candidate.status === "approved" ? "Aprovado" : candidate.status === "review" ? "Revisão" : "Pendente"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
