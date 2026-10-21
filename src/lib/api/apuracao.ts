import {
  CARGOS_APURACAO,
  type ApuracaoCandidato,
  type ApuracaoSnapshot,
  type CargoApuracaoId,
  type UfSigla,
} from "@/lib/apuracao";
import type { ElectionResult } from "@/lib/types";

/**
 * ApuraÃ§Ã£o oficial do TSE para as eleiÃ§Ãµes de 2026.
 *
 * O portal publica um JSON por UF e cargo. AlÃ©m dos candidatos, o arquivo
 * traz o andamento da totalizaÃ§Ã£o:
 * - `s.ts` / `s.st` / `s.pst`: seÃ§Ãµes totais, apuradas e percentual;
 * - `e.c` / `e.a`: comparecimento e abstenÃ§Ãµes;
 * - `v.vv` / `v.tv`: votos vÃ¡lidos e votos totais.
 *
 * O cache Ã© curto (20s) e existe apenas para deduplicar acessos. A rota
 * interna responde com `no-store`, entÃ£o o navegador sempre consulta uma
 * versÃ£o recente durante a votaÃ§Ã£o.
 */
function numeroInteiro(valor: string | undefined, padrao: number): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : padrao;
}

const TSE_BASE = "https://resultados.tse.jus.br/oficial";
const ANO_ELEICAO = 2026;
// CÃ³digo da eleiÃ§Ã£o no TSE: 6259 no 1Âº turno. Para o 2Âº turno, o tribunal
// publica um novo cÃ³digo; ele pode ser informado por ambiente sem alterar o cÃ³digo.
const ELEICAO = numeroInteiro(process.env.TSE_ELEICAO, 6259);
const TURNO: 1 | 2 = process.env.TSE_TURNO === "2" ? 2 : 1;
const DATA_ELEICAO =
  process.env.TSE_DATA_ELEICAO ??
  (TURNO === 2 ? "2026-10-25" : "2026-10-04");
const CACHE_MS = 20_000;

const FONTE = {
  label: "TSE â€” Resultados 2026",
  href: "https://resultados.tse.jus.br/",
  tipo: "oficial",
  data: DATA_ELEICAO,
} as const;

interface TseCandidato {
  n?: string;
  sqcand?: string;
  nm?: string;
  nmu?: string;
  vap?: string;
  pvap?: string;
  st?: string;
  e?: string;
}

interface TsePartido {
  sg?: string;
  nm?: string;
  cand?: TseCandidato[];
}

interface TseAgremiacao {
  sg?: string;
  nm?: string;
  com?: string;
  par?: TsePartido[];
}

interface TseCargo {
  cd?: string;
  nmn?: string;
  agr?: TseAgremiacao[];
  par?: TsePartido[];
}

interface TseResultado {
  dt?: string;
  ht?: string;
  dg?: string;
  hg?: string;
  s?: {
    ts?: string;
    st?: string;
    pst?: string;
  };
  e?: {
    c?: string;
    a?: string;
  };
  v?: {
    tv?: string;
    vv?: string;
  };
  carg?: TseCargo[];
}

const cache = new Map<string, { at: number; data: TseResultado }>();
const inFlight = new Map<string, Promise<TseResultado | null>>();

async function fetchTse(url: string): Promise<TseResultado | null> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const pending = inFlight.get(url);
  if (pending) return pending;

  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "POLITICOS.BR/1.0 (+dados abertos)",
        },
      });

      if (!res.ok) return null;

      const data = (await res.json()) as TseResultado;
      cache.set(url, { at: Date.now(), data });
      return data;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })().finally(() => {
    inFlight.delete(url);
  });

  inFlight.set(url, promise);
  return promise;
}

function numero(valor?: string): number | undefined {
  if (!valor) return undefined;
  const parsed = Number(valor.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizar(valor?: string): string {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function resultadoDe(situacao?: string, eleito?: string): ElectionResult {
  const texto = normalizar(situacao);
  if (texto.includes("NAO ELEITO")) return "nao_eleito";
  if (texto.includes("SUPLENTE")) return "suplente";
  if (eleito === "s" || texto.includes("ELEITO")) return "eleito";
  return "candidato";
}

function candidatoDe(
  candidato: TseCandidato,
  partido: TsePartido,
  agremiacao?: TseAgremiacao,
  indice = 0,
): ApuracaoCandidato {
  const nome = candidato.nmu?.trim() || candidato.nm?.trim() || "Candidato";
  const sigla = partido.sg?.trim() || partido.nm?.trim() || "â€”";
  const coligacao =
    agremiacao?.sg && agremiacao.sg !== sigla
      ? agremiacao.sg
      : agremiacao?.com && agremiacao.com !== sigla
        ? agremiacao.com
        : undefined;

  return {
    id:
      candidato.sqcand?.trim() ||
      `${candidato.n?.trim() ?? "candidato"}-${indice}`,
    numero: candidato.n?.trim() || "â€”",
    nome,
    nomeCompleto: candidato.nm?.trim() || nome,
    partido: sigla,
    coligacao,
    votos: numero(candidato.vap) ?? 0,
    percentual: numero(candidato.pvap) ?? 0,
    situacao: candidato.st?.trim() || undefined,
    resultado: resultadoDe(candidato.st, candidato.e),
  };
}

function partidosDoCargo(cargo: TseCargo): TsePartido[] {
  const deAgremiacoes = (cargo.agr ?? []).flatMap((agr) => agr.par ?? []);
  return deAgremiacoes.length > 0 ? deAgremiacoes : (cargo.par ?? []);
}

function candidatosDoCargo(cargo: TseCargo): ApuracaoCandidato[] {
  const candidatos: ApuracaoCandidato[] = [];

  for (const agremiacao of cargo.agr ?? []) {
    for (const partido of agremiacao.par ?? []) {
      for (const candidato of partido.cand ?? []) {
        candidatos.push(
          candidatoDe(candidato, partido, agremiacao, candidatos.length),
        );
      }
    }
  }

  // Alguns conjuntos antigos expÃµem os partidos fora de `agr`.
  if (candidatos.length === 0) {
    for (const partido of partidosDoCargo(cargo)) {
      for (const candidato of partido.cand ?? []) {
        candidatos.push(
          candidatoDe(candidato, partido, undefined, candidatos.length),
        );
      }
    }
  }

  return candidatos.sort(
    (a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export async function getApuracao(
  uf: UfSigla,
  cargoId: CargoApuracaoId,
): Promise<ApuracaoSnapshot | null> {
  const cargo = CARGOS_APURACAO.find((item) => item.id === cargoId);
  if (!cargo) return null;

  // No Distrito Federal, deputado distrital usa o cÃ³digo 8.
  const codigo =
    uf === "DF" && cargoId === "deputado-estadual" ? "8" : cargo.codigo;
  const ufMinuscula = uf.toLowerCase();
  const arquivo = `${ufMinuscula}-c${codigo.padStart(4, "0")}-e${String(
    ELEICAO,
  ).padStart(6, "0")}-u.json`;
  const url = `${TSE_BASE}/ele${ANO_ELEICAO}/${ELEICAO}/dados/${ufMinuscula}/${arquivo}`;

  const dados = await fetchTse(url);
  if (!dados) return null;

  const cargoDados =
    dados.carg?.find((item) => item.cd === codigo) ?? dados.carg?.[0];
  if (!cargoDados) return null;

  const secoesTotal = numero(dados.s?.ts) ?? 0;
  const secoesApuradas = numero(dados.s?.st) ?? 0;
  const percentualApurado =
    numero(dados.s?.pst) ??
    (secoesTotal > 0 ? (secoesApuradas / secoesTotal) * 100 : 0);
  const dataGeracao = dados.dg?.trim() || dados.dt?.trim();
  const horaGeracao = dados.hg?.trim() || dados.ht?.trim();
  const candidatos = candidatosDoCargo(cargoDados);

  return {
    uf,
    cargo: cargoId,
    cargoNome: cargoDados.nmn?.trim() || cargo.label,
    ano: ANO_ELEICAO,
    turno: TURNO,
    atualizadoEm:
      [dataGeracao, horaGeracao].filter(Boolean).join(" ").trim() || null,
    secoesTotal,
    secoesApuradas,
    percentualApurado: Math.round(percentualApurado * 100) / 100,
    finalizada:
      secoesTotal > 0
        ? secoesApuradas >= secoesTotal
        : percentualApurado >= 99.995,
    comparecimento: numero(dados.e?.c) ?? 0,
    abstencoes: numero(dados.e?.a) ?? 0,
    votosValidos: numero(dados.v?.vv) ?? 0,
    votosTotais: numero(dados.v?.tv) ?? 0,
    totalCandidatos: candidatos.length,
    candidatos,
    fonte: { ...FONTE },
  };
}
