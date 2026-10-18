import type { MediaKind, MediaLink } from "./types";

interface MediaSource {
  nome: string;
  cargo: "deputado" | "senador";
  id: string;
  redes?: string[];
  site?: string | null;
}

function safeUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function classifySocial(url: string): MediaKind {
  const parsed = safeUrl(url);
  if (!parsed) return "outro";
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com"))
    return "youtube";
  if (host === "instagram.com" || host.endsWith(".instagram.com"))
    return "instagram";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "twitter.com" || host === "x.com" || host.endsWith(".twitter.com"))
    return "x";
  if (host === "facebook.com" || host.endsWith(".facebook.com")) return "facebook";
  return "site";
}

const PLATFORM_LABEL: Record<MediaKind, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X / Twitter",
  facebook: "Facebook",
  site: "Site oficial",
  noticias: "Notícias",
  outro: "Perfil",
};

const PLATFORM_ICON: Record<MediaKind, string> = {
  youtube: "▶",
  instagram: "◎",
  tiktok: "♪",
  x: "𝕏",
  facebook: "f",
  site: "↗",
  noticias: "◈",
  outro: "↗",
};

export function mediaIcon(tipo: MediaKind): string {
  return PLATFORM_ICON[tipo];
}

function searchUrl(kind: Exclude<MediaKind, "site" | "outro">, termo: string) {
  const q = encodeURIComponent(termo);
  switch (kind) {
    case "youtube":
      return `https://www.youtube.com/results?search_query=${q}`;
    case "instagram":
      return `https://www.instagram.com/explore/search/keyword/?q=${q}`;
    case "tiktok":
      return `https://www.tiktok.com/search?q=${q}`;
    case "x":
      return `https://x.com/search?q=${q}&f=live`;
    case "facebook":
      return `https://www.facebook.com/search/top?q=${q}`;
    case "noticias":
      return `https://news.google.com/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  }
}

/**
 * Redes oficiais informadas pelas casas legislativas + buscas nas principais
 * plataformas. Não raspamos redes sociais (termos de uso): entregamos o atalho
 * de busca para o material público de cada parlamentar.
 */
export function buildMediaLinks(source: MediaSource): MediaLink[] {
  const links: MediaLink[] = [];
  const seen = new Set<string>();

  for (const raw of source.redes ?? []) {
    const parsed = safeUrl(raw);
    if (!parsed) continue;
    const tipo = classifySocial(raw);
    const url = parsed.toString();
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({
      tipo,
      label: `${PLATFORM_LABEL[tipo]} oficial`,
      url,
      oficial: true,
    });
  }

  if (source.site) {
    const parsed = safeUrl(source.site);
    if (parsed && !seen.has(parsed.toString())) {
      seen.add(parsed.toString());
      links.push({
        tipo: "site",
        label: "Site oficial",
        url: parsed.toString(),
        oficial: true,
      });
    }
  }

  const termo = `${source.nome} ${
    source.cargo === "deputado" ? "deputado federal" : "senador"
  }`;
  for (const tipo of ["noticias", "youtube", "tiktok", "instagram", "x"] as const) {
    links.push({
      tipo,
      label:
        tipo === "noticias"
          ? "Notícias (Google)"
          : `${PLATFORM_LABEL[tipo]} — busca`,
      url: searchUrl(tipo, termo),
    });
  }

  return links;
}

/** Busca notícias recentes sobre o parlamentar (usada no painel de polêmicas). */
export function newsSearchUrl(nome: string, termo = "polêmica"): string {
  return `https://news.google.com/search?q=${encodeURIComponent(
    `${nome} ${termo}`,
  )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}
