import { createFileRoute } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { CheckCircle2, Cpu, HardDrive, ShieldCheck, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMERAS, RFIDS } from "@/data/plant";
import { useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Panel } from "@/components/cg/ui";

export const Route = createFileRoute("/_painel/sistema")({
  head: pageHead("Saúde do sistema", "Status das câmeras e RFIDs, servidor local e integrações somente leitura."),
  component: Sis,
});

function Sis() {
  const metrics = useEngine((s) => s.metrics);
  const last = metrics[metrics.length - 1];
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="text-xl font-semibold">Saúde do sistema</h1><p className="text-sm text-muted-foreground">Servidor AntiF instalado dentro da planta</p></div>
        <div data-tour="selo" className="flex items-center gap-2 rounded-full border border-ok/50 bg-ok/10 px-4 py-2 text-sm font-semibold text-ok"><ShieldCheck className="size-5" />Vídeo processado dentro da planta · nada sai da Carbono · somente leitura</div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[["Uso de GPU", `${last.gpu.toFixed(0)}%`, "gpu", Cpu, "var(--chart-1)"], ["Temperatura", `${last.temp.toFixed(1)} °C`, "temp", Thermometer, "var(--chart-2)"]].map(([l, v, k, I, c]) => {
          const Icon = I as typeof Cpu;
          return (
            <div key={l as string} className="panel p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Icon className="size-4" />{l as string}</span><span className="font-mono text-lg text-foreground">{v as string}</span></div>
              <ResponsiveContainer width="100%" height={70}><LineChart data={metrics}><YAxis hide domain={["auto", "auto"]} /><Line dataKey={k as string} stroke={c as string} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer>
            </div>
          );
        })}
        <div className="panel p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><HardDrive className="size-4" />Armazenamento</span><span className="font-mono text-lg text-foreground">61%</span></div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[61%] bg-brand" /></div>
          <div className="mt-2 text-[11px] text-muted-foreground">36,6 TB de 60 TB · retenção de 30 dias · 43.200 h analisadas no mês</div>
        </div>
      </div>
      <Panel title="Integrações">
        <div className="grid grid-cols-3 gap-3">
          {[["Gravador / CFTV", "RTSP · ONVIF · 60 fluxos"], ["Leitores RFID", "14 leitores · UHF"], ["JD Edwards", "Somente leitura · agendamentos e pedidos"]].map(([n, d]) => (
            <div key={n} className="flex items-center gap-3 rounded-lg bg-surface p-3"><CheckCircle2 className="size-6 text-ok" /><div><div className="text-sm font-semibold">{n}</div><div className="text-[11px] text-muted-foreground">{d}</div></div><span className="ml-auto text-[11px] font-semibold text-ok">conectado</span></div>
          ))}
        </div>
      </Panel>
      <div className="grid grid-cols-[1fr_340px] gap-4">
        <Panel title="Câmeras (60)">
          <div className="grid grid-cols-10 gap-1.5">
            {CAMERAS.map((c) => (
              <div key={c.id} title={c.nome} className={cn("rounded px-1 py-1.5 text-center font-mono text-[10px]",
                c.status === "online" ? "bg-ok/15 text-ok" : c.status === "offline" ? "bg-offline/30 text-muted-foreground" : "bg-warn/20 text-warn")}>{c.id.slice(4)}</div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">CAM-37 e CAM-52 sem sinal · CAM-44 com imagem degradada (manutenção sugerida)</div>
        </Panel>
        <Panel title="Leitores RFID (14)">
          <ul className="space-y-1 text-xs">{RFIDS.map((r) => <li key={r.id} className="flex items-center gap-2"><span className="size-2 rounded-full bg-ok" /><span className="font-mono">{r.id}</span><span className="text-muted-foreground">{r.local}</span></li>)}</ul>
        </Panel>
      </div>
    </div>
  );
}
