import type { PoliticoSummary } from "./types";

/** Versão do formato compacto — mude ao alterar a tupla ou o score. */
export const INDICE_VERSAO = 4;

export const LEGISLATURA_BASE = 48;
export const LEGISLATURA_ATUAL = 57;

/** Ano de início de uma legislatura (57ª = 2023). */
export function anoInicioLegislatura(legislatura: number): number {
  return 2023 - (LEGISLATURA_ATUAL - legislatura) * 4;
}

/**
 * Índice compacto para o navegador: menos bytes, mesma informação.
 * [id, nome, cargo, uf, partido, vigente, máscara de legislaturas]
 * A máscara tem 1 bit por legislatura (48ª = bit 0), o que preserva o
 * histórico de mandatos sem enviar um array por parlamentar.
 */
export type CompactPolitico = [
  string,
  string,
  "d" | "s",
  string,
  string,
  0 | 1,
  number,
];

export function maskDeLegislaturas(legislaturas: number[]): number {
  return legislaturas.reduce(
    (mask, leg) => mask | (1 << (leg - LEGISLATURA_BASE)),
    0,
  );
}

export function legislaturasDeMask(mask: number): number[] {
  const legislaturas: number[] = [];
  for (let leg = LEGISLATURA_BASE; leg <= LEGISLATURA_ATUAL; leg++) {
    if (mask & (1 << (leg - LEGISLATURA_BASE))) legislaturas.push(leg);
  }
  return legislaturas;
}

/** "1987–2002 · 2019–hoje" — intervalos contíguos, sem inventar continuidade. */
export function periodosDeLegislaturas(
  legislaturas: number[],
  vigente: boolean,
): string {
  if (!legislaturas.length) return "—";
  const ordenadas = [...new Set(legislaturas)].sort((a, b) => a - b);

  const faixas: Array<[number, number]> = [];
  for (const leg of ordenadas) {
    const inicio = anoInicioLegislatura(leg);
    const fim = inicio + 3;
    const ultima = faixas[faixas.length - 1];
    if (ultima && inicio <= ultima[1] + 1) {
      ultima[1] = Math.max(ultima[1], fim);
    } else {
      faixas.push([inicio, fim]);
    }
  }

  return faixas
    .map(([inicio, fim], index) => {
      if (vigente && index === faixas.length - 1) return `${inicio}–hoje`;
      return inicio === fim ? `${inicio}` : `${inicio}–${fim}`;
    })
    .join(" · ");
}

function resumoDeLegislaturas(legislaturas: number[]) {
  if (!legislaturas.length) return { desde: undefined, ate: undefined };
  const ordenadas = [...legislaturas].sort((a, b) => a - b);
  return {
    desde: anoInicioLegislatura(ordenadas[0]),
    ate: anoInicioLegislatura(ordenadas[ordenadas.length - 1]) + 3,
  };
}

export function encodeIndex(items: PoliticoSummary[]): CompactPolitico[] {
  return items.map((p) => [
    p.id,
    p.nome,
    p.cargo === "deputado" ? "d" : "s",
    p.uf,
    p.partido,
    p.vigente ? 1 : 0,
    maskDeLegislaturas(p.legislaturas ?? []),
  ]);
}

export function decodeIndex(rows: CompactPolitico[]): PoliticoSummary[] {
  return rows.map(([id, nome, cargo, uf, partido, vigente, mask]) => {
    const legislaturas = legislaturasDeMask(mask);
    const { desde, ate } = resumoDeLegislaturas(legislaturas);
    return {
      id,
      nome,
      cargo: cargo === "d" ? "deputado" : "senador",
      uf,
      partido,
      vigente: vigente === 1,
      legislaturas,
      desde,
      ate,
      periodos: periodosDeLegislaturas(legislaturas, vigente === 1),
    };
  });
}

