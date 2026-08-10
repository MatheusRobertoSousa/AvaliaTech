import { ArrowRight, Building2, Cloud, FileBarChart, LockKeyhole, Mail, Workflow } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/avaliatech-hero.png";
import { Logo } from "../components/Logo";
import { api } from "../services/api";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("recrutador@techsolutions.com");
  const [password, setPassword] = useState("123456");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "login") {
      await api.post("/auth/login", { email, password });
    } else {
      await api.post("/auth/register", {
        companyName: "Nexa People Consultoria",
        name: "Marina Duarte",
        email,
        password
      });
    }
    navigate("/dashboard");
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
          <li><LockKeyhole size={18} /> Banco persistente com dados realistas de demonstração</li>
          <li><FileBarChart size={18} /> Indicadores de conclusão, média e desempenho</li>
          <li><Workflow size={18} /> Fluxo completo de teste até ranking</li>
        </ul>
        <span><Cloud size={16} /> Planejado para AWS, PostgreSQL e armazenamento em nuvem</span>
      </section>

      <section className="loginCard">
        <Logo />
        <h2>Entrar no AvaliaTech</h2>
        <p>Use a conta demonstrativa para acessar o ambiente do recrutador.</p>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Entrar</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Criar conta</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <span className="inputIcon"><Mail size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} /></span>
          </label>
          <label>
            Senha
            <span className="inputIcon"><Building2 size={16} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></span>
          </label>
          <div className="formLine">
            <label className="check"><input type="checkbox" /> Manter conectado</label>
            <a>Recuperar acesso</a>
          </div>
          <button className="primaryButton" type="submit">Acessar plataforma <ArrowRight size={16} /></button>
        </form>
        <small>Demo: recrutador@techsolutions.com / 123456</small>
      </section>
    </main>
  );
}
