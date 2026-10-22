import { Gauge, Pause, Play, X, Zap, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIOS, useEngine } from "@/store/engine";

export function PresenterPanel() {
  const { presenter, running, speed } = useEngine();
  const s = useEngine.getState();
  return (
    <>
      <button aria-label="Painel do apresentador" onClick={() => s.set({ presenter: !presenter })}
        className="fixed bottom-4 right-4 z-40 grid size-11 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition hover:text-foreground">
        <Gauge className="size-5" />
      </button>
      {presenter && (
        <div className="fixed bottom-18 right-4 z-50 w-[340px] animate-feed-in rounded-xl border border-border bg-popover p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Painel do apresentador</div>
              <div className="text-[11px] text-muted-foreground">Atalho: P · Espaço pausa · N evento · T telão</div>
            </div>
            <button onClick={() => s.set({ presenter: false })} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <button onClick={s.toggleRun} className={cn("flex items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-semibold", !running && "bg-warn/20 text-warn")}>
              {running ? <><Pause className="size-3.5" />Pausar</> : <><Play className="size-3.5" />Retomar</>}
            </button>
            <button onClick={() => s.setSpeed(speed === 1 ? 2 : 1)} className={cn("rounded-md border border-border py-2 text-xs font-semibold", speed === 2 && "bg-primary text-primary-foreground")}>
              Velocidade {speed}×
            </button>
            <button onClick={() => s.randomEvent()} className="flex items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-semibold"><Zap className="size-3.5" />Evento</button>
          </div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disparar cenário</div>
          <div className="grid gap-1.5">
            {SCENARIOS.map((sc) => (
              <button key={sc.k} onClick={() => s.scenario(sc.k)} className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-left text-xs font-medium transition hover:bg-accent">
                <span className="text-base">{sc.icon}</span>{sc.label}
              </button>
            ))}
          </div>
          <button onClick={() => { s.set({ wall: true, presenter: false }); document.documentElement.requestFullscreen?.().catch(() => {}); }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2 text-xs font-semibold text-primary-foreground">
            <Monitor className="size-4" /> Modo telão (T)
          </button>
        </div>
      )}
    </>
  );
}
