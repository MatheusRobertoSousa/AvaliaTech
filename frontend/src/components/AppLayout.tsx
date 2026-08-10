import { BarChart3, ClipboardList, FileText, HelpCircle, LayoutDashboard, Trophy, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tests/new", label: "Testes", icon: ClipboardList },
  { to: "/questions", label: "Questões", icon: FileText },
  { to: "/candidates", label: "Candidatos", icon: Users },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/reports", label: "Relatórios", icon: BarChart3 }
];

export function AppLayout() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("avaliatech.user");
  const user = storedUser ? JSON.parse(storedUser) as { name: string; company: string; role: string } : null;

  function logout() {
    localStorage.removeItem("avaliatech.token");
    localStorage.removeItem("avaliatech.user");
    navigate("/");
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <Logo />
        <nav>
          {navItems.map((item) => (
            <NavLink key={`${item.label}-${item.to}`} to={item.to}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebarFooter">
          <span>
            <HelpCircle size={16} /> Sessão ativa
          </span>
          <strong>{user?.company ?? "AvaliaTech"}</strong>
          <small>{user?.name ?? "Recrutador"}</small>
          <button className="logoutButton" onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="mainPanel">
        <Outlet />
      </main>
    </div>
  );
}
