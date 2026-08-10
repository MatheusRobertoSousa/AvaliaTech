import { AlertCircle, ArrowRight, Building2, Cloud, FileBarChart, LockKeyhole, Mail, UserRound, Workflow } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/avaliatech-hero.png";
import { Logo } from "../components/Logo";
import { api, type AuthResponse } from "../services/api";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }
  return fallback;
}

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("recrutador@techsolutions.com");
  const [password, setPassword] = useState("123456");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    if (nextMode === "login") {
      setEmail("recrutador@techsolutions.com");
      setPassword("123456");
    } else {
      setCompanyName("");
      setName("");
      setEmail("");
      setPassword("");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = mode === "login"
        ? await api.post<AuthResponse>("/auth/login", { email, password })
        : await api.post<AuthResponse>("/auth/register", { companyName, name, email, password });

      localStorage.setItem("avaliatech.token", response.data.token);
      localStorage.setItem("avaliatech.user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Não foi possível acessar a plataforma."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="brandPanel">
        <img className="brandVisual" src={heroImage} alt="" />
        <Logo />
        <div>
          <span className="eyebrow">ATS + avaliações técnicas</span>
          <h1>Contrate melhor com testes, ranking e relatórios em um só lugar</h1>
          <p>Uma operação simples para PMEs criarem avaliações, convidarem candidatos e compararem resultados com segurança.</p>
        </div>
        <ul>
          <li><LockKeyhole size={18} /> Login real com token assinado e senha hasheada</li>
          <li><FileBarChart size={18} /> Indicadores de conclusão, média e desempenho</li>
          <li><Workflow size={18} /> Fluxo completo de teste até ranking</li>
        </ul>
        <span><Cloud size={16} /> Planejado para AWS, PostgreSQL e armazenamento em nuvem</span>
      </section>

      <section className="loginCard">
        <Logo />
        <h2>{mode === "login" ? "Entrar no AvaliaTech" : "Criar workspace"}</h2>
        <p>{mode === "login" ? "Use a conta demonstrativa ou uma conta cadastrada." : "Cadastre empresa e recrutador para começar."}</p>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Entrar</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Criar conta</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="inlineAlert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          {mode === "register" && (
            <>
              <label>
                Empresa
                <span className="inputIcon"><Building2 size={16} /><input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Nome da empresa" /></span>
              </label>
              <label>
                Nome do recrutador
                <span className="inputIcon"><UserRound size={16} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" /></span>
              </label>
            </>
          )}
          <label>
            E-mail
            <span className="inputIcon"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></span>
          </label>
          <label>
            Senha
            <span className="inputIcon"><LockKeyhole size={16} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></span>
          </label>
          <button
            className="primaryButton"
            type="submit"
            disabled={saving || (mode === "register" && (!companyName || !name))}
          >
            {saving ? "Acessando..." : mode === "login" ? "Acessar plataforma" : "Criar e acessar"} <ArrowRight size={16} />
          </button>
        </form>
        <small>Demo: recrutador@techsolutions.com / 123456</small>
      </section>
    </main>
  );
}
