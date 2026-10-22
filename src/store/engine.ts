import { create } from "zustand";
import {
  CAMERAS, COLABS, EMBALAGENS, PRODUTOS, TRANSPORTADORAS, VEICULOS, camZona, nr20Status,
  type Nivel, type Perfil,
} from "@/data/plant";

// deterministic RNG
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = mulberry32(19780522);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rng() * a.length)];

export interface Evento {
  id: string;
  ts: number;
  cam: string;
  zona: string;
  tipo: string;
  detalhe: string;
  nivel: Nivel;
  placa?: string;
  colab?: string;
  resultado?: "ok" | "negado";
  motivo?: string;
}
export interface Alerta {
  id: string;
  evento: Evento;
  status: "aberto" | "assumido" | "resolvido" | "falso";
  degrau: 0 | 1 | 2;
  desde: number; // last escalation reference
  criado: number;
  responsavel?: string;
}
export interface Truck {
  placa: string;
  transportadora: string;
  tipo: string;
  rfid: string;
  pedido: string | null;
  produto: string;
  embalagem: string;
  etapa: 0 | 1 | 2 | 3;
  entrada: number;
  etapaDesde: number;
  doca?: number;
  agendado: boolean;
}
export interface GateRead {
  seq: number;
  placa: string;
  rfid: string;
  pedido: string | null;
  agendado: boolean;
}

let idc = 1000;
const nid = () => `EV-${++idc}`;

function mkTruck(etapa: Truck["etapa"], minAgo: number, i: number, now: number, agendado = true): Truck {
  const v = VEICULOS[i % VEICULOS.length];
  const entrada = now - minAgo * 60000;
  return {
    placa: v.placa,
    transportadora: v.transportadora,
    tipo: v.tipo,
    rfid: v.tag_rfid,
    pedido: agendado ? `PV-${String(48210 + i * 7).padStart(6, "0")}` : null,
    produto: PRODUTOS[i % PRODUTOS.length],
    embalagem: EMBALAGENS[i % 3],
    etapa,
    entrada,
    etapaDesde: entrada + Math.min(minAgo, 10) * 30000,
    agendado,
  };
}

function hojeAs(h: string, now: number) {
  const [hh, mm, ss] = h.split(":").map(Number);
  const d = new Date(now);
  d.setHours(hh, mm, ss ?? 0, 0);
  if (d.getTime() > now) d.setTime(d.getTime() - 3600 * 1000 * 3);
  return d.getTime();
}

function initial(now: number) {
  const trucks: Truck[] = [
    mkTruck(0, 2, 1, now),
    mkTruck(1, 138, 2, now),
    mkTruck(1, 74, 3, now),
    mkTruck(1, 52, 4, now),
    mkTruck(1, 31, 5, now),
    mkTruck(1, 18, 6, now),
    mkTruck(1, 96, 7, now),
    mkTruck(1, 9, 8, now),
    { ...mkTruck(2, 47, 0, now), doca: 2 },
    { ...mkTruck(2, 63, 9, now), doca: 1 },
    { ...mkTruck(2, 22, 10, now), doca: 4 },
    mkTruck(3, 88, 11, now),
  ];
  trucks[1].transportadora = "Granel Express";
  trucks[1].tipo = "carreta";
  const base: [string, string, string, string, string, Nivel][] = [
    ["14:31:52", "Z05", "Ausência de EPI", "Operador sem capacete na linha de envase", "", "critico"],
    ["14:28:10", "Z04", "Acesso negado", "Colaborador com NR-20 vencida no parque de tanques", "", "critico"],
    ["14:22:41", "Z01", "Veículo não agendado", "Placa sem agendamento no JDE", "", "atencao"],
    ["14:15:03", "Z02", "Permanência excedida", "Carreta há 2h18 no pátio (limite 1h30)", "", "atencao"],
    ["14:09:37", "Z08", "Item fora de posição", "Tambores fora da área demarcada", "", "atencao"],
    ["13:58:20", "Z03", "Carga sem pedido no JDE", "RFID na doca 02 sem pedido correspondente", "", "atencao"],
    ["02:41:09", "Z11", "Intrusão no perímetro", "Pessoa junto à cerca norte fora do horário", "", "critico"],
  ];
  const events: Evento[] = base.map(([h, z, tipo, detalhe, , nivel]) => ({
    id: nid(), ts: hojeAs(h, now), zona: z, cam: camZona(z), tipo, detalhe, nivel,
  }));
  events.sort((a, b) => b.ts - a.ts);
  const alerts: Alerta[] = events.slice(0, 3).map((e, i) => ({
    id: `AL-${e.id}`, evento: e, status: i === 2 ? "assumido" : "aberto", degrau: 0,
    desde: now, criado: now - (i + 1) * 40000, responsavel: i === 2 ? "Sup. Marcos (Turno B)" : undefined,
  }));
  return { trucks, events, alerts };
}

interface State {
  now: number;
  running: boolean;
  speed: 1 | 2;
  nextAt: number;
  events: Evento[];
  alerts: Alerta[];
  trucks: Truck[];
  gate: GateRead | null;
  pessoas: number;
  epi: number;
  permMedia: number;
  noPrazo: number;
  negadosHoje: number;
  movHoje: number;
  vibrate: number;
  calibracoes: number;
  metrics: { t: number; gpu: number; temp: number }[];
  perfil: Perfil;
  presenter: boolean;
  wall: boolean;
  tour: number | null;
  tourAuto: boolean;
  logged: boolean;
  tick: () => void;
  toggleRun: () => void;
  setSpeed: (s: 1 | 2) => void;
  push: (e: Omit<Evento, "id" | "ts">) => Evento;
  randomEvent: () => void;
  scenario: (k: ScenarioKey) => void;
  arrive: (agendado: boolean) => void;
  assumir: (id: string) => void;
  resolver: (id: string) => void;
  falso: (id: string) => void;
  set: (p: Partial<State>) => void;
}

export type ScenarioKey = "naoAgendado" | "permanencia" | "semPedido" | "capacete" | "nr20" | "intrusao" | "tambores";
export const SCENARIOS: { k: ScenarioKey; label: string; icon: string }[] = [
  { k: "naoAgendado", label: "Caminhão não agendado na portaria", icon: "🚛" },
  { k: "permanencia", label: "Carreta acima do tempo no pátio", icon: "⏱️" },
  { k: "semPedido", label: "Carga na doca sem pedido no JDE", icon: "📦" },
  { k: "capacete", label: "Operador sem capacete no envase", icon: "🦺" },
  { k: "nr20", label: "NR-20 vencida no parque de tanques", icon: "⛔" },
  { k: "intrusao", label: "Intrusão no perímetro norte", icon: "🌙" },
  { k: "tambores", label: "Tambores fora de posição no armazém B", icon: "🛢️" },
];

const now0 = Date.now();
const init = initial(now0);
let truckIdx = 12;
let gateSeq = 0;

export const useEngine = create<State>((set, get) => ({
  now: now0,
  running: true,
  speed: 1,
  nextAt: now0 + 6000,
  ...init,
  gate: null,
  pessoas: 118,
  epi: 92.4,
  permMedia: 38,
  noPrazo: 91,
  negadosHoje: 4,
  movHoje: 212,
  vibrate: 0,
  calibracoes: 0,
  metrics: Array.from({ length: 40 }, (_, i) => ({ t: i, gpu: 55 + rng() * 15, temp: 61 + rng() * 4 })),
  perfil: "Diretoria",
  presenter: false,
  wall: false,
  tour: null,
  tourAuto: false,
  logged: false,
  set: (p) => set(p),

  push: (e) => {
    const ev: Evento = { ...e, id: nid(), ts: Date.now() };
    set((s) => {
      const alerts =
        ev.nivel === "info"
          ? s.alerts
          : [{ id: `AL-${ev.id}`, evento: ev, status: "aberto" as const, degrau: 0 as const, desde: Date.now(), criado: Date.now() }, ...s.alerts].slice(0, 60);
      return {
        events: [ev, ...s.events].slice(0, 200),
        alerts,
        vibrate: ev.nivel === "critico" ? s.vibrate + 1 : s.vibrate,
        negadosHoje: ev.resultado === "negado" ? s.negadosHoje + 1 : s.negadosHoje,
        epi: ev.tipo === "Ausência de EPI" ? Math.max(88, +(s.epi - 0.3).toFixed(1)) : s.epi,
      };
    });
    return ev;
  },

  arrive: (agendado) => {
    const i = truckIdx++;
    const t = mkTruck(0, 0, i, Date.now(), agendado);
    if (!agendado) {
      t.placa = pick(["QXB7A12", "BRA2E19", "MTZ5C40", "GHO9F03"]);
      t.transportadora = "Não cadastrada";
    }
    t.entrada = Date.now();
    t.etapaDesde = Date.now();
    gateSeq++;
    set((s) => ({
      trucks: [...s.trucks.filter((x) => x.placa !== t.placa), t],
      gate: { seq: gateSeq, placa: t.placa, rfid: agendado ? t.rfid : "—", pedido: t.pedido, agendado },
    }));
    const { push } = get();
    setTimeout(() => {
      push(
        agendado
          ? { cam: "CAM-01", zona: "Z01", tipo: "Passagem de veículo", detalhe: `Placa ${t.placa} + RFID ${t.rfid} · agendado no JDE`, nivel: "info", placa: t.placa }
          : { cam: "CAM-01", zona: "Z01", tipo: "Veículo não agendado", detalhe: `Placa ${t.placa} sem agendamento no JDE · cancela retida`, nivel: "critico", placa: t.placa },
      );
    }, 2600);
  },

  scenario: (k) => {
    const s = get();
    switch (k) {
      case "naoAgendado":
        s.arrive(false);
        break;
      case "permanencia": {
        const trucks = [...s.trucks];
        const i = trucks.findIndex((t) => t.etapa === 1);
        if (i >= 0) {
          trucks[i] = { ...trucks[i], entrada: Date.now() - 105 * 60000 };
          set({ trucks });
          s.push({ cam: camZona("Z02"), zona: "Z02", tipo: "Permanência excedida", detalhe: `Carreta ${trucks[i].placa} há 1h45 no pátio (limite 1h30)`, nivel: "atencao", placa: trucks[i].placa });
        }
        break;
      }
      case "semPedido":
        s.push({ cam: camZona("Z03"), zona: "Z03", tipo: "Carga sem pedido no JDE", detalhe: "Tag RFID lida na doca 03 sem pedido correspondente no JDE", nivel: "critico" });
        break;
      case "capacete":
        s.push({ cam: camZona("Z05"), zona: "Z05", tipo: "Ausência de EPI", detalhe: "Operador sem capacete na linha de envase", nivel: "critico" });
        break;
      case "nr20": {
        const c = COLABS.find((x) => nr20Status(x.nr20_valida_ate) === "vencida") ?? COLABS[0];
        s.push({ cam: camZona("Z04"), zona: "Z04", tipo: "Acesso negado", detalhe: `${c.nome} (${c.id}) · NR-20 vencida em ${c.nr20_valida_ate}`, nivel: "critico", colab: c.id, resultado: "negado", motivo: "NR-20 vencida" });
        break;
      }
      case "intrusao":
        s.push({ cam: camZona("Z11"), zona: "Z11", tipo: "Intrusão no perímetro", detalhe: "Pessoa junto à cerca norte fora do horário", nivel: "critico" });
        break;
      case "tambores":
        s.push({ cam: camZona("Z08"), zona: "Z08", tipo: "Item fora de posição", detalhe: "2 tambores de 200 L no corredor 3 fora da área demarcada", nivel: "atencao" });
        break;
    }
  },

  randomEvent: () => {
    const s = get();
    const r = rng();
    if (r < 0.7) {
      if (rng() < 0.3) return s.arrive(true);
      const c = pick(COLABS);
      const z = pick(c.areas_autorizadas);
      s.push({ cam: camZona(z), zona: z, tipo: "Passagem de pessoa", detalhe: `${c.nome} · rosto + crachá ${c.cracha_rfid}`, nivel: "info", colab: c.id, resultado: "ok" });
    } else if (r < 0.9) {
      const opts: (() => void)[] = [
        () => s.scenario("tambores"),
        () => s.push({ cam: camZona("Z12"), zona: "Z12", tipo: "Placa sem RFID", detalhe: `Placa ${pick(VEICULOS).placa} lida sem passagem RFID na balança`, nivel: "atencao" }),
        () => s.push({ cam: "CAM-44", zona: "Z08", tipo: "Imagem degradada", detalhe: "CAM-44 com foco degradado · manutenção sugerida", nivel: "atencao" }),
        () => {
          const t = s.trucks.find((x) => x.etapa === 1);
          if (t) s.push({ cam: camZona("Z02"), zona: "Z02", tipo: "Permanência excedida", detalhe: `Carreta ${t.placa} acima de 1h no pátio`, nivel: "atencao", placa: t.placa });
        },
        () => {
          const c = pick(COLABS);
          s.push({ cam: camZona("Z06"), zona: "Z06", tipo: "Acesso negado", detalhe: `${c.nome} fora do turno autorizado`, nivel: "atencao", colab: c.id, resultado: "negado", motivo: "Fora do turno" });
        },
      ];
      pick(opts)();
    } else {
      s.scenario(pick<ScenarioKey>(["capacete", "nr20", "semPedido"]));
    }
  },

  tick: () => {
    const s = get();
    const now = Date.now();
    const patch: Partial<State> = { now };
    // metrics
    const last = s.metrics[s.metrics.length - 1];
    patch.metrics = [...s.metrics.slice(1), {
      t: last.t + 1,
      gpu: Math.max(35, Math.min(92, last.gpu + (rng() - 0.5) * 8)),
      temp: Math.max(56, Math.min(74, last.temp + (rng() - 0.5) * 1.2)),
    }];
    if (s.running) {
      // escalation
      let vib = s.vibrate;
      const alerts = s.alerts.map((a) => {
        if (a.status === "aberto" && a.evento.nivel === "critico" && a.degrau < 2 && now - a.desde > 60000 / s.speed) {
          vib++;
          return { ...a, degrau: (a.degrau + 1) as 1 | 2, desde: now };
        }
        return a;
      });
      patch.alerts = alerts;
      patch.vibrate = vib;
      // trucks
      let trucks = s.trucks.map((t) => ({ ...t }));
      const docasOcup = new Set(trucks.filter((t) => t.etapa === 2).map((t) => t.doca));
      for (const t of trucks) {
        const dwell = now - t.etapaDesde;
        const p = 0.02 * s.speed;
        if (t.etapa === 0 && dwell > 8000 && t.agendado && rng() < p * 3) {
          t.etapa = 1; t.etapaDesde = now;
        } else if (t.etapa === 1 && dwell > 25000 && docasOcup.size < 4 && rng() < p && now - t.entrada < 100 * 60000) {
          const free = [1, 2, 3, 4].find((d) => !docasOcup.has(d))!;
          t.etapa = 2; t.etapaDesde = now; t.doca = free; docasOcup.add(free);
        } else if (t.etapa === 2 && dwell > 40000 && rng() < p) {
          docasOcup.delete(t.doca); t.etapa = 3; t.etapaDesde = now; t.doca = undefined;
          patch.movHoje = (patch.movHoje ?? s.movHoje) + 1;
        }
      }
      trucks = trucks.filter((t) => !(t.etapa === 3 && now - t.etapaDesde > 30000));
      if (!trucks.some((t) => t.etapa === 3) && rng() < 0.01) {
        // keep exit column alive
      }
      patch.trucks = trucks;
      patch.pessoas = Math.max(108, Math.min(128, s.pessoas + (rng() < 0.15 ? (rng() < 0.5 ? -1 : 1) : 0)));
      patch.permMedia = Math.round(36 + (trucks.filter((t) => t.etapa === 1).reduce((a, t) => a + (now - t.entrada), 0) / Math.max(1, trucks.filter((t) => t.etapa === 1).length) / 60000) / 12);
      if (rng() < 0.05) patch.epi = Math.min(96, +(s.epi + 0.1).toFixed(1));
      if (now >= s.nextAt) {
        patch.nextAt = now + (5000 + rng() * 4000) / s.speed;
        set(patch);
        get().randomEvent();
        return;
      }
    }
    set(patch);
  },

  toggleRun: () => set((s) => ({ running: !s.running })),
  setSpeed: (speed) => set({ speed }),
  assumir: (id) => set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, status: "assumido", responsavel: ["Sup. Marcos (Turno B)", "Coord. Regina", "Ger. Paulo"][a.degrau] } : a)) })),
  resolver: (id) => set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, status: "resolvido", responsavel: a.responsavel ?? "Sup. Marcos (Turno B)" } : a)) })),
  falso: (id) => set((s) => ({ calibracoes: s.calibracoes + 1, alerts: s.alerts.map((a) => (a.id === id ? { ...a, status: "falso" } : a)) })),
}));

export const openAlerts = (a: Alerta[]) => a.filter((x) => x.status === "aberto" || x.status === "assumido");
export const camsOnline = CAMERAS.filter((c) => c.status !== "offline").length;

export function fmtHora(ts: number, sec = true) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: sec ? "2-digit" : undefined });
}
export function fmtDur(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  const s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}h${String(m % 60).padStart(2, "0")}` : `${m}min ${String(s).padStart(2, "0")}s`;
}
