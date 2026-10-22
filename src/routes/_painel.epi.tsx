import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Video, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { DETECCOES, FRAMES, ZONAS, camera, zona } from "@/data/plant";
import { fmtHora, rng, useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Panel } from "@/components/cg/ui";

export const Route = createFileRoute("/_painel/epi")({
  head: pageHead("EPI e áreas de risco", "Conformidade de EPI por zona e item, ocorrências com evidência e zonas críticas."),
  component: Epi,
});

const ITENS = ["Capacete", "Óculos", "Luvas", "Vestimenta"];
const MATRIZ = ZONAS.filter((z) => z.risco !== "baixo").map((z) => ({ z, v: ITENS.map(() => +(86 + rng() * 13).toFixed(1)) }));
MATRIZ.find((m) => m.z.id === "Z05")!.v[0] = 84.2;
const tone = (v: number) => (v >= 95 ? "bg-ok/20 text-ok" : v >= 90 ? "bg-warn/20 text-warn" : "bg-crit/25 text-crit");

function Evidencia({ camId, tipo }: { camId: string; tipo: string }) {
  const cam = camera(camId);
  const box = (DETECCOES[cam.imagem] ?? []).find((b) => b.nivel !== "ok");
  return (
    <div className="relative aspect-video overflow-hidden rounded-md">
      <img src={FRAMES[cam.imagem]} alt={tipo} className="absolute inset-0 size-full object-cover" />
      {box && <div className="absolute animate-ring rounded-[2px] border-2 border-crit" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}>
        <span className="absolute -top-[18px] left-[-2px] whitespace-nowrap bg-crit px-1 font-mono text-[9px] font-semibold text-ink">{box.label}</span></div>}
      <div className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 font-mono text-[10px]">{cam.id} · congelado</div>
    </div>
  );
}

function Epi() {
  const events = useEngine((s) => s.events);
  const navigate = useNavigate();
  const [sent, setSent] = useState<string[]>([]);
  const ocorr = events.filter((e) => ["Ausência de EPI", "Acesso negado", "Área restrita", "Intrusão no perímetro"].includes(e.tipo) && e.nivel !== "info").slice(0, 9);

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">EPI e áreas de risco</h1><p className="text-sm text-muted-foreground">Capacete, óculos, luvas e vestimenta verificados em cada câmera</p></div>
      <div className="flex items-center gap-4 rounded-xl border border-crit/60 bg-crit/10 p-4">
        <Zap className="size-8 shrink-0 text-crit" />
        <div><div className="font-semibold">Caso-âncora</div><div className="text-sm">Operador com NR-20 vencida entrou no parque de tanques → <b className="text-crit">alerta crítico ao supervisor e ao HSE em 2 segundos</b>.</div></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {["Z04", "Z05", "Z06", "Z09"].map((id) => {
          const m = MATRIZ.find((x) => x.z.id === id)!;
          const avg = m.v.reduce((a, b) => a + b, 0) / 4;
          return (
            <div key={id} className="panel border-crit/40 p-3">
              <div className="flex items-center justify-between"><span className="font-semibold">{zona(id).curto}</span><span className="rounded bg-crit/20 px-1.5 text-[10px] font-semibold uppercase text-crit">crítica</span></div>
              <div className={cn("mt-1 font-mono text-2xl font-semibold", avg >= 95 ? "text-ok" : avg >= 90 ? "text-warn" : "text-crit")}>{avg.toFixed(1)}%</div>
              <div className="text-[11px] text-muted-foreground">conformidade de EPI hoje</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-[420px_1fr] gap-4">
        <Panel title="Conformidade por zona e item">
          <table className="w-full text-xs">
            <thead><tr className="text-muted-foreground"><th className="py-1 text-left">Zona</th>{ITENS.map((i) => <th key={i}>{i}</th>)}</tr></thead>
            <tbody>{MATRIZ.map(({ z, v }) => (
              <tr key={z.id} className="border-t border-border"><td className="py-1.5">{z.curto}</td>{v.map((x, i) => <td key={i} className="p-0.5"><div className={cn("rounded py-1 text-center font-mono", tone(x))}>{x.toFixed(1)}</div></td>)}</tr>
            ))}</tbody>
          </table>
        </Panel>
        <Panel title="Galeria de ocorrências" data-tour="galeria">
          <div className="grid grid-cols-3 gap-3">
            {ocorr.map((e) => (
              <div key={e.id} className="animate-feed-in rounded-lg border border-border bg-surface p-2">
                <Evidencia camId={e.cam} tipo={e.tipo} />
                <div className="mt-1.5 text-xs font-semibold">{e.tipo}</div>
                <div className="text-[11px] text-muted-foreground"><span className="font-mono">{fmtHora(e.ts)}</span> · {zona(e.zona).curto}</div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button onClick={() => navigate({ to: "/cameras", search: { cam: e.cam } })} className="flex items-center justify-center gap-1 rounded border border-border py-1 text-[11px]"><Video className="size-3" />Ver na câmera</button>
                  <button onClick={() => setSent((s) => [...s, e.id])} className={cn("flex items-center justify-center gap-1 rounded py-1 text-[11px] font-semibold", sent.includes(e.id) ? "bg-ok/20 text-ok" : "bg-primary text-primary-foreground")}><Bell className="size-3" />{sent.includes(e.id) ? "Notificado" : "Notificar supervisor"}</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
