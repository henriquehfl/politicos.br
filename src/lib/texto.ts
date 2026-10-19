/**
 * Normalização de textos vindos das APIs públicas.
 *
 * As bases da Câmara e do Senado alternam entre `null`, string vazia e
 * campos ausentes para o mesmo conceito. Sem uma camada única, valores como
 * "Pronunciamento — null" chegam à interface. Este módulo concentra a regra:
 * só devolve texto quando há conteúdo real.
 */

const VAZIOS = new Set(["null", "undefined", "nan", "none", "n/a", "—", "-", "--"]);

/** Remove espaços/entidades e devolve `undefined` para valores sem conteúdo. */
export function textoLimpo(valor: unknown, max?: number): string | undefined {
  if (typeof valor !== "string" && typeof valor !== "number") return undefined;

  let texto = String(valor)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    // Placeholders que algumas APIs devolvem dentro de frases.
    .replace(/\b(null|undefined|nan)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/[\s—–-]+$/, "")
    .trim();

  if (!texto || VAZIOS.has(texto.toLowerCase())) return undefined;

  if (max && texto.length > max) {
    texto = `${texto.slice(0, max).trimEnd()}…`;
  }

  return texto;
}

/** Primeiro valor com conteúdo real; útil para campos com vários fallbacks. */
export function primeiroTexto(...valores: unknown[]): string | undefined {
  for (const valor of valores) {
    const texto = textoLimpo(valor);
    if (texto) return texto;
  }
  return undefined;
}

/** Nome comparável: sem acentos, pontuação, espaços duplicados ou caixa. */
export function normalizarNome(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}
