import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLABS, VEICULOS, ZONAS, camZona, frameOf, zona } from "@/data/plant";
import { fmtHora, useEngine } from "@/store/engine";
import { pageHead } from "@/lib/head";
import { NivelBadge, Panel } from "@/components/cg/ui";
import { Dossie } from "@/components/cg/Dossie";
import { trajetoria } from "./_painel.pessoas";

export const Route = createFileRoute("/_painel/investigacao")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: pageHead("Investigação", "Busca única por placa, pessoa, crachá, câmera ou evento com linha do tempo entre câmeras."),
  component: Inv,
});

interface Item { h: string; local: string; cam: string; det: string; extra?: string }

function Inv() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const events = useEngine((s) => s.events);
  const [txt, setTxt] = useState(q);
  const [zf, setZf] = useState("");
  const [nf, setNf] = useState("");
  const [pdf, setPdf] = useState(false);
  const termo = q.trim().toUpperCase();

  const res = useMemo(() => {
    if (!termo) return null;
    const v = VEICULOS.find((x) => x.placa === termo);
    if (v) {
      const items: Item[] = [
        { h: "07:42:18", local: "Portaria · entrada", cam: "CAM-01", det: "Placa lida por OCR + RFID", extra: `RFID ${v.tag_rfid} · pedido PV-048210` },
        { h: "07:49:05", local: "Balança rodoviária", cam: "CAM-59", det: "Pesagem de entrada · 15.240 kg", extra: "RFID-03" },
        { h: "08:05:41", local: "Doca 02", cam: "CAM-11", det: "Carregamento iniciado · 80 tambores de 200 L de acetona", extra: "RFID-05 · pedido PV-048210 conferido" },
        { h: "09:12:30", local: "Portaria · saída", cam: "CAM-02", det: "Saída liberada · permanência total 1h30", extra: "RFID-02 · NF-e emitida no JDE" },
      ];
      return { tipo: "veiculo" as const, titulo: `Veículo ${v.placa} · ${v.transportadora} · ${v.tipo}`, items };
    }
    const c = COLABS.find((x) => x.id === termo || x.cracha_rfid === termo || x.nome.toUpperCase().includes(termo));
    if (c) {
      return { tipo: "pessoa" as const, titulo: `${c.nome} · ${c.id} · ${c.funcao}`, items: trajetoria(c).map((p) => ({ h: p.h, local: zona(p.z).nome, cam: p.cam, det: "Rosto + crachá conferidos", extra: c.cracha_rfid })) };
    }
    const evs = events.filter((e) => (e.cam + e.tipo + e.detalhe + zona(e.zona).nome).toUpperCase().includes(termo));
    return { tipo: "eventos" as const, titulo: `${evs.length} eventos encontrados para "${q}"`, items: evs.map((e) => ({ h: fmtHora(e.ts), local: zona(e.zona).nome, cam: e.cam, det: `${e.tipo} · ${e.detalhe}` })) };
  }, [termo, events, q]);

  const filtered = (res?.items ?? []).filter((i) => (!zf || i.local.includes(zona(zf).nome.split(" ")[0])) );

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">Investigação</h1><p className="text-sm text-muted-foreground">Encontre qualquer coisa que as câmeras e os RFIDs viram hoje</p></div>
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/investigacao", search: { q: txt } }); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Buscar placa, pessoa, crachá, câmera ou evento" className="w-full rounded-lg border border-input bg-card py-3 pl-11 pr-3 font-mono text-base outline-none focus:border-primary" />
        </div>
        <button className="rounded-lg bg-brand px-6 text-sm font-semibold text-primary-foreground">Buscar</button>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Sugestões:</span>
        {["CQB4E21", "COL-0414", "CAM-29", "EPI"].map((s) => <button key={s} onClick={() => { setTxt(s); navigate({ to: "/investigacao", search: { q: s } }); }} className="rounded-full border border-border px-3 py-1 font-mono hover:border-primary">{s}</button>)}
        <span className="ml-auto" />
        <select className="rounded-md border border-input bg-background px-2 py-1"><option>Hoje</option><option>Últimas 24 h</option><option>7 dias</option></select>
        <select value={zf} onChange={(e) => setZf(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1"><option value="">Todas as zonas</option>{ZONAS.map((z) => <option key={z.id} value={z.id}>{z.curto}</option>)}</select>
        <select className="rounded-md border border-input bg-background px-2 py-1"><option>Todos os tipos</option><option>Veículo</option><option>Pessoa</option><option>EPI</option></select>
        <select value={nf} onChange={(e) => setNf(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1"><option value="">Toda criticidade</option><option>Crítico</option><option>Atenção</option></select>
      </div>
      {res && (
        <Panel title={res.titulo} data-tour="linha" right={<button onClick={() => setPdf(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><FileText className="size-3.5" />Gerar dossiê da ocorrência (PDF)</button>}>
          {res.tipo === "veiculo" ? (
            <div className="relative grid grid-cols-4 gap-4 pt-6">
              <div className="absolute left-[12%] right-[12%] top-[34px] h-0.5 bg-primary" />
              {filtered.map((i, k) => (
                <div key={k} className="animate-feed-in" style={{ animationDelay: `${k * 150}ms` }}>
                  <div className="relative z-10 mx-auto mb-3 grid size-6 place-items-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground">{k + 1}</div>
                  <div className="font-mono text-sm font-semibold">{i.h}</div>
                  <div className="text-sm font-medium">{i.local}</div>
                  <img src={frameOf(i.cam)} alt="" className="my-2 aspect-video w-full rounded-md object-cover" />
                  <div className="font-mono text-[11px] text-muted-foreground">{i.cam}</div>
                  <div className="text-xs">{i.det}</div>
                  <div className="text-[11px] text-muted-foreground">{i.extra}</div>
                </div>
              ))}
            </div>
          ) : (
            <ol className="relative ml-3 border-l border-border">
              {filtered.slice(0, 30).map((i, k) => (
                <li key={k} className="mb-3 ml-5 flex animate-feed-in gap-3">
                  <span className="absolute -left-1.5 mt-3 size-3 rounded-full bg-primary" />
                  <img src={frameOf(i.cam)} alt="" className="h-14 w-24 rounded object-cover" />
                  <div className="text-xs"><div className="font-mono font-semibold">{i.h} · {i.cam}</div><div className="font-medium">{i.local}</div><div className="text-muted-foreground">{i.det}</div></div>
                </li>
              ))}
              {!filtered.length && <li className="ml-5 text-sm text-muted-foreground">Nada encontrado.</li>}
            </ol>
          )}
        </Panel>
      )}
      {!res && (
        <div className="grid grid-cols-3 gap-3">
          {events.filter((e) => e.nivel !== "info").slice(0, 6).map((e) => (
            <button key={e.id} onClick={() => navigate({ to: "/investigacao", search: { q: e.cam } })} className="panel flex gap-3 p-2 text-left hover:border-primary">
              <img src={frameOf(e.cam)} alt="" className="h-14 w-24 rounded object-cover" />
              <div className="min-w-0 text-xs"><NivelBadge nivel={e.nivel} /><div className="mt-1 truncate font-medium">{e.tipo}</div><div className="font-mono text-muted-foreground">{fmtHora(e.ts)} · {e.cam}</div></div>
            </button>
          ))}
        </div>
      )}
      <Dossie open={pdf} onOpenChange={setPdf} titulo="Dossiê da ocorrência">
        <div className="mb-3 font-semibold">{res?.titulo}</div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.slice(0, 6).map((i, k) => (
            <div key={k} className={cn("flex gap-2 rounded border border-ink/15 p-2")}>
              <img src={frameOf(i.cam)} alt="" className="h-14 w-24 rounded object-cover" />
              <div className="text-[11px]"><b className="font-mono">{i.h} · {i.cam}</b><br />{i.local}<br /><span className="opacity-70">{i.det}</span></div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] opacity-70">Evidências extraídas do gravador local com carimbo de tempo. Cadeia de custódia preservada; acesso registrado em trilha de auditoria. Zona de referência: {zona(camZona("Z01") ? "Z01" : "Z01").nome}.</p>
      </Dossie>
    </div>
  );
}
