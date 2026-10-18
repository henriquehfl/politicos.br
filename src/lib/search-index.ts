import type { PoliticoSummary } from "./types";

/**
 * Busca compartilhada entre servidor (API) e cliente (índice local).
 * O mesmo score roda nos dois lados para que o resultado não mude de
 * posição dependendo de onde a consulta foi resolvida.
 */

const PARTICULAS = new Set([
  "da",
  "de",
  "do",
  "das",
  "dos",
  "e",
  "di",
  "du",
  "del",
]);

/**
 * Apelidos públicos que aparecem nas buscas, mas não no nome oficial.
 * Apenas para desempatar: o resultado continua sendo um parlamentar real.
 */
const APELIDOS: Record<string, string[]> = {
  lula: ["luiz inacio lula da silva"],
  bolsonaro: ["jair messias bolsonaro"],
  dilma: ["dilma vanna rousseff"],
  fhc: ["fernando henrique cardoso"],
  temer: ["michel miguel elias temer lulia"],
  collor: ["fernando affonso collor de mello"],
  itamar: ["itamar augusto cautiero franco"],
  "ciro gomes": ["ciro ferreira gomes"],
  haddad: ["fernando haddad"],
  marina: ["marina silva"],
  aecio: ["aecio neves"],
  "rodrigo maia": ["rodrigo felinto ibanez maia"],
  "arthur lira": ["arthur cesar pereira de lira"],
  pacheco: ["rodrigo otavio soares pacheco"],
  renan: ["renan calheiros"],
  serra: ["jose serra"],
  alckmin: ["geraldo alckmin"],
  moro: ["sergio moro"],
  gleisi: ["gleisi hoffmann"],
  tabata: ["tabata amaral"],
  boulos: ["guilherme boulos"],
  "eduardo cunha": ["eduardo cosentino da cunha"],
};

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalize(value);
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length > 0);
}

/** Iniciais do nome, ignorando partículas ("Luiz Inácio Lula da Silva" → "lils"). */
export function initialsOf(nome: string): string {
  return tokenize(nome)
    .filter((t) => !PARTICULAS.has(t))
    .map((t) => t[0])
    .join("");
}

/** Último sobrenome, para desempatar buscas por sobrenome. */
function surnameOf(nome: string): string {
  const tokens = tokenize(nome).filter((t) => !PARTICULAS.has(t));
  return tokens[tokens.length - 1] ?? "";
}

function wordsStartWith(nomeTokens: string[], tokens: string[]): boolean {
  return tokens.every((token) =>
    nomeTokens.some((word) => word.startsWith(token)),
  );
}

function scoreOne(
  politico: PoliticoSummary,
  query: string,
  tokens: string[],
): number {
  const nome = normalize(politico.nome);
  const nomeTokens = nome.split(" ").filter(Boolean);
  const partido = normalize(politico.partido);
  const uf = normalize(politico.uf);

  let score = 0;

  if (nome === query) score = 1000;
  else if (nome.startsWith(query)) score = 860;
  else if (initialsOf(politico.nome) === query) score = 820;
  else if (tokens.length > 1 && wordsStartWith(nomeTokens, tokens)) score = 780;
  else if (nomeTokens.some((word) => word.startsWith(tokens[0]))) score = 660;
  else if (query.length >= 3 && nome.includes(query)) score = 560;
  else if (tokens.every((token) => nomeTokens.some((w) => w.includes(token))))
    score = 480;

  if (!score) {
    if (tokens.length === 2) {
      const [a, b] = tokens;
      const partidoUf =
        (a === partido && b === uf) || (b === partido && a === uf);
      if (partidoUf) score = 700;
    }
    if (!score && partido === query) score = 420;
    if (!score && uf === query) score = 380;
    if (!score && partido.startsWith(query)) score = 320;
    if (!score && uf.startsWith(query)) score = 280;
    if (!score && tokens.length > 1) {
      const todosPartidoOuUf = tokens.every(
        (t) =>
          partido === t ||
          uf === t ||
          partido.startsWith(t) ||
          uf.startsWith(t),
      );
      if (todosPartidoOuUf) score = 260;
    }
  }

  if (!score) return 0;

  // Apelido público conhecido (ex.: "lula" → Luiz Inácio Lula da Silva).
  const apelidos = APELIDOS[query];
  if (apelidos?.some((alvo) => nome === alvo || nome.includes(alvo))) {
    score = Math.max(score, 1500);
  }

  // Cargo em exercício tem prioridade em empates; sobrenome exato ajuda.
  if (politico.vigente) score += 45;
  if (tokens.length > 0 && surnameOf(politico.nome) === tokens[tokens.length - 1])
    score += 25;

  return score;
}

export interface SearchOptions {
  limit?: number;
  cargo?: PoliticoSummary["cargo"];
  somenteVigentes?: boolean;
}

export function searchPoliticos(
  items: PoliticoSummary[],
  rawQuery: string,
  options: SearchOptions = {},
): PoliticoSummary[] {
  const { limit = 12, cargo, somenteVigentes = false } = options;
  const query = normalize(rawQuery);
  if (query.length < 2) return [];
  const tokens = query.split(" ").filter(Boolean);

  const scored: Array<{ item: PoliticoSummary; score: number }> = [];
  for (const item of items) {
    if (cargo && item.cargo !== cargo) continue;
    if (somenteVigentes && !item.vigente) continue;
    const score = scoreOne(item, query, tokens);
    if (score > 0) scored.push({ item, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.item.vigente) - Number(a.item.vigente) ||
      a.item.nome.localeCompare(b.item.nome, "pt-BR"),
  );

  return scored.slice(0, limit).map((entry) => entry.item);
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Divide o nome em trechos destacáveis sem alterar o texto original.
 * Funciona com acentos porque a comparação usa a forma normalizada.
 */
export function highlightName(
  nome: string,
  rawQuery: string,
): HighlightSegment[] {
  const tokens = tokenize(rawQuery);
  if (!tokens.length) return [{ text: nome, match: false }];

  const parts = nome.split(/(\s+)/).filter((part) => part.length > 0);
  return parts.map((part) => {
    if (/^\s+$/.test(part)) return { text: part, match: false };
    const word = normalize(part);
    const match = tokens.some(
      (token) => word.startsWith(token) || (token.length >= 3 && word.includes(token)),
    );
    return { text: part, match };
  });
}
