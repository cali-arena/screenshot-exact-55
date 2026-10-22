import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { COLABS, camZona } from "@/data/plant";
import { useEngine } from "@/store/engine";

interface Step { to: string; search?: Record<string, string>; target: string; title: string; text: string; action?: () => void }

const S = () => useEngine.getState();
export const STEPS: Step[] = [
  { to: "/central", target: "mapa", title: "Central ao vivo", text: "Estas são as 60 câmeras e os 14 leitores RFID que a Carbono já tem — agora com inteligência. A Carbono já tem os olhos. Falta o cérebro." },
  { to: "/patio", target: "portaria", title: "Pátio · chegada", text: "Um caminhão chega: a placa é lida letra a letra, o RFID confere e o JD Edwards libera.", action: () => S().arrive(true) },
  { to: "/patio", target: "portaria", title: "Caminhão não agendado", text: "Placa sem agendamento no JDE → alerta vermelho na portaria, na hora.", action: () => S().scenario("naoAgendado") },
  { to: "/patio", target: "esteira", title: "Permanência no pátio", text: "Uma carreta passou do limite de 1h30 — o card fica vermelho e o alerta vai para o supervisor.", action: () => S().scenario("permanencia") },
  { to: "/pessoas", target: "passagens", title: "Pessoas e acessos", text: "Rosto + crachá: pessoa certa, lugar certo, hora certa. Em seguida, alguém com NR-20 vencida tenta entrar no parque de tanques.",
    action: () => {
      const c = COLABS[7];
      S().push({ cam: camZona("Z09"), zona: "Z09", tipo: "Passagem de pessoa", detalhe: `${c.nome} · rosto + crachá ${c.cracha_rfid}`, nivel: "info", colab: c.id, resultado: "ok" });
      setTimeout(() => S().scenario("nr20"), 2500);
    } },
  { to: "/alertas", target: "escada", title: "Escalonamento", text: "O alerta chegou no celular do supervisor. Ninguém assumiu — ele sobe para a coordenação automaticamente.",
    action: () => {
      const st = S();
      const a = st.alerts.find((x) => x.status === "aberto" && x.evento.nivel === "critico");
      if (a) setTimeout(() => st.set({ alerts: S().alerts.map((x) => (x.id === a.id ? { ...x, desde: Date.now() - 61000 } : x)) }), 3000);
    } },
  { to: "/epi", target: "galeria", title: "EPI e áreas de risco", text: "Operador sem capacete no envase: frame congelado, caixa vermelha e notificação ao supervisor.", action: () => S().scenario("capacete") },
  { to: "/investigacao", search: { q: "CQB4E21" }, target: "linha", title: "Investigação", text: "Uma busca pela placa CQB4E21 mostra o dia inteiro do caminhão em 4 câmeras, com RFID e pedido JDE." },
  { to: "/analytics", target: "fatos", title: "Fatos recorrentes", text: "A IA aponta o que se repete — e gera o relatório para auditoria em um clique." },
  { to: "/sistema", target: "selo", title: "Saúde do sistema", text: "Vídeo processado dentro da planta. Somente leitura. Nada muda no CFTV." },
  { to: "/fechamento", target: "antes", title: "Antes × Depois", text: "A Carbono já tem os olhos. Falta o cérebro. Próximo passo: visita técnica com o Davi." },
];

export function Tour() {
  const tour = useEngine((s) => s.tour);
  const auto = useEngine((s) => s.tourAuto);
  const navigate = useNavigate();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = tour !== null ? STEPS[tour] : null;

  useEffect(() => {
    if (!step) return;
    navigate({ to: step.to, search: step.search as never });
    const t = setTimeout(() => step.action?.(), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);

  useEffect(() => {
    if (!step) return;
    const iv = setInterval(() => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    }, 250);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (!auto || tour === null) return;
    const t = setTimeout(() => go(1), 20000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, tour]);

  function go(d: number) {
    const cur = useEngine.getState().tour;
    if (cur === null) return;
    const n = cur + d;
    if (n < 0) return;
    useEngine.getState().set({ tour: n >= STEPS.length ? null : n });
  }

  if (!step) return null;
  const pad = 8;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {rect ? (
        <div className="absolute rounded-xl border-2 border-primary transition-all duration-300"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px color-mix(in oklab, var(--ink) 68%, transparent)" }} />
      ) : <div className="absolute inset-0 bg-ink/60" />}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 w-[520px] -translate-x-1/2 animate-feed-in rounded-xl border border-primary/50 bg-popover p-4 shadow-glow">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[11px] text-primary">PASSO {tour! + 1} / {STEPS.length}</span>
          <button onClick={() => useEngine.getState().set({ tour: null })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><X className="size-3.5" />Sair</button>
        </div>
        <div className="text-base font-semibold">{step.title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
        <div className="mt-3 flex items-center gap-2">
          <label className="mr-auto flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={auto} onChange={(e) => useEngine.getState().set({ tourAuto: e.target.checked })} className="accent-primary" />
            Avanço automático
          </label>
          <button onClick={() => go(-1)} disabled={tour === 0} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40"><ChevronLeft className="size-3.5" />Voltar</button>
          <button onClick={() => go(1)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            {tour === STEPS.length - 1 ? "Concluir" : "Próximo"}<ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
