import { Filter, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Candidate } from "../services/api";

export function Ranking() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    api.get<Candidate[]>("/ranking").then((response) => setCandidates(response.data));
  }, []);

  return (
    <section className="page">
      <article className="panel">
        <div className="panelTitle">
          <div>
            <h1>Ranking de candidatos</h1>
            <p>Total de submissões: {candidates.length}</p>
          </div>
          <button className="secondaryButton"><Filter size={16} /> Filtros</button>
        </div>
        <table className="rankingTable">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Candidato</th>
              <th>Teste</th>
              <th>Pontuação</th>
              <th>Tempo</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr className={candidate.name === "João Silva" ? "highlight" : ""} key={`${candidate.id}-${index}`}>
                <td><Medal size={18} className={`medal medal-${index}`} /> {index + 1}º</td>
                <td>{candidate.name}</td>
                <td>{candidate.testTitle}</td>
                <td>{candidate.score}%</td>
                <td>{candidate.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
