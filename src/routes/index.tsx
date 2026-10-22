import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { LOGO } from "@/data/plant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carbono Guard AI · Acesso à central" },
      { name: "description", content: "Central de monitoramento ao vivo da Carbono Química com IA sobre câmeras e RFID — powered by AntiF." },
      { property: "og:title", content: "Carbono Guard AI · powered by AntiF" },
      { property: "og:description", content: "A Carbono já tem os olhos. Falta o cérebro." },
    ],
  }),
  component: Login,
});

const STEPS = [
  "Conectando ao gravador de vídeo… 60 câmeras encontradas",
  "Leitores RFID… 14 conectados",
  "Ativando analíticos no servidor local",
  "Sincronizando agendamentos do JD Edwards (somente leitura)",
];

function Login() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(-1);
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase(0);
    STEPS.forEach((_, i) => setTimeout(() => setPhase(i + 1), (i + 1) * 600));
    setTimeout(() => navigate({ to: "/central" }), 2700);
  };
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[680px] -translate-x-1/2 -translate-y-1/2 animate-blob rounded-[60%_40%_55%_45%] bg-brand opacity-30 blur-[120px]" />
      <form onSubmit={go} className="relative w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-xl">
        <img src={LOGO} alt="Carbono Química" className="mx-auto h-28 w-auto" />
        <h1 className="mt-3 text-center text-2xl font-semibold">Carbono Guard AI</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">A Carbono já tem os olhos. Falta o cérebro.</p>
        {phase < 0 ? (
          <div className="mt-7 space-y-3">
            <label className="block text-xs font-medium text-muted-foreground">E-mail
              <input defaultValue="seguranca@carbono.com.br" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Senha
              <input type="password" defaultValue="demonstracao" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </label>
            <button className="w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Entrar na central</button>
          </div>
        ) : (
          <ul className="mt-7 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                {phase > i ? <Check className="size-5 animate-check rounded-full bg-ok p-0.5 text-ink" /> : <Loader2 className="size-5 animate-spin text-muted-foreground" />}
                <span className={phase > i ? "" : "text-muted-foreground"}>{s}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-7 text-center text-[11px] text-muted-foreground">powered by <b className="text-foreground">AntiF</b> · SitecomAI</p>
      </form>
    </div>
  );
}
