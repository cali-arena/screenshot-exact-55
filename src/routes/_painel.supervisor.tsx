import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Camera, MapPin, Timer } from "lucide-react";
import { pageHead } from "@/lib/head";
import { SupervisorApp } from "@/components/cg/Phone";

export const Route = createFileRoute("/_painel/supervisor")({
  head: pageHead("App do supervisor", "O alerta chega no bolso de quem resolve — com foto, local e prazo."),
  component: Sup,
});

function Sup() {
  return (
    <div className="grid min-h-[calc(100vh-150px)] grid-cols-[1fr_auto_1fr] items-center gap-10">
      <div className="justify-self-end max-w-sm">
        <div className="mb-2 font-mono text-xs text-primary">APP DO SUPERVISOR</div>
        <h1 className="text-3xl font-semibold leading-tight">O alerta chega no bolso de quem resolve — com foto, local e prazo.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Toque num alerta para ver o detalhe, assumir, abrir a câmera ao vivo e resolver com comentário e foto.</p>
      </div>
      <SupervisorApp />
      <ul className="max-w-xs space-y-4 text-sm">
        {[[BellRing, "Push em segundos", "Direto do servidor local para o celular"], [Camera, "Foto e câmera ao vivo", "Evidência anexada ao alerta"], [MapPin, "Local exato", "Zona e câmera no mapa da planta"], [Timer, "Prazo visível", "SLA correndo e escalonamento automático"]].map(([I, t, d]) => {
          const Icon = I as typeof BellRing;
          return (
            <li key={t as string} className="flex gap-3"><Icon className="mt-0.5 size-5 text-primary" /><div><div className="font-semibold">{t as string}</div><div className="text-xs text-muted-foreground">{d as string}</div></div></li>
          );
        })}
      </ul>
    </div>
  );
}
