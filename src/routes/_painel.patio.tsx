import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Area, AreaChart } from "recharts";
import { Check, Radio, ScanLine, ShieldX, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRANSPORTADORAS, VEICULOS } from "@/data/plant";
import { fmtDur, fmtHora, rng, useEngine, type Truck } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Panel, chartTooltip } from "@/components/cg/ui";
import { LiveFeed } from "@/components/cg/LiveFeed";

export const Route = createFileRoute("/_painel/patio")({
  head: pageHead("Pátio e logística", "Cada caminhão medido da portaria à saída: placa, RFID, pedido JDE e permanência."),
  component: Patio,
});

const COLS = ["Portaria", "Pátio", "Doca", "Saída"];

// fixed charts (seeded)
const HORAS = Array.from({ length: 15 }, (_, i) => ({ h: `${String(i + 6).padStart(2, "0")}h`, entradas: Math.round(2 + rng() * 5 + (i > 2 && i < 10 ? 2 : 0)), saidas: Math.round(1 + rng() * 5 + (i > 4 ? 2 : 0)) }));
const RANK = TRANSPORTADORAS.map((t) => ({ t: t.split(" ")[0], min: t === "Granel Express" ? 53 : Math.round(28 + rng() * 16) })).sort((a, b) => b.min - a.min);
const DOCAS_DIA = Array.from({ length: 15 }, (_, i) => ({ h: `${String(i + 6).padStart(2, "0")}h`, ocup: Math.round(30 + rng() * 55 + (i > 3 && i < 11 ? 15 : 0)) }));

function cron(ms: number) {
  return ms > 90 * 60000 ? "text-crit" : ms > 60 * 60000 ? "text-warn" : "text-ok";
}

function TruckCard({ t, now }: { t: Truck; now: number }) {
  const dur = now - t.entrada;
  const red = dur > 90 * 60000 || !t.agendado;
  return (
    <div className={cn("animate-feed-in rounded-lg border bg-surface p-2.5 text-xs", red ? "border-crit shadow-glow" : dur > 60 * 60000 ? "border-warn/70" : "border-border")}>
      <div className="flex items-center justify-between">
        <span className="rounded bg-foreground px-1.5 py-0.5 font-mono text-[12px] font-bold tracking-wider text-ink">{t.placa}</span>
        <span className={cn("font-mono text-[12px] font-semibold tabular-nums", t.agendado ? cron(dur) : "text-crit")}>{fmtDur(dur)}</span>
      </div>
      <div className="mt-1.5 truncate font-medium">{t.transportadora}</div>
      <div className="text-muted-foreground">{t.tipo} · {t.produto} · {t.embalagem}</div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{t.rfid}</span>
        <span className={t.pedido ? "" : "font-semibold text-crit"}>{t.pedido ?? "SEM PEDIDO"}</span>
      </div>
      {t.doca && <div className="mt-1 text-[10px] font-semibold text-primary">Doca 0{t.doca}</div>}
    </div>
  );
}

function GateAnimation() {
  const gate = useEngine((s) => s.gate);
  const [step, setStep] = useState(0);
  const [chars, setChars] = useState(0);
  useEffect(() => {
    if (!gate) return;
    setStep(1); setChars(0);
    const ts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 7; i++) ts.push(setTimeout(() => setChars(i), 120 * i));
    ts.push(setTimeout(() => setStep(2), 1100), setTimeout(() => setStep(3), 1800), setTimeout(() => setStep(4), 2500));
    return () => ts.forEach(clearTimeout);
  }, [gate?.seq]);
  const placa = gate?.placa ?? "CQB4E21";
  return (
    <Panel title="Portaria · leitura ao vivo" data-tour="portaria" right={<span className="font-mono text-[11px] text-muted-foreground">CAM-01 · RFID-01</span>}>
      <div className="grid grid-cols-[1.3fr_1fr] gap-3">
        <div className="relative">
          <LiveFeed camId="CAM-01" />
          {step === 1 && <div className="pointer-events-none absolute inset-x-0 h-0.5 animate-scan bg-primary shadow-glow" />}
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <Row on={step >= 1} icon={<ScanLine className="size-4" />} label="OCR da placa">
            <span className="font-mono text-base font-bold tracking-[0.2em]">
              {placa.split("").map((c, i) => <span key={i} className={i < chars ? "" : "opacity-15"}>{c}</span>)}
            </span>
          </Row>
          <Row on={step >= 2} icon={<Radio className="size-4" />} label="Leitura RFID"><span className="font-mono">{step >= 2 ? (gate?.rfid ?? "E200 9387 8794") : "…"}</span></Row>
          <Row on={step >= 3} icon={<Database className="size-4" />} label="Agendamento JDE"><span className="font-mono">{step >= 3 ? (gate?.pedido ?? (gate ? "não encontrado" : "PV-048210")) : "consultando…"}</span></Row>
          <div className={cn("mt-auto grid place-items-center rounded-lg border-2 py-3 text-lg font-bold uppercase tracking-widest transition-all",
            step < 4 && gate ? "border-border text-muted-foreground" : gate && !gate.agendado ? "border-crit bg-crit/15 text-crit animate-ring" : "border-ok bg-ok/10 text-ok")}>
            {step < 4 && gate ? "Verificando…" : gate && !gate.agendado ? <span className="flex items-center gap-2"><ShieldX className="size-5" />Não agendado</span> : <span className="flex items-center gap-2"><Check className="size-5" />Liberado</span>}
          </div>
        </div>
      </div>
    </Panel>
  );
}
function Row({ on, icon, label, children }: { on: boolean; icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md bg-surface p-2 transition-opacity", on ? "opacity-100" : "opacity-40")}>
      <span className="text-primary">{icon}</span>
      <div className="flex-1"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>{children}</div>
      {on && <Check className="size-4 animate-check text-ok" />}
    </div>
  );
}

function Patio() {
  const trucks = useEngine((s) => s.trucks);
  const now = useEngine((s) => s.now);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("todos");
  const docas = [1, 2, 3, 4].map((d) => trucks.find((t) => t.etapa === 2 && t.doca === d));
  const tabela = useMemo(() => {
    const live = trucks.map((t) => ({ placa: t.placa, transp: t.transportadora, status: COLS[t.etapa], entrada: t.entrada, perm: now - t.entrada }));
    const hist = VEICULOS.slice(12, 34).map((v, i) => ({ placa: v.placa, transp: v.transportadora, status: "Concluído", entrada: now - (8 - i * 0.3) * 3600000, perm: (22 + ((i * 13) % 50)) * 60000 }));
    return [...live, ...hist].filter((r) => (r.placa + r.transp).toLowerCase().includes(q.toLowerCase()) && (st === "todos" || r.status === st));
  }, [trucks, now, q, st]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Pátio e logística</h1>
        <p className="text-sm text-muted-foreground">Cada caminhão medido da portaria à saída · vídeo × RFID × JD Edwards</p>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <GateAnimation />
        <Panel title="Ocupação das docas">
          <div className="grid h-full grid-cols-2 gap-2">
            {docas.map((t, i) => {
              const dwell = t ? now - t.etapaDesde : 0;
              const estado = !t ? "Livre" : dwell > 15000 ? "Carregando" : "Ocupada";
              return (
                <div key={i} className={cn("rounded-lg border p-3", !t ? "border-ok/40 bg-ok/5" : estado === "Carregando" ? "border-primary/60 bg-primary/10" : "border-warn/60 bg-warn/10")}>
                  <div className="flex justify-between text-xs"><b>Doca 0{i + 1}</b><span className={!t ? "text-ok" : estado === "Carregando" ? "text-primary" : "text-warn"}>{estado}</span></div>
                  {t ? <>
                    <div className="mt-2 font-mono text-sm font-bold">{t.placa}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{t.produto} · {t.embalagem}</div>
                    <div className="mt-1 font-mono text-[11px]">na doca há {fmtDur(dwell + 12 * 60000)}</div>
                  </> : <div className="mt-6 text-center text-[11px] text-muted-foreground">aguardando veículo</div>}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-4 gap-3" data-tour="esteira">
        {COLS.map((c, ci) => {
          const list = trucks.filter((t) => t.etapa === ci);
          return (
            <div key={c} className="panel flex min-h-[260px] flex-col p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{ci > 0 && <span className="mr-1 text-muted-foreground">→</span>}{c}</span>
                <span className="rounded-full bg-secondary px-2 font-mono text-xs">{list.length}</span>
              </div>
              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                {list.map((t) => <TruckCard key={t.placa} t={t} now={now} />)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Panel title="Entradas e saídas por hora">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={HORAS}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={10} /><YAxis stroke="var(--muted-foreground)" fontSize={10} width={24} /><Tooltip {...chartTooltip} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="entradas" name="Entradas" stroke="var(--chart-1)" strokeWidth={2} dot={false} /><Line dataKey="saidas" name="Saídas" stroke="var(--chart-3)" strokeWidth={2} dot={false} /></LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Permanência média por transportadora (min)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RANK} layout="vertical"><XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} /><YAxis type="category" dataKey="t" stroke="var(--muted-foreground)" fontSize={10} width={80} /><Tooltip {...chartTooltip} />
              <Bar dataKey="min" name="Minutos" fill="var(--chart-1)" radius={[0, 4, 4, 0]} /></BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Ocupação das docas ao longo do dia (%)">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DOCAS_DIA}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={10} /><YAxis stroke="var(--muted-foreground)" fontSize={10} width={24} /><Tooltip {...chartTooltip} />
              <Area dataKey="ocup" name="Ocupação" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} /></AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="Veículos do dia" right={
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar placa ou transportadora" className="w-64 rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus:border-primary" />
          <select value={st} onChange={(e) => setSt(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
            <option value="todos">Todos os status</option>{[...COLS, "Concluído"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>}>
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground"><tr><th className="py-1.5">Placa</th><th>Transportadora</th><th>Entrada</th><th>Permanência</th><th>Status</th></tr></thead>
          <tbody>
            {tabela.slice(0, 14).map((r) => (
              <tr key={r.placa} className="border-t border-border">
                <td className="py-1.5 font-mono font-semibold">{r.placa}</td><td>{r.transp}</td><td className="font-mono">{fmtHora(r.entrada, false)}</td>
                <td className={cn("font-mono", cron(r.perm))}>{fmtDur(r.perm)}</td><td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
