import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Check, ThumbsDown, UserCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESCADA, RESPONSAVEIS, frameOf, zona } from "@/data/plant";
import { fmtDur, fmtHora, useEngine, type Alerta } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { NivelBadge, Panel } from "@/components/cg/ui";
import { PushPhone } from "@/components/cg/Phone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_painel/alertas")({
  head: pageHead("Alertas e escalonamento", "Alertas com SLA correndo, escada de escalonamento e notificações no celular."),
  component: Alertas,
});

function Escada({ a }: { a?: Alerta }) {
  const d = a?.degrau ?? 0;
  return (
    <div className="flex flex-col gap-2">
      {ESCADA.map((n, i) => (
        <div key={n} style={{ marginLeft: i * 28 }}
          className={cn("flex items-center gap-3 rounded-lg border p-3 transition-all duration-700",
            i === d ? "border-crit bg-crit/15 shadow-glow" : i < d ? "border-border opacity-50" : "border-border bg-surface")}>
          <span className={cn("grid size-7 place-items-center rounded-full font-mono text-xs font-bold", i === d ? "bg-crit text-primary-foreground animate-ring" : "bg-secondary")}>{i + 1}</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">{["Crítico", "Sem resposta", "Persistiu"][i]} → {n}</div>
            <div className="text-[11px] text-muted-foreground">{RESPONSAVEIS[i]} · {["na hora", "após 5 min", "após 10 min"][i]}</div>
          </div>
          {i === d && a && a.status === "aberto" && <span className="text-[11px] font-semibold text-crit">📳 notificando</span>}
        </div>
      ))}
    </div>
  );
}

function Alertas() {
  const alerts = useEngine((s) => s.alerts);
  const now = useEngine((s) => s.now);
  const { assumir, resolver, falso } = useEngine.getState();
  const [resolving, setResolving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"ativos" | "todos">("ativos");
  const list = alerts.filter((a) => filtro === "todos" || a.status === "aberto" || a.status === "assumido");
  const foco = alerts.find((a) => a.status === "aberto" && a.evento.nivel === "critico");

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div><h1 className="text-xl font-semibold">Alertas e escalonamento</h1><p className="text-sm text-muted-foreground">Crítico sem resposta sobe de nível automaticamente</p></div>
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {(["ativos", "todos"] as const).map((f) => <button key={f} onClick={() => setFiltro(f)} className={cn("rounded-md px-3 py-1 capitalize", filtro === f && "bg-primary text-primary-foreground")}>{f}</button>)}
          </div>
        </div>
        <Panel title="Escada de escalonamento" data-tour="escada" right={foco && <span className="text-[11px] text-muted-foreground">{foco.evento.tipo} · {zona(foco.evento.zona).curto}</span>}>
          <Escada a={foco} />
        </Panel>
        <Panel title={`Lista de alertas (${list.length})`}>
          <div className="flex flex-col gap-2">
            {list.map((a) => {
              const sla = 300000 - (now - a.criado);
              return (
                <div key={a.id} className={cn("flex animate-feed-in items-center gap-3 rounded-lg border bg-surface p-2.5", a.status === "aberto" && a.evento.nivel === "critico" ? "border-crit/60" : "border-border")}>
                  <img src={frameOf(a.evento.cam)} alt="" className="h-12 w-20 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><NivelBadge nivel={a.evento.nivel} /><span className="truncate text-sm font-medium">{a.evento.tipo}</span>
                      {a.degrau > 0 && <span className="rounded bg-crit/20 px-1.5 text-[10px] font-semibold text-crit">nível {a.degrau + 1}</span>}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{zona(a.evento.zona).nome} · <span className="font-mono">{a.evento.cam}</span> · {fmtHora(a.evento.ts)} · {a.responsavel ?? "sem responsável"}</div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-[10px] uppercase text-muted-foreground">{a.status === "aberto" || a.status === "assumido" ? "SLA" : a.status === "falso" ? "falso positivo" : "resolvido"}</div>
                    {(a.status === "aberto" || a.status === "assumido") && <div className={cn("font-mono text-sm font-semibold tabular-nums", sla < 0 ? "text-crit" : sla < 120000 ? "text-warn" : "text-ok")}>{sla < 0 ? "-" : ""}{fmtDur(Math.abs(sla))}</div>}
                  </div>
                  <div className="flex gap-1">
                    {a.status === "aberto" && <button onClick={() => assumir(a.id)} className="flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-semibold text-primary-foreground"><UserCheck className="size-3.5" />Assumir</button>}
                    {(a.status === "aberto" || a.status === "assumido") && <>
                      <button onClick={() => setResolving(a.id)} className="flex items-center gap-1 rounded-md border border-ok/60 px-2 py-1.5 text-[11px] text-ok"><Check className="size-3.5" />Resolver</button>
                      <button onClick={() => { falso(a.id); flash("Modelo ajustado · calibração registrada para " + a.evento.cam); }} className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] text-muted-foreground"><ThumbsDown className="size-3.5" />Falso positivo</button>
                    </>}
                  </div>
                </div>
              );
            })}
            {!list.length && <div className="py-8 text-center text-sm text-muted-foreground">Nenhum alerta ativo.</div>}
          </div>
        </Panel>
      </div>
      <div className="sticky top-0 flex flex-col items-center gap-3 self-start pt-2">
        <PushPhone />
        <p className="text-center text-xs text-muted-foreground">Notificações push em tempo real para quem resolve</p>
      </div>
      <Dialog open={!!resolving} onOpenChange={(o) => !o && setResolving(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolver ocorrência</DialogTitle></DialogHeader>
          <textarea defaultValue="Operador orientado e EPI reposto. Área liberada." className="h-24 w-full rounded-md border border-input bg-background p-2 text-sm" />
          <button className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground"><Camera className="size-4" />Anexar foto (obrigatório)</button>
          <button onClick={() => { resolver(resolving!); setResolving(null); flash("Ocorrência resolvida e registrada na trilha de auditoria"); }} className="rounded-md bg-ok py-2 text-sm font-semibold text-ink">Confirmar resolução</button>
        </DialogContent>
      </Dialog>
      {toast && <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-feed-in items-center gap-2 rounded-lg border border-ok/50 bg-popover px-4 py-2.5 text-sm"><Sparkles className="size-4 text-ok" />{toast}</div>}
    </div>
  );
}
