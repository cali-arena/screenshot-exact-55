import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Nivel } from "@/data/plant";
import { NIVEL_LABEL } from "@/data/plant";

export const nivelText: Record<Nivel, string> = { info: "text-ok", atencao: "text-warn", critico: "text-crit" };
export const nivelBg: Record<Nivel, string> = { info: "bg-ok", atencao: "bg-warn", critico: "bg-crit" };
export const nivelBorder: Record<Nivel, string> = { info: "border-ok/50", atencao: "border-warn/60", critico: "border-crit" };

export function NivelBadge({ nivel, className }: { nivel: Nivel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      nivel === "info" && "bg-ok/15 text-ok", nivel === "atencao" && "bg-warn/15 text-warn", nivel === "critico" && "bg-crit/20 text-crit", className)}>
      <span className={cn("size-1.5 rounded-full", nivelBg[nivel], nivel === "critico" && "animate-live")} />
      {NIVEL_LABEL[nivel]}
    </span>
  );
}

export function Counter({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      const e = 1 - Math.pow(1 - p, 3);
      setV(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}

export function Kpi({ label, value, decimals, suffix, icon, tone = "default", hint }: {
  label: string; value: number; decimals?: number; suffix?: string; icon?: ReactNode; tone?: "default" | "ok" | "warn" | "crit"; hint?: string;
}) {
  return (
    <div className="panel relative overflow-hidden px-4 py-3">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        <span className="opacity-70">{icon}</span>
      </div>
      <div className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums",
        tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "crit" && "text-crit")}>
        <Counter value={value} decimals={decimals} suffix={suffix} />
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, right, children, className, ...rest }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; "data-tour"?: string }) {
  return (
    <section className={cn("panel flex min-h-0 flex-col", className)} {...rest}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {right}
        </header>
      )}
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  );
}

export function Seal({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-xs font-medium text-ok">
      {children}
    </div>
  );
}

export function Avatar({ nome, size = 36, className }: { nome: string; size?: number; className?: string }) {
  const ini = nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn("grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-primary-foreground", className)}>
      {ini}
    </div>
  );
}

export const chartTooltip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
  cursor: { fill: "color-mix(in oklab, var(--foreground) 6%, transparent)" },
};
