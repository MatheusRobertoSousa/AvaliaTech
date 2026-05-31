import { BarChart3, ClipboardList, FileText, HelpCircle, LayoutDashboard, Settings, Trophy, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tests/new", label: "Testes", icon: ClipboardList },
  { to: "/questions", label: "Questões", icon: FileText },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/result", label: "Relatórios", icon: BarChart3 },
  { to: "/dashboard", label: "Candidatos", icon: Users },
  { to: "/dashboard", label: "Configurações", icon: Settings }
];

export function AppLayout() {
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
            <HelpCircle size={16} /> Ajuda
          </span>
          <strong>Tech Solutions</strong>
          <small>Empresa</small>
        </div>
      </aside>
      <main className="mainPanel">
        <Outlet />
      </main>
    </div>
  );
}
