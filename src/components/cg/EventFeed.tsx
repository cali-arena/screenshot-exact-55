import { cn } from "@/lib/utils";
import { frameOf, zona } from "@/data/plant";
import { fmtHora, useEngine, type Evento } from "@/store/engine";
import { NivelBadge, nivelBorder } from "./ui";

export function EventRow({ e, onClick }: { e: Evento; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex w-full animate-feed-in items-center gap-3 rounded-md border-l-[3px] bg-surface p-2 text-left transition-colors hover:bg-accent", nivelBorder[e.nivel])}>
      <img src={frameOf(e.cam)} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{fmtHora(e.ts)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{e.cam}</span>
          <NivelBadge nivel={e.nivel} className="ml-auto" />
        </div>
        <div className="truncate text-[13px] font-medium">{e.tipo}</div>
        <div className="truncate text-[11px] text-muted-foreground">{zona(e.zona).nome} · {e.detalhe}</div>
      </div>
    </button>
  );
}

export function EventFeed({ limit = 30, filter, className }: { limit?: number; filter?: (e: Evento) => boolean; className?: string }) {
  const events = useEngine((s) => s.events);
  const list = (filter ? events.filter(filter) : events).slice(0, limit);
  return (
    <div className={cn("flex flex-col gap-1.5 overflow-y-auto pr-1", className)}>
      {list.map((e) => <EventRow key={e.id} e={e} />)}
    </div>
  );
}
