import { fetchJson } from "./http";
import type {
  EleicaoPolitico,
  ElectionInfo,
  ElectionResult,
  FonteDados,
} from "@/lib/types";

/**
 * Resultados oficiais da eleição geral de 2026 no TSE.
 *
 * O portal de resultados publica um JSON por UF e cargo. O arquivo reúne
 * todos os candidatos daquele cargo, com votos, percentual e situação
 * (eleito, suplente, não eleito ou 2º turno). O cache HTTP e o cache em
 * memória de `fetchJson` evitam baixar o mesmo arquivo a cada perfil.
 */
const TSE_BASE = "https://resultados.tse.jus.br/oficial";
const ANO_ELEICAO = 2026;
const ELEICAO_ESTADUAL = 6259;
const DATA_ELEICAO = "2026-10-04";

const CARGO_TSE = {
  deputado: "6",
  senador: "5",
} as const;

const CONSULTA_TSE: FonteDados = {
  label: "TSE — Resultados 2026",
  href: "https://resultados.tse.jus.br/",
  tipo: "oficial",
};

interface TseCandidato {
  n?: string;
  sqcand?: string;
  nm?: string;
  nmu?: string;
  dt?: string;
  e?: string;
  st?: string;
  vap?: string;
  pvap?: string;
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
}

interface TseResultado {
  carg?: TseCargo[];
}

export interface EleicaoAlvo {
  nome: string;
  nomeCivil?: string;
  nascimento?: string;
  uf: string;
  cargo: "deputado" | "senador";
}

/** Remove acentos, pontuação e diferenças de caixa para comparar nomes. */
function normalizarNome(valor?: string): string {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toUpperCase();
}

/** Aceita AAAA-MM-DD ou DD/MM/AAAA e devolve sempre DD/MM/AAAA. */
function normalizarData(valor?: string): string | null {
  if (!valor) return null;
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? br[0] : null;
}

function pontuarCandidato(
  candidato: TseCandidato,
  alvo: EleicaoAlvo,
): number {
  const nome = normalizarNome(alvo.nome);
  const civil = normalizarNome(alvo.nomeCivil);
  const urna = normalizarNome(candidato.nmu);
  const completo = normalizarNome(candidato.nm);

  let pontos = 0;
  if (urna && urna === nome) pontos = 100;
  else if (completo && civil && completo === civil) pontos = 95;
  else if (completo && completo === nome) pontos = 90;
  else if (urna && civil && urna === civil) pontos = 85;
  else return 0;

  const nascimentoCandidato = normalizarData(candidato.dt);
  const nascimentoAlvo = normalizarData(alvo.nascimento);
  if (
    nascimentoCandidato &&
    nascimentoAlvo &&
    nascimentoCandidato !== nascimentoAlvo
  ) {
    return 0;
  }
  if (nascimentoCandidato && nascimentoAlvo) pontos += 50;

  return pontos;
}

interface CandidatoEncontrado {
  candidato: TseCandidato;
  partido: TsePartido;
  agremiacao: TseAgremiacao;
  pontos: number;
}

function escolherCandidato(
  cargo: TseCargo,
  alvo: EleicaoAlvo,
): CandidatoEncontrado | null {
  let melhor: CandidatoEncontrado | null = null;

  for (const agremiacao of cargo.agr ?? []) {
    for (const partido of agremiacao.par ?? []) {
      for (const candidato of partido.cand ?? []) {
        const pontos = pontuarCandidato(candidato, alvo);
        if (pontos === 0) continue;
        if (
          !melhor ||
          pontos > melhor.pontos ||
          (pontos === melhor.pontos &&
            (numero(candidato.vap) ?? 0) >
              (numero(melhor.candidato.vap) ?? 0))
        ) {
          melhor = { candidato, partido, agremiacao, pontos };
        }
      }
    }
  }

  return melhor;
}

function converterEleicao(
  encontrado: CandidatoEncontrado,
  cargo: TseCargo,
  url: string,
): ElectionInfo {
  const { candidato, partido, agremiacao } = encontrado;
  const partidoSigla = partido.sg ?? partido.nm;
  const coligacao =
    agremiacao.sg && agremiacao.sg !== partidoSigla
      ? agremiacao.sg
      : agremiacao.com && agremiacao.com !== partidoSigla
        ? agremiacao.com
        : undefined;

  return {
    cargo: cargo.nmn ?? "Cargo eletivo",
    ano: ANO_ELEICAO,
    turno: 1,
    votos: numero(candidato.vap),
    percentual: numero(candidato.pvap),
    resultado: resultadoDe(candidato.st, candidato.e),
    situacao: candidato.st,
    partido: partidoSigla,
    coligacao,
    fonte: {
      label: `TSE — ${cargo.nmn ?? "resultado"} 2026`,
      href: url,
      tipo: "oficial",
      data: DATA_ELEICAO,
    },
  };
}

/**
 * Busca a candidatura do parlamentar na eleição geral de 2026.
 *
 * - `disponivel: false` = falha de rede/API; a UI não afirma ausência.
 * - `resultado: null` com `disponivel: true` = não há candidatura registrada.
 */
export async function getEleicaoPolitico(
  alvo: EleicaoAlvo,
): Promise<EleicaoPolitico> {
  const uf = alvo.uf.trim().toLowerCase();
  const consulta = { ...CONSULTA_TSE };

  if (!/^[a-z]{2}$/.test(uf)) {
    return {
      ano: ANO_ELEICAO,
      disponivel: false,
      resultado: null,
      consulta,
    };
  }

  const cargoCodigo = CARGO_TSE[alvo.cargo];
  const arquivo = `${uf}-c${cargoCodigo.padStart(4, "0")}-e${String(
    ELEICAO_ESTADUAL,
  ).padStart(6, "0")}-u.json`;
  const url = `${TSE_BASE}/ele2026/${ELEICAO_ESTADUAL}/dados/${uf}/${arquivo}`;

  const dados = await fetchJson<TseResultado>(url, {
    ttl: 1000 * 60 * 30,
    timeoutMs: 12000,
  });

  if (!dados) {
    return {
      ano: ANO_ELEICAO,
      disponivel: false,
      resultado: null,
      consulta,
    };
  }

  const cargo = dados.carg?.find((item) => item.cd === cargoCodigo);
  if (!cargo) {
    return {
      ano: ANO_ELEICAO,
      disponivel: true,
      resultado: null,
      consulta,
    };
  }

  const encontrado = escolherCandidato(cargo, alvo);
  return {
    ano: ANO_ELEICAO,
    disponivel: true,
    resultado: encontrado ? converterEleicao(encontrado, cargo, url) : null,
    consulta,
  };
}

function numero(valor?: string): number | undefined {
  if (!valor) return undefined;
  const parsed = Number(valor.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resultadoDe(situacao?: string, eleito?: string): ElectionResult {
  const texto = normalizarNome(situacao);
  if (texto.includes("NAO ELEITO")) return "nao_eleito";
  if (texto.includes("SUPLENTE")) return "suplente";
  if (eleito === "s" || texto.includes("ELEITO")) return "eleito";
  return "candidato";
}
