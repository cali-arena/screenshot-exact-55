import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, MapPin, ShieldCheck, UserCheck, X, BadgeCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLABS, ZONAS, camZona, nr20Status, zona, type Colab } from "@/data/plant";
import { fmtHora, rng, useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Avatar, Panel, Seal } from "@/components/cg/ui";

export const Route = createFileRoute("/_painel/pessoas")({
  head: pageHead("Pessoas e acessos", "Pessoa certa, lugar certo, hora certa e apta: rosto + crachá RFID em cada acesso."),
  component: Pessoas,
});

const CONTAGEM = ZONAS.map((z) => ({ z, col: Math.round(3 + rng() * 14), terc: Math.round(rng() * 4), vis: Math.round(rng() * 2) }));

export function trajetoria(c: Colab) {
  const base = c.turno.startsWith("A") ? 6 : c.turno.startsWith("B") ? 14 : 22;
  const zs = ["Z01", "Z10", ...c.areas_autorizadas, "Z10"];
  return zs.map((z, i) => ({ h: `${String((base + Math.floor(i * 1.3)) % 24).padStart(2, "0")}:${String((i * 17 + 4) % 60).padStart(2, "0")}`, z, cam: camZona(z) }));
}

const semaforo = { vencida: "bg-crit text-primary-foreground", vencendo: "bg-warn text-ink", ok: "bg-ok text-ink" };

function Pessoas() {
  const events = useEngine((s) => s.events);
  const negados = useEngine((s) => s.negadosHoje);
  const [sel, setSel] = useState<Colab>(COLABS[4]);
  const passagens = events.filter((e) => e.colab).slice(0, 25);
  const st = nr20Status(sel.nr20_valida_ate);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="text-xl font-semibold">Pessoas e acessos</h1><p className="text-sm text-muted-foreground">~120 pessoas por turno · reconhecimento facial + crachá RFID</p></div>
        <Seal><Lock className="size-3.5" />Biometria tratada como dado sensível · LGPD · RIPD · acesso auditado</Seal>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[[UserCheck, "Pessoa certa", "rosto = crachá"], [MapPin, "Lugar certo", "área autorizada"], [Clock, "Hora certa", "dentro do turno"], [BadgeCheck, "Apto", "NR-20 e ASO válidos"]].map(([I, t, d]) => {
          const Icon = I as typeof UserCheck;
          return <div key={t as string} className="panel flex items-center gap-3 p-3"><div className="grid size-10 place-items-center rounded-full bg-ok/15 text-ok"><Icon className="size-5" /></div><div><div className="font-semibold">{t as string}</div><div className="text-[11px] text-muted-foreground">{d as string}</div></div></div>;
        })}
      </div>
      <div className="grid grid-cols-[1fr_400px] gap-4">
        <Panel title="Passagens em tempo real" data-tour="passagens" right={<span className="text-[11px] text-muted-foreground">Acessos negados hoje: <b className="font-mono text-crit">{negados}</b></span>}>
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="py-1">Hora</th><th>Local</th><th>Colaborador</th><th>Método</th><th>Resultado</th></tr></thead>
            <tbody>
              {passagens.map((e) => {
                const c = COLABS.find((x) => x.id === e.colab)!;
                return (
                  <tr key={e.id} onClick={() => setSel(c)} className={cn("animate-feed-in cursor-pointer border-t border-border hover:bg-accent", e.resultado === "negado" && "bg-crit/10")}>
                    <td className="py-2 font-mono">{fmtHora(e.ts)}</td>
                    <td>{zona(e.zona).curto}</td>
                    <td><div className="flex items-center gap-2"><Avatar nome={c.nome} size={24} />{c.nome} <span className="font-mono text-muted-foreground">{c.id}</span></div></td>
                    <td className="text-muted-foreground">rosto + crachá RFID</td>
                    <td>{e.resultado === "ok" ? <span className="flex items-center gap-1 text-ok"><Check className="size-4" />Liberado</span> : <span className="flex items-center gap-1 font-semibold text-crit"><X className="size-4" />{e.motivo}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
        <Panel title="Ficha do colaborador">
          <div className="space-y-3">
            <select value={sel.id} onChange={(e) => setSel(COLABS.find((c) => c.id === e.target.value)!)} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs">
              {COLABS.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.nome}</option>)}
            </select>
            <div className="flex items-center gap-3">
              <Avatar nome={sel.nome} size={56} />
              <div><div className="font-semibold">{sel.nome}</div><div className="text-xs text-muted-foreground">{sel.funcao} · Turno {sel.turno}</div><div className="font-mono text-[11px] text-muted-foreground">{sel.id} · {sel.cracha_rfid}</div></div>
            </div>
            <div className="flex items-center justify-between rounded-md bg-surface p-2 text-xs">
              <span>Validade NR-20</span>
              <span className={cn("rounded-full px-2 py-0.5 font-mono font-semibold", semaforo[st])}>{sel.nr20_valida_ate} · {st === "vencida" ? "vencida" : st === "vencendo" ? "vence em breve" : "válida"}</span>
            </div>
            <div className="text-xs"><div className="mb-1 text-muted-foreground">Áreas autorizadas</div><div className="flex flex-wrap gap-1">{sel.areas_autorizadas.map((z) => <span key={z} className="rounded bg-secondary px-2 py-0.5">{zona(z).curto}</span>)}</div></div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Trajetória do dia</div>
              <ol className="relative ml-2 border-l border-border">
                {trajetoria(sel).map((p, i) => (
                  <li key={i} className="mb-2 ml-4">
                    <span className="absolute -left-1.5 mt-1 size-3 rounded-full border-2 border-background bg-primary" />
                    <Link to="/cameras" search={{ cam: p.cam }} className="flex justify-between text-xs hover:text-primary">
                      <span><span className="font-mono">{p.h}</span> · {zona(p.z).curto}</span><span className="font-mono text-muted-foreground">{p.cam}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <div className="text-xs"><div className="mb-1 text-muted-foreground">Ocorrências</div>
              {st === "vencida" ? <div className="rounded border border-crit/50 bg-crit/10 p-2 text-crit">NR-20 vencida · bloqueio automático no parque de tanques</div> : <div className="text-muted-foreground">Nenhuma ocorrência nos últimos 30 dias</div>}
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Presença por zona agora">
        <div className="grid grid-cols-6 gap-2">
          {CONTAGEM.map(({ z, col, terc, vis }) => (
            <div key={z.id} className="rounded-md bg-surface p-2 text-xs">
              <div className="truncate font-medium">{z.curto}</div>
              <div className="mt-1 flex justify-between font-mono text-muted-foreground"><span title="Colaboradores">👷 {col}</span><span title="Terceiros">🔧 {terc}</span><span title="Visitantes">🪪 {vis}</span></div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" /> 👷 colaboradores · 🔧 terceiros · 🪪 visitantes</div>
      </Panel>
    </div>
  );
}
