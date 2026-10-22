import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { FileText, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { KPIS_MES, TRANSPORTADORAS, ZONAS } from "@/data/plant";
import { rng, useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Panel, chartTooltip } from "@/components/cg/ui";
import { Dossie } from "@/components/cg/Dossie";

export const Route = createFileRoute("/_painel/analytics")({
  head: pageHead("Analytics e fatos recorrentes", "Ocorrências por zona, tipo e turno, mapa de calor de EPI e fatos recorrentes apontados pela IA."),
  component: An,
});

const PER = { hoje: 1, "7 dias": 7, "30 dias": 30 } as const;
const BASE_Z = ZONAS.map((z) => ({ z: z.curto, v: Math.round(1 + rng() * 6 + (z.risco === "critico" ? 4 : 0)) }));
const TIPOS = ["EPI", "Acesso negado", "Permanência", "Estoque", "Sem par", "Intrusão"].map((t) => ({ t, v: Math.round(2 + rng() * 8) }));
const TURNOS = [{ t: "A (06h–14h)", v: 9 }, { t: "B (14h–22h)", v: 13 }, { t: "C (22h–06h)", v: 6 }];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HEAT = DIAS.map((d, di) => Array.from({ length: 24 }, (_, h) => {
  let v = rng() * 2;
  if (h === 6 || h === 14 || h === 22) v += 3;
  if (di === 4 && (h === 13 || h === 14 || h === 15)) v += 5;
  if (di > 4) v *= 0.4;
  return v;
}));
const PERM = TRANSPORTADORAS.map((t) => ({ t: t.split(" ")[0], v: t === "Granel Express" ? 53 : Math.round(30 + rng() * 12) }));
const NEG = [{ n: "NR-20 vencida", v: 21 }, { n: "Fora do turno", v: 17 }, { n: "Área não autorizada", v: 15 }, { n: "Rosto ≠ crachá", v: 10 }];
const NEG_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)"];
const FATOS = [
  "Ausência de EPI se concentra no envase, às sextas, na troca de turno.",
  "Carretas da Granel Express ficam 40% acima da média no pátio.",
  "Acessos ao parque de tanques fora do horário se repetem na escala C.",
  "Tambores fora de posição aparecem sempre após o carregamento da tarde.",
];

function An() {
  const [p, setP] = useState<keyof typeof PER>("30 dias");
  const [pdf, setPdf] = useState(false);
  const m = PER[p];
  const live = useEngine((s) => s.events.filter((e) => e.nivel !== "info").length);
  const k = KPIS_MES;
  const kpis = [
    ["Caminhões atendidos", k.caminhoes_atendidos.toLocaleString("pt-BR")], ["Permanência média", `${k.permanencia_media_min} min`], ["Conformidade EPI", "92,4%"],
    ["Alertas críticos", `${k.alertas_criticos} · ${k.alertas_resolvidos_no_prazo_pct}% no prazo`], ["Acessos negados", k.acessos_negados], ["Passagens sem par", k.passagens_sem_par], ["Horas de vídeo analisadas", "43.200"],
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="text-xl font-semibold">Analytics e fatos recorrentes</h1><p className="text-sm text-muted-foreground">{live} ocorrências registradas hoje até agora</p></div>
        <div className="flex gap-2">
          <div className="flex rounded-md border border-border p-0.5 text-xs">{(Object.keys(PER) as (keyof typeof PER)[]).map((x) => <button key={x} onClick={() => setP(x)} className={cn("rounded px-3 py-1", p === x && "bg-primary text-primary-foreground")}>{x}</button>)}</div>
          <button onClick={() => setPdf(true)} className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground"><FileText className="size-3.5" />Gerar relatório para auditoria</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {kpis.map(([l, v]) => <div key={l as string} className="panel p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div><div className="mt-1 font-mono text-lg font-semibold">{v}</div><div className="text-[10px] text-muted-foreground">no mês</div></div>)}
      </div>
      <div className="grid grid-cols-[1fr_420px] gap-4">
        <Panel title={<span className="flex items-center gap-2"><Repeat className="size-4 text-primary" />Fatos recorrentes que a IA aponta</span>} data-tour="fatos">
          <ul className="grid grid-cols-2 gap-2">{FATOS.map((f) => <li key={f} className="flex gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"><Repeat className="mt-0.5 size-4 shrink-0 text-primary" />{f}</li>)}</ul>
        </Panel>
        <Panel title="Acessos negados por motivo">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart><Pie data={NEG.map((n) => ({ ...n, v: Math.round((n.v * m) / 30) || 1 }))} dataKey="v" nameKey="n" innerRadius={40} outerRadius={70} paddingAngle={2}>{NEG.map((_, i) => <Cell key={i} fill={NEG_COLORS[i]} stroke="none" />)}</Pie><Tooltip {...chartTooltip} /><Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" /></PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Panel title="Ocorrências por zona"><ResponsiveContainer width="100%" height={220}><BarChart data={BASE_Z.map((x) => ({ ...x, v: x.v * m }))}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="z" stroke="var(--muted-foreground)" fontSize={9} interval={0} angle={-35} textAnchor="end" height={60} /><YAxis stroke="var(--muted-foreground)" fontSize={10} width={28} /><Tooltip {...chartTooltip} /><Bar dataKey="v" name="Ocorrências" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Panel>
        <Panel title="Ocorrências por tipo"><ResponsiveContainer width="100%" height={220}><BarChart data={TIPOS.map((x) => ({ ...x, v: x.v * m }))} layout="vertical"><XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} /><YAxis type="category" dataKey="t" stroke="var(--muted-foreground)" fontSize={10} width={90} /><Tooltip {...chartTooltip} /><Bar dataKey="v" name="Ocorrências" fill="var(--chart-2)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Panel>
        <Panel title="Ocorrências por turno"><ResponsiveContainer width="100%" height={220}><BarChart data={TURNOS.map((x) => ({ ...x, v: x.v * m }))}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} /><YAxis stroke="var(--muted-foreground)" fontSize={10} width={28} /><Tooltip {...chartTooltip} /><Bar dataKey="v" name="Ocorrências" fill="var(--chart-5)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Panel>
      </div>
      <div className="grid grid-cols-[1fr_380px] gap-4">
        <Panel title="Mapa de calor · ausência de EPI (dia × hora)">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: "36px repeat(24, minmax(0,1fr))" }}>
            <span />{Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center font-mono text-[9px] text-muted-foreground">{h}</span>)}
            {HEAT.map((row, di) => [
              <span key={`d${di}`} className="text-[11px] text-muted-foreground">{DIAS[di]}</span>,
              ...row.map((v, h) => <div key={`${di}-${h}`} title={`${DIAS[di]} ${h}h`} className="aspect-square rounded-[3px] bg-primary" style={{ opacity: 0.08 + Math.min(1, v / 8) * 0.92 }} />),
            ])}
          </div>
        </Panel>
        <Panel title="Permanência por transportadora (min)"><ResponsiveContainer width="100%" height={210}><BarChart data={PERM} layout="vertical"><XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} /><YAxis type="category" dataKey="t" stroke="var(--muted-foreground)" fontSize={10} width={80} /><Tooltip {...chartTooltip} /><Bar dataKey="v" name="Minutos" radius={[0, 4, 4, 0]}>{PERM.map((x, i) => <Cell key={i} fill={x.v > 50 ? "var(--chart-1)" : "var(--chart-4)"} />)}</Bar></BarChart></ResponsiveContainer></Panel>
      </div>
      <Dossie open={pdf} onOpenChange={setPdf} titulo="Relatório para auditoria · ISO 14001 / PRODIR">
        <div className="grid grid-cols-2 gap-2 text-xs">{kpis.map(([l, v]) => <div key={l as string} className="flex justify-between border-b border-ink/10 py-1"><span>{l}</span><b className="font-mono">{v}</b></div>)}</div>
        <div className="mt-4 font-semibold">Fatos recorrentes</div>
        <ul className="list-disc pl-5 text-xs">{FATOS.map((f) => <li key={f}>{f}</li>)}</ul>
      </Dossie>
    </div>
  );
}
