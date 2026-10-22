import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Bell, CheckCircle2, MapPin, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESCADA, frameOf, zona } from "@/data/plant";
import { fmtDur, fmtHora, openAlerts, useEngine, type Alerta } from "@/store/engine";
import { LiveFeed } from "./LiveFeed";
import { NivelBadge } from "./ui";

export function PhoneFrame({ children, className, scale = 1 }: { children: ReactNode; className?: string; scale?: number }) {
  const vib = useEngine((s) => s.vibrate);
  const [shake, setShake] = useState(0);
  useEffect(() => { if (vib) setShake((x) => x + 1); }, [vib]);
  return (
    <div key={shake} className={cn("animate-vibrate", className)} style={{ width: 300 * scale, height: 610 * scale }}>
      <div className="relative h-full w-full rounded-[44px] border-[10px] border-ink bg-ink shadow-glow">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
        <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-background">{children}</div>
      </div>
    </div>
  );
}

function StatusBar() {
  const now = useEngine((s) => s.now);
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-3 font-mono text-[11px] font-semibold">
      <span>{new Date(now).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
      <span>5G ▮▮▮</span>
    </div>
  );
}

/** Notification-only phone (alerts screen) */
export function PushPhone() {
  const alerts = useEngine((s) => s.alerts);
  const list = openAlerts(alerts).slice(0, 5);
  return (
    <PhoneFrame>
      <StatusBar />
      <div className="px-3 pt-4">
        <div className="mb-3 text-center">
          <div className="font-mono text-4xl font-light">{new Date(useEngine.getState().now).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-[11px] text-muted-foreground">Supervisor do turno · Carbono Guard</div>
        </div>
        <div className="flex flex-col gap-2">
          {list.map((a) => (
            <div key={a.id} className="animate-feed-in rounded-2xl border border-border bg-card/90 p-2.5 backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Bell className="size-3 text-primary" /> CARBONO GUARD · {fmtHora(a.evento.ts, false)}
                {a.degrau > 0 && <span className="ml-auto rounded bg-crit px-1 text-[9px] font-bold text-primary-foreground">ESCALADO</span>}
              </div>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">{a.evento.tipo}</div>
                  <div className="line-clamp-2 text-[10px] text-muted-foreground">{zona(a.evento.zona).curto} · {a.evento.detalhe}</div>
                </div>
                <img src={frameOf(a.evento.cam)} alt="" className="h-10 w-14 rounded-md object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Fully navigable supervisor app */
export function SupervisorApp() {
  const alerts = useEngine((s) => s.alerts);
  const now = useEngine((s) => s.now);
  const { assumir, resolver } = useEngine.getState();
  const [sel, setSel] = useState<string | null>(null);
  const [view, setView] = useState<"det" | "cam" | "ok">("det");
  const a = alerts.find((x) => x.id === sel);
  const list = alerts.filter((x) => x.status !== "falso").slice(0, 12);

  return (
    <PhoneFrame scale={1.1}>
      <StatusBar />
      {!a ? (
        <div className="flex h-full flex-col">
          <div className="px-4 pb-2 pt-2">
            <div className="text-[11px] text-muted-foreground">Olá, Marcos · Turno B</div>
            <div className="text-lg font-semibold">Alertas</div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-24">
            {list.map((x) => <AlertCard key={x.id} a={x} now={now} onClick={() => { setSel(x.id); setView("det"); }} />)}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <button onClick={() => setSel(null)} className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground"><ArrowLeft className="size-4" /> Alertas</button>
          <div className="flex-1 overflow-y-auto px-3 pb-24">
            {view === "cam" ? (
              <>
                <LiveFeed camId={a.evento.cam} compact className="rounded-xl" />
                <div className="mt-2 text-center text-[11px] text-muted-foreground">Ao vivo · {a.evento.cam}</div>
                <button onClick={() => setView("det")} className="mt-3 w-full rounded-xl bg-secondary py-2 text-xs font-semibold">Voltar ao alerta</button>
              </>
            ) : view === "ok" ? (
              <div className="grid place-items-center py-16 text-center">
                <CheckCircle2 className="mb-2 size-14 animate-check text-ok" />
                <div className="font-semibold">Ocorrência resolvida</div>
                <div className="text-[11px] text-muted-foreground">Comentário e foto anexados · registrado na trilha de auditoria</div>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-xl">
                  <img src={frameOf(a.evento.cam)} alt="" className="aspect-video w-full object-cover" />
                  <div className="absolute left-2 top-2"><NivelBadge nivel={a.evento.nivel} /></div>
                </div>
                <div className="mt-2 text-sm font-semibold">{a.evento.tipo}</div>
                <div className="text-[11px] text-muted-foreground">{a.evento.detalhe}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-surface p-2"><div className="text-muted-foreground">Local</div><div className="flex items-center gap-1 font-medium"><MapPin className="size-3" />{zona(a.evento.zona).curto}</div></div>
                  <div className="rounded-lg bg-surface p-2"><div className="text-muted-foreground">Prazo (SLA)</div><div className="font-mono font-medium text-warn">{fmtDur(Math.max(0, 300000 - (now - a.criado)))}</div></div>
                </div>
                <MiniMap zid={a.evento.zona} />
                <div className="mt-2 text-[10px] text-muted-foreground">Nível atual: {ESCADA[a.degrau]}</div>
                <div className="mt-3 grid gap-2">
                  {a.status === "aberto" && <button onClick={() => assumir(a.id)} className="rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground">Assumir</button>}
                  <button onClick={() => setView("cam")} className="flex items-center justify-center gap-1 rounded-xl bg-secondary py-2.5 text-xs font-semibold"><Video className="size-3.5" />Ver câmera ao vivo</button>
                  {a.status !== "resolvido" && <button onClick={() => { resolver(a.id); setView("ok"); }} className="rounded-xl border border-ok/60 py-2.5 text-xs font-semibold text-ok">Resolver</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}

function AlertCard({ a, now, onClick }: { a: Alerta; now: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full animate-feed-in gap-2 rounded-xl border border-border bg-card p-2 text-left">
      <img src={frameOf(a.evento.cam)} alt="" className="h-12 w-16 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1"><NivelBadge nivel={a.evento.nivel} /><span className="ml-auto font-mono text-[9px] text-muted-foreground">{fmtHora(a.evento.ts, false)}</span></div>
        <div className="truncate text-xs font-semibold">{a.evento.tipo}</div>
        <div className="text-[10px] text-muted-foreground">{zona(a.evento.zona).curto} · {a.status === "aberto" ? `aberto há ${fmtDur(now - a.criado)}` : a.status}</div>
      </div>
    </button>
  );
}

function MiniMap({ zid }: { zid: string }) {
  const z = zona(zid);
  return (
    <svg viewBox="0 0 1000 600" className="mt-2 w-full rounded-lg bg-surface">
      <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10" fill="var(--crit)" className="animate-zone" />
      <rect x="20" y="20" width="960" height="560" rx="16" fill="none" stroke="var(--border)" strokeWidth="4" />
      <text x={z.x + z.w / 2} y={z.y + z.h / 2} textAnchor="middle" fontSize="40" fontWeight="700" fill="var(--foreground)">{z.curto}</text>
    </svg>
  );
}
