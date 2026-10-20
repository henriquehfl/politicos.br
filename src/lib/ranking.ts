import type { PoliticoSummary } from "./types";

/** Quantidade de parlamentares exibida no ranking. */
export const LIMITE_RANKING = 50;
/** Cada critério vale até 50 pontos; a soma fecha 100. */
export const PONTOS_POR_CRITERIO = 50;
/** Metade do recorte para cada Casa. */
export const POR_CASA = LIMITE_RANKING / 2;

export interface RankingBase {
  id: string;
  nome: string;
  uf: string;
  partido: string;
  cargo: "deputado" | "senador";
  fotoUrl?: string;
  /** Pronunciamentos na legislatura atual (Câmara) / desde 2023 (Senado). */
  discursos: number;
  /** Comissões, CPIs e conselhos ainda ativos. */
  comissoes: number;
}

export interface RankingLinha extends RankingBase {
  pontosDiscursos: number;
  pontosComissoes: number;
  score: number;
}

/**
 * Amostra distribuída ao longo da lista oficial (que vem ordenada por nome),
 * para não concentrar o recorte nos primeiros alfabéticos.
 */
export function amostraEspalhada<T>(itens: T[], tamanho: number): T[] {
  if (tamanho <= 0 || itens.length === 0) return [];
  if (itens.length <= tamanho) return [...itens];
  const passo = itens.length / tamanho;
  return Array.from({ length: tamanho }, (_, i) =>
    itens[Math.floor(i * passo)],
  );
}

/**
 * Recorte do ranking: 25 deputados + 25 senadores em exercício. Se uma Casa
 * tiver menos gente que o previsto, a outra completa as vagas.
 */
export function selecionarRecorte(
  index: PoliticoSummary[],
  limite = LIMITE_RANKING,
): PoliticoSummary[] {
  const ativos = index.filter((p) => p.vigente);
  const metade = Math.ceil(limite / 2);
  const selecionados = [
    ...amostraEspalhada(
      ativos.filter((p) => p.cargo === "deputado"),
      metade,
    ),
    ...amostraEspalhada(
      ativos.filter((p) => p.cargo === "senador"),
      limite - metade,
    ),
  ];

  if (selecionados.length < limite) {
    const usados = new Set(selecionados.map((p) => `${p.cargo}:${p.id}`));
    const restantes = ativos.filter((p) => !usados.has(`${p.cargo}:${p.id}`));
    selecionados.push(
      ...amostraEspalhada(restantes, limite - selecionados.length),
    );
  }

  return selecionados;
}

/** Comissões permanentes, CPIs/CPMIs e conselhos — exclui bancadas e frentes. */
export function ehComissao(nome: string): boolean {
  return /comiss(ã|a)o|comiss(õ|o)es|\bcpis?\b|cpmi|conselho de (é|e)tica/i.test(
    nome,
  );
}

export function contarComissoesAtivas(
  comissoes: Array<{ nome: string }>,
): number {
  const vistas = new Set<string>();
  for (const comissao of comissoes) {
    const nome = comissao.nome.trim();
    if (nome && ehComissao(nome)) vistas.add(nome);
  }
  return vistas.size;
}

/**
 * Referência do critério: percentil 95 do recorte. O máximo absoluto é
 * sensível a um único caso extremo e comprimiria a nota de todo mundo.
 */
function referencia(valores: number[]): number {
  const ordenados = [...valores]
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  if (ordenados.length === 0) return 0;
  const indice = Math.ceil(0.95 * (ordenados.length - 1));
  return ordenados[indice] ?? ordenados[ordenados.length - 1];
}

/**
 * Normaliza cada critério pela referência do recorte (percentil 95) e aplica
 * 50 pontos. Quem supera a referência fica no teto, sem distorcer a escala.
 */
export function pontuarRanking(linhas: RankingBase[]): RankingLinha[] {
  const refDiscursos = referencia(linhas.map((l) => l.discursos));
  const refComissoes = referencia(linhas.map((l) => l.comissoes));

  return linhas
    .map((linha) => {
      const pontosDiscursos =
        refDiscursos > 0
          ? Math.round(
              Math.min(1, linha.discursos / refDiscursos) *
                PONTOS_POR_CRITERIO,
            )
          : 0;
      const pontosComissoes =
        refComissoes > 0
          ? Math.round(
              Math.min(1, linha.comissoes / refComissoes) *
                PONTOS_POR_CRITERIO,
            )
          : 0;
      return {
        ...linha,
        pontosDiscursos,
        pontosComissoes,
        score: pontosDiscursos + pontosComissoes,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.discursos - a.discursos ||
        b.comissoes - a.comissoes ||
        a.nome.localeCompare(b.nome, "pt-BR"),
    );
}
