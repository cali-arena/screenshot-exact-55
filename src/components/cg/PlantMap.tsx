import { useNavigate } from "@tanstack/react-router";
import { CAMERAS, ZONAS, type Risco } from "@/data/plant";
import { useEngine } from "@/store/engine";

const riscoFill: Record<Risco, string> = {
  baixo: "var(--ok)", medio: "var(--chart-4)", alto: "var(--warn)", critico: "var(--crit)",
};
// camera icon positions: spread inside zone
function camPos(i: number, n: number, z: (typeof ZONAS)[number]) {
  const cols = Math.ceil(Math.sqrt(n));
  const r = Math.floor(i / cols), c = i % cols;
  const rows = Math.ceil(n / cols);
  return [z.x + ((c + 0.5) / cols) * z.w, z.y + 22 + ((r + 0.5) / rows) * (z.h - 26)];
}
const RFID_POS: [number, number][] = [
  [70, 520], [160, 520], [275, 515], [400, 425], [460, 425], [520, 425], [580, 425],
  [890, 450], [660, 150], [660, 340], [665, 470], [840, 330], [560, 245], [430, 245],
];
// truck path along internal road
const ROAD = "M 115 580 L 115 455 L 270 455 L 355 455 L 355 375 L 495 375 L 635 375 L 635 560 L 190 590";

export function PlantMap({ onCam }: { onCam?: (id: string) => void }) {
  const alerts = useEngine((s) => s.alerts);
  const trucks = useEngine((s) => s.trucks);
  const navigate = useNavigate();
  const crit = new Map<string, string>();
  for (const a of alerts) if (a.status === "aberto" && a.evento.nivel === "critico" && !crit.has(a.evento.zona)) crit.set(a.evento.zona, a.evento.tipo);

  return (
    <svg viewBox="0 0 1000 600" className="size-full select-none">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
        </pattern>
      </defs>
      <rect x="10" y="10" width="980" height="580" rx="14" fill="url(#grid)" stroke="var(--border)" strokeDasharray="6 4" />
      <path d={ROAD} fill="none" stroke="var(--secondary)" strokeWidth="22" strokeLinejoin="round" />
      <path d={ROAD} fill="none" stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="8 8" opacity="0.6" />
      {ZONAS.map((z) => {
        const isCrit = crit.has(z.id);
        return (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
              fill={isCrit ? "var(--crit)" : riscoFill[z.risco]} fillOpacity={isCrit ? 0.5 : 0.12}
              stroke={isCrit ? "var(--crit)" : riscoFill[z.risco]} strokeOpacity={0.7} strokeWidth={isCrit ? 2.5 : 1}
              className={isCrit ? "animate-zone" : ""} />
            <text x={z.x + 8} y={z.y + 16} fontSize="12" fontWeight="600" fill="var(--foreground)">{z.curto}</text>
            <text x={z.x + z.w - 8} y={z.y + 16} fontSize="9" textAnchor="end" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{z.id}</text>
          </g>
        );
      })}
      {ZONAS.map((z) => {
        const cams = CAMERAS.filter((c) => c.zona === z.id);
        return cams.map((c, i) => {
          const [x, y] = camPos(i, cams.length, z);
          const col = c.status === "offline" ? "var(--offline)" : c.status === "imagem_degradada" ? "var(--warn)" : "var(--foreground)";
          return (
            <g key={c.id} className="cursor-pointer" onClick={() => (onCam ? onCam(c.id) : navigate({ to: "/cameras", search: { cam: c.id } }))}>
              <title>{c.id} · {c.nome}</title>
              <path d={`M ${x} ${y} L ${x + 16} ${y - 7} L ${x + 16} ${y + 7} Z`} fill={col} fillOpacity="0.12" />
              <circle cx={x} cy={y} r="4" fill={col} stroke="var(--background)" strokeWidth="1" />
            </g>
          );
        });
      })}
      {RFID_POS.map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 4} y={y - 4} width="8" height="8" rx="1.5" fill="var(--primary)" transform={`rotate(45 ${x} ${y})`} />
        </g>
      ))}
      {trucks.filter((t) => t.etapa < 3 || true).map((t, i) => {
        const pct = t.etapa === 0 ? 0.04 : t.etapa === 1 ? 0.18 + (i % 5) * 0.04 : t.etapa === 2 ? 0.48 + ((t.doca ?? 1) - 1) * 0.07 : 0.88;
        return (
          <g key={t.placa} style={{ offsetPath: `path("${ROAD}")`, offsetDistance: `${pct * 100}%`, transition: "offset-distance 3s ease-in-out", offsetRotate: "0deg" } as React.CSSProperties}>
            <rect x="-9" y="-5" width="18" height="10" rx="2" fill={t.agendado ? "var(--foreground)" : "var(--crit)"} stroke="var(--background)" />
          </g>
        );
      })}
      {[...crit.entries()].map(([zid, tipo]) => {
        const z = ZONAS.find((x) => x.id === zid)!;
        const bx = Math.min(z.x + z.w / 2, 840), by = Math.max(z.y - 6, 40);
        return (
          <g key={zid} transform={`translate(${bx} ${by})`}>
            <rect x="-80" y="-30" width="160" height="26" rx="6" fill="var(--crit)" />
            <path d="M -6 -4 L 6 -4 L 0 4 Z" fill="var(--crit)" />
            <text y="-13" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--primary-foreground)">⚠ {tipo}</text>
          </g>
        );
      })}
      <g transform="translate(24 30)" fontSize="10" fill="var(--muted-foreground)">
        <circle cx="4" cy="0" r="4" fill="var(--foreground)" /><text x="14" y="3">Câmera</text>
        <rect x="64" y="-4" width="8" height="8" fill="var(--primary)" transform="rotate(45 68 0)" /><text x="80" y="3">RFID</text>
        <rect x="116" y="-5" width="16" height="10" rx="2" fill="var(--foreground)" /><text x="138" y="3">Caminhão</text>
      </g>
    </svg>
  );
}
