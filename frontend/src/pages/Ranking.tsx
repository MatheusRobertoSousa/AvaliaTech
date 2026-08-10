import { Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { TableSkeleton } from "../components/Skeleton";
import { api, type Candidate } from "../services/api";

export function Ranking() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Candidate[]>("/ranking")
      .then((response) => setCandidates(response.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page">
      <article className="panel">
        <div className="panelTitle">
          <div>
            <h1>Ranking de candidatos</h1>
            <p>Total de submissões: {candidates.length}</p>
          </div>
        </div>
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : candidates.length === 0 ? (
          <div className="emptyState">
            <strong>Nenhuma submissão no ranking ainda.</strong>
            <span>Convide candidatos e aguarde a conclusão das provas para gerar a lista.</span>
          </div>
        ) : (
          <div className="tableScroller">
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
                  <tr className={index === 0 ? "highlight" : ""} key={`${candidate.id}-${index}`}>
                    <td><Medal size={18} className={`medal medal-${index}`} /> {index + 1}º</td>
                    <td>{candidate.name}</td>
                    <td>{candidate.testTitle}</td>
                    <td>{candidate.score}%</td>
                    <td>{candidate.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
