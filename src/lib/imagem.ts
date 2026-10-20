/**
 * Normaliza a URL da foto oficial.
 *
 * O Senado ainda devolve `http://` no índice; em produção (HTTPS) o navegador
 * bloquearia a imagem por conteúdo misto. O host responde igual em HTTPS.
 */
export function urlFoto(url?: string | null): string | undefined {
  const limpa = url?.trim();
  if (!limpa) return undefined;
  return limpa.replace(/^http:\/\//i, "https://");
}

/**
 * Foto oficial a partir do ID — o índice compacto não carrega a URL para não
 * inflar o payload de ~4 mil parlamentares.
 */
export function fotoOficial(
  cargo: "deputado" | "senador",
  id: string,
): string {
  const codigo = encodeURIComponent(id);
  return cargo === "deputado"
    ? `https://www.camara.leg.br/internet/deputado/bandep/${codigo}.jpg`
    : `https://www.senado.leg.br/senadores/img/fotos-oficiais/senador${codigo}.jpg`;
}

const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "du"]);

/** Iniciais para o fallback quando a foto não carrega (ex.: "Lula" -> "L"). */
export function iniciaisNome(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte && !PARTICULAS.has(parte.toLowerCase()));

  const escolhidas =
    partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes;

  return (
    escolhidas
      .map((parte) => parte[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}
