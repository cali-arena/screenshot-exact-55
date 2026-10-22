import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { rng, useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { Kpi, Panel } from "@/components/cg/ui";

export const Route = createFileRoute("/_painel/estoque")({
  head: pageHead("Estoque e movimentação", "Planta dos armazéns A e B, posições, itens fora de posição e rastreio RFID de ativos."),
  component: Est,
});

type Pos = "vazio" | "ocupado" | "fora";
const mk = (rows: number, cols: number, fora: number[]) =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c): Pos => (fora.includes(r * cols + c) ? "fora" : rng() < 0.78 ? "ocupado" : "vazio")));
const A = mk(5, 14, []);
const B = mk(5, 14, [31, 32]);
const ATIVOS = [
  ["TB-200-0412", "Tambor 200 L · Acetona", "Armazém B · corredor 3", "14:09", "1h12", true],
  ["TB-200-0413", "Tambor 200 L · Acetona", "Armazém B · corredor 3", "14:09", "1h12", true],
  ["IBC-1000-088", "IBC 1.000 L · Glicerina", "Doca 02", "13:41", "38 min", false],
  ["IBC-1000-091", "IBC 1.000 L · Soda 50%", "Armazém B · B-12", "11:20", "3h01", false],
  ["PL-07", "Paleteira elétrica", "Armazém A · corredor 1", "14:26", "4 min", false],
  ["PL-03", "Paleteira manual", "Envase", "14:02", "29 min", false],
  ["TB-200-0388", "Tambor 200 L · Tolueno", "Armazém B · B-04", "09:47", "4h44", false],
  ["EM-CQ-D40", "Embalados · CQ-D40", "Armazém A · A-21", "10:15", "4h16", false],
] as const;

const cell: Record<Pos, string> = { vazio: "bg-secondary", ocupado: "bg-chart-4/50", fora: "bg-warn animate-live" };

function Mapa({ nome, g }: { nome: string; g: Pos[][] }) {
  return (
    <Panel title={nome}>
      <div className="space-y-3">
        {g.map((row, r) => (
          <div key={r}>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0,1fr))` }}>
              {row.map((p, c) => <div key={c} title={`${nome[8]}-${r * 14 + c + 1}`} className={cn("h-6 rounded-sm", cell[p])} />)}
            </div>
            {r < g.length - 1 && <div className="mt-1 text-center text-[9px] uppercase tracking-widest text-muted-foreground">corredor {r + 1}</div>}
          </div>
        ))}
        <div className="flex gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><i className="size-3 rounded-sm bg-chart-4/50" />ocupado</span><span className="flex items-center gap-1"><i className="size-3 rounded-sm bg-secondary" />livre</span><span className="flex items-center gap-1"><i className="size-3 rounded-sm bg-warn" />fora de posição</span></div>
      </div>
    </Panel>
  );
}

function Est() {
  const mov = useEngine((s) => s.movHoje);
  const occ = (g: Pos[][]) => Math.round((g.flat().filter((p) => p !== "vazio").length / g.flat().length) * 100);
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">Estoque e movimentação</h1><p className="text-sm text-muted-foreground">Depósito de 1.000 t · vídeo + RFID de ativos</p></div>
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Ocupação armazém A" value={occ(A)} suffix="%" />
        <Kpi label="Ocupação armazém B" value={occ(B)} suffix="%" />
        <Kpi label="Movimentações hoje" value={mov} />
        <Kpi label="Itens fora de posição" value={2} tone="warn" />
      </div>
      <div className="grid grid-cols-2 gap-4"><Mapa nome="Armazém A — embalados" g={A} /><Mapa nome="Armazém B — tambores e IBCs" g={B} /></div>
      <Panel title="Rastreio RFID de ativos">
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground"><tr><th className="py-1">Tag</th><th>Ativo</th><th>Local</th><th>Última leitura</th><th>Tempo parado</th></tr></thead>
          <tbody>{ATIVOS.map(([t, a, l, h, p, f]) => (
            <tr key={t} className={cn("border-t border-border", f && "bg-warn/10")}><td className="py-1.5 font-mono">{t}</td><td>{a}</td><td className={f ? "font-semibold text-warn" : ""}>{l}{f && " · fora de posição"}</td><td className="font-mono">{h}</td><td className="font-mono">{p}</td></tr>
          ))}</tbody>
        </table>
      </Panel>
    </div>
  );
}
