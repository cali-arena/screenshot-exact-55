import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flag, FileDown, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMERAS, DETECCOES, ZONAS, camera, zona } from "@/data/plant";
import { useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { LiveFeed } from "@/components/cg/LiveFeed";
import { Dossie } from "@/components/cg/Dossie";

export const Route = createFileRoute("/_painel/cameras")({
  validateSearch: (s: Record<string, unknown>) => ({ cam: typeof s.cam === "string" ? s.cam : undefined }),
  head: pageHead("Câmeras", "Mosaico das 60 câmeras com analíticos, filtro por zona e visualização em tela cheia."),
  component: Cams,
});

const ANALITICOS: Record<string, string> = { placa: "Placa", pessoa: "Pessoa", rfid: "RFID", epi: "EPI", area_restrita: "Área restrita", estoque: "Estoque", intrusao: "Intrusão", permanencia: "Permanência" };

function Cams() {
  const { cam } = Route.useSearch();
  const navigate = useNavigate();
  const [grid, setGrid] = useState(3);
  const [zf, setZf] = useState("");
  const [af, setAf] = useState("");
  const all = [...new Set(CAMERAS.flatMap((c) => c.analiticos))];
  const list = CAMERAS.filter((c) => (!zf || c.zona === zf) && (!af || c.analiticos.includes(af)));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Câmeras</h1><p className="text-sm text-muted-foreground">{list.length} câmeras · 58 online · 2 sem sinal · 1 com imagem degradada</p></div>
        <div className="flex items-center gap-2 text-xs">
          <select value={zf} onChange={(e) => setZf(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5"><option value="">Todas as zonas</option>{ZONAS.map((z) => <option key={z.id} value={z.id}>{z.curto}</option>)}</select>
          <select value={af} onChange={(e) => setAf(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5"><option value="">Todos os analíticos</option>{all.map((a) => <option key={a} value={a}>{ANALITICOS[a] ?? a}</option>)}</select>
          <div className="flex rounded-md border border-border p-0.5">
            {[2, 3, 4].map((g) => <button key={g} onClick={() => setGrid(g)} className={cn("rounded px-2.5 py-1 font-mono", grid === g && "bg-primary text-primary-foreground")}>{g}×{g}</button>)}
          </div>
        </div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))` }}>
        {list.map((c) => <LiveFeed key={c.id} camId={c.id} compact={grid === 4} onClick={() => navigate({ to: "/cameras", search: { cam: c.id } })} />)}
      </div>
      {cam && <FullCam id={cam} onClose={() => navigate({ to: "/cameras", search: {} })} />}
    </div>
  );
}

function FullCam({ id, onClose }: { id: string; onClose: () => void }) {
  const c = camera(id);
  const events = useEngine((s) => s.events.filter((e) => e.zona === c.zona));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [focus, setFocus] = useState<string | undefined>();
  const [pdf, setPdf] = useState(false);
  const [marcado, setMarcado] = useState(false);
  const boxes = DETECCOES[c.imagem] ?? [];
  const marks = [
    ...events.slice(0, 6).map((e) => ({ pos: (new Date(e.ts).getHours() * 60 + new Date(e.ts).getMinutes()) / 1440, label: e.tipo, box: boxes.find((b) => b.nivel !== "ok")?.label, nivel: e.nivel })),
    ...boxes.map((b, i) => ({ pos: (7 + i * 3.3) / 24, label: b.label, box: b.label, nivel: b.nivel === "ok" ? "info" : b.nivel })),
  ];
  const mv = (dx: number, dy: number) => setPan(([x, y]) => [Math.max(-15, Math.min(15, x + dx)), Math.max(-15, Math.min(15, y + dy))]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-6 backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <div><div className="font-mono text-lg font-bold">{c.id}</div><div className="text-xs text-muted-foreground">{c.nome} · {zona(c.zona).nome} · {c.tipo} · {c.resolucao}</div></div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setMarcado(true)} className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold", marcado ? "border-ok text-ok" : "border-border")}><Flag className="size-3.5" />{marcado ? "Ocorrência marcada" : "Marcar ocorrência"}</button>
          <button onClick={() => setPdf(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><FileDown className="size-3.5" />Exportar evidência (PDF)</button>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md border border-border p-1.5"><X className="size-4" /></button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="mx-auto aspect-video h-full max-w-full"><LiveFeed camId={id} zoom={zoom} pan={pan} focusBox={focus} className="h-full w-full" /></div>
        <div className="flex w-36 flex-col items-center gap-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">PTZ</div>
          <button onClick={() => mv(0, 4)} className="rounded border border-border p-2"><ArrowUp className="size-4" /></button>
          <div className="flex gap-2"><button onClick={() => mv(4, 0)} className="rounded border border-border p-2"><ArrowLeft className="size-4" /></button><button onClick={() => { setPan([0, 0]); setZoom(1); }} className="rounded border border-border px-2 text-[10px]">centro</button><button onClick={() => mv(-4, 0)} className="rounded border border-border p-2"><ArrowRight className="size-4" /></button></div>
          <button onClick={() => mv(0, -4)} className="rounded border border-border p-2"><ArrowDown className="size-4" /></button>
          <div className="mt-2 flex gap-2"><button onClick={() => setZoom((z) => Math.min(3, z + 0.4))} className="rounded border border-border p-2"><ZoomIn className="size-4" /></button><button onClick={() => setZoom((z) => Math.max(1, z - 0.4))} className="rounded border border-border p-2"><ZoomOut className="size-4" /></button></div>
          <div className="font-mono text-xs">{zoom.toFixed(1)}×</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">{["00h", "04h", "08h", "12h", "16h", "20h", "24h"].map((h) => <span key={h}>{h}</span>)}</div>
        <div className="relative h-8 rounded bg-surface">
          {marks.map((m, i) => (
            <button key={i} title={m.label} onClick={() => { setFocus(m.box); setZoom(1.6); }}
              className={cn("absolute top-1 h-6 w-1.5 -translate-x-1/2 rounded-sm hover:scale-150", m.nivel === "critico" ? "bg-crit" : m.nivel === "atencao" ? "bg-warn" : "bg-ok")} style={{ left: `${m.pos * 100}%` }} />
          ))}
          <div className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%` }} />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">Clique num marcador para pular para o momento e destacar a detecção.</div>
      </div>
      <Dossie open={pdf} onOpenChange={setPdf} titulo={`Evidência · ${c.id}`}>
        <div className="mb-2">{c.nome} · {zona(c.zona).nome}</div>
        <ul className="list-disc pl-5 text-xs">{boxes.map((b) => <li key={b.label}>{b.label}</li>)}</ul>
      </Dossie>
    </div>
  );
}
