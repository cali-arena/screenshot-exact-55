import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MessageCircle, X, Check } from "lucide-react";
import { LOGO } from "@/data/plant";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_painel/fechamento")({
  head: pageHead("Antes × Depois", "Câmeras que só gravam viram alertas em segundos: o que muda com o Carbono Guard AI."),
  component: Fim,
});

const LINHAS = [
  ["Câmeras que só gravam", "60 câmeras analisadas 24h"],
  ["Problema descoberto revendo gravação", "Alerta em segundos no celular"],
  ["Pátio sem medição", "Cada caminhão medido da portaria à saída"],
  ["RFID isolado", "Vídeo × RFID × JDE cruzados"],
  ["Sem estatística", "Fatos recorrentes e relatório para auditoria"],
];

function Fim() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-4">
      <div className="text-center">
        <img src={LOGO} alt="Carbono Química" className="mx-auto h-20" />
        <h1 className="mt-2 text-3xl font-semibold">A Carbono já tem os olhos. <span className="text-primary">Falta o cérebro.</span></h1>
      </div>
      <div data-tour="antes" className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-[1fr_auto_1fr] bg-surface text-sm font-semibold uppercase tracking-wider">
          <div className="px-6 py-3 text-muted-foreground">Hoje</div><div /><div className="bg-brand px-6 py-3 text-primary-foreground">Com Carbono Guard AI</div>
        </div>
        {LINHAS.map(([a, b], i) => (
          <div key={a} className="grid animate-feed-in grid-cols-[1fr_auto_1fr] items-center border-t border-border" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="flex items-center gap-3 px-6 py-4 text-muted-foreground"><X className="size-5 text-offline" />{a}</div>
            <ArrowRight className="size-5 text-primary" />
            <div className="flex items-center gap-3 bg-primary/5 px-6 py-4 font-medium"><Check className="size-5 text-ok" />{b}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-primary/50 bg-card p-6 text-center shadow-glow">
        <div className="text-sm text-muted-foreground">Próximo passo</div>
        <div className="mt-1 text-xl font-semibold">Visita técnica para conectar as câmeras reais da Carbono</div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="font-semibold">Davi De Rosa</span>
          <a href="https://wa.me/5511999715398" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md bg-ok px-3 py-1.5 font-semibold text-ink"><MessageCircle className="size-4" />WhatsApp +55 11 99971-5398</a>
          <a href="https://calendly.com/sitecomai/30min" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-primary-foreground"><CalendarDays className="size-4" />calendly.com/sitecomai/30min</a>
        </div>
        <div className="mt-4 text-[11px] text-muted-foreground">powered by <b className="text-foreground">AntiF</b> · SitecomAI</div>
      </div>
    </div>
  );
}
