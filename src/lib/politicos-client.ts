import {
  decodeIndex,
  INDICE_VERSAO,
  type CompactPolitico,
} from "./politicos-index";
import type { PoliticoSummary } from "./types";

const CHAVE = "politicos.br:indice";
const VALIDADE = 1000 * 60 * 60; // 1 hora

interface CacheSalvo {
  versao: number;
  at: number;
  items: CompactPolitico[];
}

let memoria: PoliticoSummary[] | null = null;
let promessa: Promise<PoliticoSummary[]> | null = null;

function lerCache(): PoliticoSummary[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CHAVE);
    if (!raw) return null;
    const cache = JSON.parse(raw) as CacheSalvo;
    if (cache.versao !== INDICE_VERSAO) return null;
    if (Date.now() - cache.at > VALIDADE) return null;
    return decodeIndex(cache.items);
  } catch {
    return null;
  }
}

function gravarCache(items: CompactPolitico[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CHAVE,
      JSON.stringify({ versao: INDICE_VERSAO, at: Date.now(), items }),
    );
  } catch {
    // sessionStorage cheio/bloqueado: segue apenas com o cache em memória.
  }
}

/**
 * Baixa o índice completo uma única vez por sessão e mantém em memória.
 * Usado pela busca (resultado instantâneo) e pela listagem.
 */
export function loadPoliticosIndex(): Promise<PoliticoSummary[]> {
  if (memoria) return Promise.resolve(memoria);
  if (promessa) return promessa;

  const cache = lerCache();
  if (cache?.length) {
    memoria = cache;
    return Promise.resolve(cache);
  }

  promessa = fetch("/api/politicos")
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        items: CompactPolitico[];
      };
      gravarCache(data.items);
      memoria = decodeIndex(data.items);
      return memoria;
    })
    .catch(() => {
      promessa = null; // permite nova tentativa em uma próxima interação
      return [];
    });

  return promessa;
}

/** Pré-carrega sem bloquear a primeira pintura. */
export function warmPoliticosIndex() {
  if (typeof window === "undefined" || memoria || promessa) return;
  const carregar = () => {
    void loadPoliticosIndex();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(carregar, { timeout: 1500 });
  } else {
    window.setTimeout(carregar, 400);
  }
}
