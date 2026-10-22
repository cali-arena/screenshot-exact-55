import seed from "./seed.json";
import f1 from "@/assets/f-01.jpg";
import f2 from "@/assets/f-02.jpg";
import f3 from "@/assets/f-03.jpg";
import f4 from "@/assets/f-04.jpg";
import f5 from "@/assets/f-05.jpg";
import f6 from "@/assets/f-06.jpg";
import f7 from "@/assets/f-07.jpg";
import f8 from "@/assets/f-08.jpg";
import logo from "@/assets/carbono-logo-escuro.png.asset.json";

export const LOGO = logo.url;
export const EMPRESA = seed.empresa;

export type Nivel = "info" | "atencao" | "critico";
export type Risco = "baixo" | "medio" | "alto" | "critico";

export const FRAMES: Record<string, string> = {
  "cam-01.jpg": f1,
  "cam-02.jpg": f2,
  "cam-03.jpg": f3,
  "cam-04.jpg": f4,
  "cam-05.jpg": f5,
  "cam-06.jpg": f6,
  "cam-07.jpg": f7,
  "cam-08.jpg": f8,
};

export interface Zona {
  id: string;
  nome: string;
  curto: string;
  risco: Risco;
  // map rect in a 1000x600 svg
  x: number;
  y: number;
  w: number;
  h: number;
}

const RISCO: Record<string, Risco> = {
  Z01: "medio", Z02: "medio", Z03: "alto", Z04: "critico", Z05: "critico", Z06: "critico",
  Z07: "medio", Z08: "alto", Z09: "alto", Z10: "baixo", Z11: "medio", Z12: "medio",
};
const GEO: Record<string, [number, number, number, number, string]> = {
  Z01: [40, 470, 150, 90, "Portaria"],
  Z12: [210, 470, 130, 90, "Balança"],
  Z02: [40, 260, 300, 180, "Pátio de espera"],
  Z03: [370, 380, 250, 90, "Docas 01–04"],
  Z07: [370, 230, 120, 130, "Armazém A"],
  Z08: [500, 230, 120, 130, "Armazém B"],
  Z04: [650, 60, 310, 210, "Parque de tanques"],
  Z05: [650, 290, 160, 120, "Envase"],
  Z06: [830, 290, 130, 120, "Reatores"],
  Z09: [650, 430, 150, 110, "Laboratório"],
  Z10: [820, 430, 140, 110, "Administrativo"],
  Z11: [370, 60, 260, 140, "Perímetro norte"],
};

export const ZONAS: Zona[] = seed.zonas.map((z) => {
  const [x, y, w, h, curto] = GEO[z.id];
  return { id: z.id, nome: z.nome.replace("(", "— ").replace(")", ""), curto, risco: RISCO[z.id], x, y, w, h };
});
export const zona = (id: string) => ZONAS.find((z) => z.id === id)!;

export interface Camera {
  id: string;
  zona: string;
  nome: string;
  tipo: string;
  resolucao: string;
  status: "online" | "offline" | "imagem_degradada";
  imagem: string;
  analiticos: string[];
  primaria: boolean;
}
const firstOnline: Record<string, string> = {};
for (const c of seed.cameras) if (!firstOnline[c.zona] && c.status === "online") firstOnline[c.zona] = c.id;
export const CAMERAS: Camera[] = seed.cameras.map((c) => ({
  ...(c as Omit<Camera, "primaria">),
  primaria: firstOnline[c.zona] === c.id,
}));
export const camera = (id: string) => CAMERAS.find((c) => c.id === id)!;
export const camZona = (z: string) => firstOnline[z];
export const frameOf = (camId: string) => FRAMES[camera(camId)?.imagem ?? "cam-01.jpg"];

export const RFIDS = seed.leitores_rfid;
export const TRANSPORTADORAS = seed.transportadoras;
export const VEICULOS = seed.veiculos;

export interface Colab {
  id: string;
  nome: string;
  funcao: string;
  turno: string;
  areas_autorizadas: string[];
  cracha_rfid: string;
  nr20_valida_ate: string;
  facial_cadastrada: boolean;
}
export const COLABS: Colab[] = seed.colaboradores;
export const colab = (id: string) => COLABS.find((c) => c.id === id);
export const iniciais = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
export function nr20Status(d: string): "vencida" | "vencendo" | "ok" {
  const [dd, mm, yy] = d.split("/").map(Number);
  const t = new Date(yy, mm - 1, dd).getTime();
  const now = Date.now();
  if (t < now) return "vencida";
  if (t - now < 1000 * 3600 * 24 * 60) return "vencendo";
  return "ok";
}

export const PRODUTOS = [
  "Acetona", "Tolueno", "Álcool isopropílico", "MEK", "Acetato de etila",
  "Soda cáustica 50%", "Glicerina", "Thinner industrial",
];
export const EMBALAGENS = ["Granel", "Tambor 200 L", "IBC 1.000 L"];

export interface Box {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  nivel: "ok" | "atencao" | "critico";
}
// coordinates in % of frame, positioned on generated frames
export const DETECCOES: Record<string, Box[]> = {
  "cam-01.jpg": [
    { label: "Caminhão · CQB4E21", x: 47, y: 19, w: 13.5, h: 31, nivel: "ok" },
    { label: "Placa", x: 51, y: 44, w: 5, h: 3, nivel: "ok" },
  ],
  "cam-02.jpg": [
    { label: "Caminhão · RJX7B34", x: 11, y: 6, w: 33, h: 54, nivel: "ok" },
    { label: "Caminhão · FTA2C88", x: 57, y: 6, w: 24.5, h: 55, nivel: "atencao" },
    { label: "Motorista", x: 43.5, y: 30.5, w: 3.5, h: 14, nivel: "ok" },
  ],
  "cam-03.jpg": [
    { label: "Carreta em operação", x: 36, y: 1, w: 28.5, h: 61, nivel: "ok" },
    { label: "Tambores 200 L", x: 0.5, y: 51, w: 29.5, h: 47, nivel: "ok" },
    { label: "IBC 1.000 L", x: 76.5, y: 48, w: 21, h: 36, nivel: "ok" },
    { label: "Operador · EPI ok", x: 62, y: 25, w: 7, h: 29, nivel: "ok" },
  ],
  "cam-04.jpg": [
    { label: "Tanque T-14", x: 40.5, y: 1, w: 23, h: 41, nivel: "ok" },
    { label: "Pessoa · área restrita", x: 36.8, y: 47, w: 3.6, h: 14.5, nivel: "critico" },
  ],
  "cam-05.jpg": [
    { label: "Operador · EPI ok", x: 23.5, y: 11, w: 7, h: 29, nivel: "ok" },
    { label: "Operador · SEM CAPACETE", x: 79, y: 28, w: 11, h: 42, nivel: "critico" },
  ],
  "cam-06.jpg": [{ label: "Tambores fora da posição", x: 32, y: 58, w: 15, h: 27, nivel: "atencao" }],
  "cam-07.jpg": [{ label: "Analista · jaleco ok", x: 34.5, y: 23, w: 10.5, h: 49.5, nivel: "ok" }],
  "cam-08.jpg": [{ label: "Pessoa · fora de horário", x: 75, y: 26.5, w: 8, h: 33, nivel: "critico" }],
};

export const KPIS_MES = seed.kpis_mes;

export const PERFIS = {
  Diretoria: ["CAM-05", "CAM-19", "CAM-29", "CAM-01"],
  Portaria: ["CAM-01", "CAM-59", "CAM-05", "CAM-11"],
  "Segurança/HSE": ["CAM-19", "CAM-29", "CAM-35", "CAM-49"],
} as const;
export type Perfil = keyof typeof PERFIS;

export const NIVEL_LABEL: Record<Nivel, string> = { info: "Informativo", atencao: "Atenção", critico: "Crítico" };

export const ESCADA = ["Supervisor do turno + HSE", "Coordenação", "Gerência / Diretoria"];
export const RESPONSAVEIS = ["Sup. Marcos (Turno B)", "Coord. Regina", "Ger. Paulo"];
