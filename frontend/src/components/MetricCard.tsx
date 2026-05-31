import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "blue" | "green" | "teal" | "amber";
};

export function MetricCard({ label, value, icon: Icon, tone = "blue" }: MetricCardProps) {
  return (
    <article className={`metricCard ${tone}`}>
      <span>
        <Icon size={19} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
