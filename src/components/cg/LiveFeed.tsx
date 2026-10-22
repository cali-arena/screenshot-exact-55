import { useEffect, useMemo, useState } from "react";
import { VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { DETECCOES, FRAMES, camera, type Box } from "@/data/plant";
import { useEngine } from "@/store/engine";

let noiseUrl: string | null = null;
function getNoise() {
  if (noiseUrl || typeof document === "undefined") return noiseUrl;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseUrl = c.toDataURL();
  return noiseUrl;
}

const boxColor: Record<Box["nivel"], string> = {
  ok: "border-ok text-ok",
  atencao: "border-warn text-warn",
  critico: "border-crit text-crit animate-ring",
};
const labelBg: Record<Box["nivel"], string> = { ok: "bg-ok", atencao: "bg-warn", critico: "bg-crit" };

export function LiveFeed({
  camId, compact, className, zoom = 1, pan = [0, 0], highlight, focusBox, onClick, hud = true,
}: {
  camId: string; compact?: boolean; className?: string; zoom?: number; pan?: [number, number];
  highlight?: boolean; focusBox?: string; onClick?: () => void; hud?: boolean;
}) {
  const cam = camera(camId);
  const now = useEngine((s) => s.now);
  const critZone = useEngine((s) => s.alerts.some((a) => a.status === "aberto" && a.evento.nivel === "critico" && a.evento.zona === cam.zona));
  const [hidden, setHidden] = useState<number>(-1);
  const boxes = useMemo(() => {
    const b = DETECCOES[cam.imagem] ?? [];
    return cam.primaria ? b : b.filter((x) => x.nivel === "ok");
  }, [cam]);
  const variant = parseInt(camId.slice(4)) % 2 === 0;
  const [noise, setNoise] = useState<string | null>(null);
  useEffect(() => setNoise(getNoise()), []);
  useEffect(() => {
    const t = setInterval(() => {
      setHidden(Math.random() < 0.4 ? Math.floor(Math.random() * boxes.length) : -1);
    }, 2600 + Math.random() * 2000);
    return () => clearInterval(t);
  }, [boxes.length]);

  const offline = cam.status === "offline";
  const degraded = cam.status === "imagem_degradada";
  const d = new Date(now);

  return (
    <div onClick={onClick}
      className={cn("group relative aspect-video overflow-hidden rounded-md bg-ink", onClick && "cursor-pointer",
        (highlight || critZone) && !offline && "ring-2 ring-crit", className)}>
      {offline ? (
        <div className="absolute inset-0 grid place-items-center bg-offline/30 text-muted-foreground">
          <div className="text-center">
            <VideoOff className="mx-auto mb-1 size-6" />
            <div className="text-xs font-semibold uppercase tracking-widest">Sem sinal</div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-500" style={{ transform: `scale(${zoom}) translate(${pan[0]}%, ${pan[1]}%)` }}>
            <div className={cn("absolute inset-0 animate-flicker", variant ? "animate-kb-a" : "animate-kb-b", degraded && "blur-[3px] saturate-50")}
              style={{ animationDelay: `-${(parseInt(camId.slice(4)) * 3) % 20}s` }}>
              <img src={FRAMES[cam.imagem]} alt={cam.nome} className="absolute inset-0 size-full object-cover" draggable={false} />
              {!degraded && boxes.map((b, i) => (
                <div key={b.label}
                  className={cn("absolute rounded-[2px] border-2 transition-opacity duration-300", boxColor[b.nivel],
                    hidden === i ? "opacity-0" : "opacity-100", focusBox && focusBox !== b.label && "opacity-30")}
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}>
                  {!compact && (
                    <span className={cn("absolute -top-[18px] left-[-2px] whitespace-nowrap rounded-t-[2px] px-1 py-px font-mono text-[9px] font-semibold text-ink", labelBg[b.nivel])}>
                      {b.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {noise && <div className="pointer-events-none absolute -inset-[20%] animate-grain opacity-[0.07] mix-blend-screen" style={{ backgroundImage: `url(${noise})` }} />}
      <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
      {hud && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-ink/80 px-2 py-1 font-mono text-[10px] text-foreground">
          <span className="truncate"><b>{cam.id}</b> <span className="text-muted-foreground">{compact ? "" : cam.nome}</span></span>
          <span className="flex shrink-0 items-center gap-2">
            {!compact && <span>{d.toLocaleDateString("pt-BR")} {d.toLocaleTimeString("pt-BR")}</span>}
            {!offline && <span className="flex items-center gap-1 text-crit"><span className="size-1.5 animate-live rounded-full bg-crit" />REC</span>}
          </span>
        </div>
      )}
      {degraded && (
        <div className="absolute inset-x-2 bottom-2 rounded bg-warn/90 px-2 py-1 text-center text-[10px] font-semibold text-ink">
          Imagem degradada · manutenção sugerida
        </div>
      )}
    </div>
  );
}
