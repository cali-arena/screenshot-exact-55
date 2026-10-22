import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Activity, AlertTriangle, BarChart3, Bell, Boxes, Camera, HardHat, LayoutDashboard, Play, Search,
  Server, Smartphone, Truck, Users, Flag, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMERAS, LOGO, PERFIS, RFIDS, type Perfil } from "@/data/plant";
import { camsOnline, openAlerts, useEngine } from "@/store/engine";
import { PresenterPanel } from "@/components/cg/Presenter";
import { Tour } from "@/components/cg/Tour";
import { LiveFeed } from "@/components/cg/LiveFeed";
import { EventFeed } from "@/components/cg/EventFeed";

export const Route = createFileRoute("/_painel")({
  ssr: false,
  component: Layout,
});

const NAV = [
  { to: "/central", label: "Central ao vivo", icon: LayoutDashboard },
  { to: "/patio", label: "Pátio e logística", icon: Truck },
  { to: "/pessoas", label: "Pessoas e acessos", icon: Users },
  { to: "/epi", label: "EPI e áreas de risco", icon: HardHat },
  { to: "/investigacao", label: "Investigação", icon: Search },
  { to: "/cameras", label: "Câmeras", icon: Camera },
  { to: "/alertas", label: "Alertas", icon: AlertTriangle },
  { to: "/supervisor", label: "App do supervisor", icon: Smartphone },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/sistema", label: "Saúde do sistema", icon: Server },
  { to: "/fechamento", label: "Antes × Depois", icon: Flag },
] as const;

function useEngineLoop() {
  useEffect(() => {
    const iv = setInterval(() => useEngine.getState().tick(), 1000);
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const s = useEngine.getState();
      if (e.key === "p" || e.key === "P") s.set({ presenter: !s.presenter });
      else if (e.key === " ") { e.preventDefault(); s.toggleRun(); }
      else if (e.key === "n" || e.key === "N") s.randomEvent();
      else if (e.key === "t" || e.key === "T") {
        const w = !s.wall;
        s.set({ wall: w });
        if (w) document.documentElement.requestFullscreen?.().catch(() => {});
        else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } else if (e.key === "Escape") s.set({ presenter: false, wall: false, tour: null });
    };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(iv); window.removeEventListener("keydown", onKey); };
  }, []);
}

function Layout() {
  useEngineLoop();
  const wall = useEngine((s) => s.wall);
  if (wall) return <WallMode />;
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
        <footer className="border-t border-border px-5 py-1.5 text-[10px] text-muted-foreground">
          Ambiente de demonstração · imagens e dados simulados com base no perfil da Carbono Química
        </footer>
      </div>
      <PresenterPanel />
      <Tour />
    </div>
  );
}

function Sidebar() {
  const alerts = useEngine((s) => s.alerts);
  const n = openAlerts(alerts).filter((a) => a.status === "aberto").length;
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img src={LOGO} alt="Carbono Química" className="h-11 w-auto" />
        <div className="leading-tight">
          <div className="text-sm font-semibold">Carbono Guard AI</div>
          <div className="text-[10px] text-muted-foreground">Central de monitoramento</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {NAV.map((i) => (
          <Link key={i.to} to={i.to}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "bg-primary/15 !text-foreground font-medium border-l-2 border-primary" }}>
            <i.icon className="size-4" />
            <span className="flex-1">{i.label}</span>
            {i.to === "/alertas" && n > 0 && <span className="rounded-full bg-crit px-1.5 font-mono text-[10px] text-primary-foreground">{n}</span>}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        powered by <b className="text-foreground">AntiF</b> · SitecomAI
      </div>
    </aside>
  );
}

function TopBar() {
  const now = useEngine((s) => s.now);
  const perfil = useEngine((s) => s.perfil);
  const running = useEngine((s) => s.running);
  const speed = useEngine((s) => s.speed);
  const alerts = useEngine((s) => s.alerts);
  const n = openAlerts(alerts).filter((a) => a.status === "aberto").length;
  const set = useEngine.getState().set;
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-5">
      <span className="flex items-center gap-2 rounded-full bg-crit/15 px-3 py-1 text-xs font-bold text-crit">
        <span className={cn("size-2 rounded-full bg-crit", running && "animate-live")} /> {running ? "AO VIVO" : "PAUSADO"}
        {speed === 2 && <span className="font-mono">2×</span>}
      </span>
      <span className="hidden font-mono text-xs text-muted-foreground lg:inline">
        {camsOnline}/{CAMERAS.length} câmeras · {RFIDS.length}/{RFIDS.length} RFID · processamento local
      </span>
      <span className="font-mono text-sm tabular-nums">{new Date(now).toLocaleTimeString("pt-BR")}</span>
      <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
        {(Object.keys(PERFIS) as Perfil[]).map((p) => (
          <button key={p} onClick={() => set({ perfil: p })}
            className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition", perfil === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {p}
          </button>
        ))}
      </div>
      <Link to="/alertas" className="relative text-muted-foreground hover:text-foreground" aria-label="Alertas">
        <Bell className="size-5" />
        {n > 0 && <span className="absolute -right-2 -top-1.5 rounded-full bg-crit px-1 font-mono text-[10px] text-primary-foreground">{n}</span>}
      </Link>
      <button onClick={() => set({ tour: 0 })} className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow">
        <Play className="size-3.5 fill-current" /> Iniciar demo
      </button>
    </header>
  );
}

function WallMode() {
  const perfil = useEngine((s) => s.perfil);
  const cams = [...PERFIS[perfil], "CAM-11", "CAM-43", "CAM-55", "CAM-35", "CAM-49"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 9);
  return (
    <div className="flex h-screen gap-3 bg-ink p-3">
      <div className="grid flex-1 grid-cols-3 content-center gap-2">
        {cams.map((c) => <LiveFeed key={c} camId={c} />)}
      </div>
      <div className="flex w-[420px] flex-col">
        <div className="mb-2 flex items-center gap-2 px-1">
          <img src={LOGO} alt="" className="h-8" />
          <div className="text-sm font-semibold">Carbono Guard AI · Alertas</div>
          <Activity className="ml-auto size-4 animate-live text-crit" />
          <button onClick={() => { useEngine.getState().set({ wall: false }); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }}
            className="text-muted-foreground hover:text-foreground" aria-label="Sair do modo telão"><X className="size-4" /></button>
        </div>
        <EventFeed limit={40} className="flex-1" />
      </div>
      <PresenterPanel />
    </div>
  );
}
