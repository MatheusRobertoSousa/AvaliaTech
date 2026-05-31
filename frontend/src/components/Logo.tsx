import { ShieldCheck } from "lucide-react";

export function Logo() {
  return (
    <div className="logo">
      <span className="logoMark">
        <ShieldCheck size={20} />
      </span>
      <div>
        <strong>AvaliaTech</strong>
        <small>Avaliações inteligentes</small>
      </div>
    </div>
  );
}
