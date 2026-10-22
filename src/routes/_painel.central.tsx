import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, HardHat, Truck, Users } from "lucide-react";
import { PERFIS } from "@/data/plant";
import { openAlerts, useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Kpi, Panel } from "@/components/cg/ui";
import { PlantMap } from "@/components/cg/PlantMap";
import { LiveFeed } from "@/components/cg/LiveFeed";
import { EventFeed } from "@/components/cg/EventFeed";

export const Route = createFileRoute("/_painel/central")({
  head: pageHead("Central ao vivo", "Mapa da planta, câmeras em destaque, feed de eventos e indicadores ao vivo."),
  component: Central,
});

function Central() {
  const s = useEngine();
  const navigate = useNavigate();
  const patio = s.trucks.filter((t) => t.etapa === 1).length;
  const abertos = openAlerts(s.alerts).filter((a) => a.status === "aberto").length;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">Central ao vivo · <span className="text-muted-foreground">{s.perfil}</span></h1>
          <p className="text-sm text-muted-foreground">A Carbono já tem os olhos. <span className="text-primary">Falta o cérebro.</span></p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        <Kpi label="Caminhões no pátio" value={patio} icon={<Truck className="size-4" />} />
        <Kpi label="Permanência média" value={s.permMedia} suffix=" min" icon={<Clock className="size-4" />} tone={s.permMedia > 45 ? "warn" : "default"} />
        <Kpi label="Pessoas na planta" value={s.pessoas} icon={<Users className="size-4" />} />
        <Kpi label="Conformidade EPI" value={s.epi} decimals={1} suffix="%" icon={<HardHat className="size-4" />} tone={s.epi < 92 ? "warn" : "ok"} />
        <Kpi label="Alertas abertos" value={abertos} icon={<AlertTriangle className="size-4" />} tone={abertos ? "crit" : "ok"} />
        <Kpi label="Resolvidos no prazo" value={s.noPrazo} suffix="%" icon={<CheckCircle2 className="size-4" />} tone="ok" />
      </div>
      <div className="grid grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <Panel title="Mapa da planta · São Bernardo do Campo" right={<span className="text-[11px] text-muted-foreground">12 zonas · clique numa câmera</span>} data-tour="mapa">
            <div className="aspect-[1000/600] w-full"><PlantMap /></div>
          </Panel>
          <div className="grid grid-cols-4 gap-3">
            {PERFIS[s.perfil].map((c) => (
              <LiveFeed key={c} camId={c} compact onClick={() => navigate({ to: "/cameras", search: { cam: c } })} />
            ))}
          </div>
        </div>
        <Panel title="Eventos em tempo real" right={<span className="flex items-center gap-1.5 text-[11px] text-crit"><span className="size-1.5 animate-live rounded-full bg-crit" />ao vivo</span>} className="max-h-[calc(100vh-220px)]">
          <EventFeed limit={40} className="h-full" />
        </Panel>
      </div>
    </div>
  );
}
