import { ArrowRight, Building2, Cloud, FileBarChart, LockKeyhole, Mail, Workflow } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        companyName: "Tech Solutions",
        name: "Recrutador",
        email,
        password
      });
    }
    navigate("/dashboard");
  }

  return (
    <main className="loginPage">
      <section className="brandPanel">
        <Logo />
        <div>
          <h1>Plataforma completa para avaliações e recrutamento de PMEs</h1>
          <p>Simplicidade, agilidade e inteligência para contratar melhor.</p>
        </div>
        <ul>
          <li><LockKeyhole size={18} /> Avaliações técnicas automatizadas</li>
          <li><FileBarChart size={18} /> Relatórios e rankings inteligentes</li>
          <li><Workflow size={18} /> Processos seletivos mais eficientes</li>
        </ul>
        <span><Cloud size={16} /> Solução em nuvem, segura e escalável</span>
      </section>

      <section className="loginCard">
        <Logo />
        <h2>Bem-vindo(a)!</h2>
        <p>Acesse sua conta para continuar</p>
        <div className="tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Entrar</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Criar conta</button>
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
            <label className="check"><input type="checkbox" /> Lembrar-me</label>
            <a>Esqueceu sua senha?</a>
          </div>
          <button className="primaryButton" type="submit">Entrar <ArrowRight size={16} /></button>
        </form>
        <small>Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade</small>
      </section>
    </main>
  );
}
