/**
 * Notícias por parlamentar via RSS público de busca do Google Notícias.
 * O feed entrega manchete, veículo, data e link; o card sempre leva ao
 * veículo original. Não copiamos o texto das matérias.
 */

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";
const CACHE_TTL = 5 * 60_000;
const LIMITE_NOTICIAS = 8;
const JANELA_DIAS = 90;

export type NoticiaCargo = "deputado" | "senador";

export interface Noticia {
  id: string;
  titulo: string;
  url: string;
  veiculo?: string;
  /** Data de publicação em ISO 8601, quando o feed informa. */
  publicadoEm?: string;
}

export interface ResultadoNoticias {
  itens: Noticia[];
  fonte: "Google Notícias";
  atualizadoEm: string;
  erro?: string;
}

interface EntradaCache {
  at: number;
  data: ResultadoNoticias;
}

const cache = new Map<string, EntradaCache>();
const emVoo = new Map<string, Promise<ResultadoNoticias>>();
const LIMITE_CACHE = 500;

function guardarCache(chave: string, data: ResultadoNoticias) {
  if (cache.size >= LIMITE_CACHE && !cache.has(chave)) {
    const maisAntigo = cache.keys().next().value;
    if (maisAntigo) cache.delete(maisAntigo);
  }
  cache.set(chave, { at: Date.now(), data });
}

const ENTIDADES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function normalizarNome(nome: string): string {
  return nome.replace(/\s+/g, " ").trim();
}

function limparCdata(valor: string): string {
  return valor.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "");
}

function decodificarXml(valor: string): string {
  return valor.replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (original, codigo: string) => {
      if (codigo.startsWith("#")) {
        const hexadecimal = codigo[1]?.toLowerCase() === "x";
        const numero = Number.parseInt(
          codigo.slice(hexadecimal ? 2 : 1),
          hexadecimal ? 16 : 10,
        );
        if (!Number.isFinite(numero)) return original;
        try {
          return String.fromCodePoint(numero);
        } catch {
          return original;
        }
      }
      return ENTIDADES[codigo.toLowerCase()] ?? original;
    },
  );
}

function textoTag(xml: string, tag: string): string {
  const regex = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const encontrado = xml.match(regex);
  return encontrado
    ? decodificarXml(limparCdata(encontrado[1])).trim()
    : "";
}

function limparHtml(valor: string): string {
  return valor.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function urlSegura(valor: string): string | null {
  try {
    const url = new URL(valor);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function dataIso(valor: string): string | undefined {
  if (!valor) return undefined;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return undefined;
  return data.toISOString();
}

function chaveTitulo(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PALAVRAS_IGNORADAS = new Set([
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
]);

/** O feed pode trazer homônimos; exigimos parte relevante do nome no texto. */
function mencionaNome(texto: string, nome: string): boolean {
  const partes = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter((parte) => parte.length >= 4 && !PALAVRAS_IGNORADAS.has(parte));

  if (!partes.length) {
    return texto.toLowerCase().includes(nome.toLowerCase().trim());
  }

  const alvo = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return partes.some((parte) => alvo.includes(parte));
}

function extrairNoticias(xml: string, nome: string): Noticia[] {
  const itens = Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi));
  const vistos = new Set<string>();
  const noticias: Noticia[] = [];

  for (const item of itens) {
    const bloco = item[1];
    const veiculo = textoTag(bloco, "source") || undefined;
    let titulo = textoTag(bloco, "title");

    if (veiculo && titulo.endsWith(` - ${veiculo}`)) {
      titulo = titulo.slice(0, -(veiculo.length + 3)).trim();
    }

    const url = urlSegura(textoTag(bloco, "link"));
    if (!titulo || !url) continue;

    const descricao = limparHtml(textoTag(bloco, "description"));
    if (!mencionaNome(`${titulo} ${descricao}`, nome)) continue;

    const chave = chaveTitulo(titulo);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);

    noticias.push({
      id: textoTag(bloco, "guid") || url,
      titulo,
      url,
      veiculo,
      publicadoEm: dataIso(textoTag(bloco, "pubDate")),
    });
  }

  noticias.sort((a, b) =>
    (b.publicadoEm ?? "").localeCompare(a.publicadoEm ?? ""),
  );
  return noticias.slice(0, LIMITE_NOTICIAS);
}

function urlConsulta(nome: string, cargo: NoticiaCargo): string {
  const termo = cargo === "senador" ? "senador" : "deputado";
  const consulta = `"${nome.replace(/"/g, "")}" ${termo} when:${JANELA_DIAS}d`;
  return `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(
    consulta,
  )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

async function baixarRss(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        "User-Agent": "POLITICOS.BR/1.0 (+noticias)",
      },
      next: { revalidate: 300 },
    });

    if (!resposta.ok) {
      throw new Error(`Falha ao consultar notícias: HTTP ${resposta.status}`);
    }

    return resposta.text();
  } finally {
    clearTimeout(timer);
  }
}

async function consultar(
  nome: string,
  cargo: NoticiaCargo,
): Promise<ResultadoNoticias> {
  const xml = await baixarRss(urlConsulta(nome, cargo));

  return {
    itens: extrairNoticias(xml, nome),
    fonte: "Google Notícias",
    atualizadoEm: new Date().toISOString(),
  };
}

function resultadoComErro(
  mensagem: string,
  anterior?: EntradaCache,
): ResultadoNoticias {
  return {
    itens: anterior?.data.itens ?? [],
    fonte: "Google Notícias",
    atualizadoEm: anterior?.data.atualizadoEm ?? new Date().toISOString(),
    erro: mensagem,
  };
}

/**
 * Busca notícias recentes de um parlamentar. Em caso de falha, reaproveita a
 * última resposta em cache (mesmo vencida) para não esvaziar o painel.
 */
export async function buscarNoticias({
  nome,
  cargo,
}: {
  nome: string;
  cargo: NoticiaCargo;
}): Promise<ResultadoNoticias> {
  const nomeNormalizado = normalizarNome(nome);
  const chave = `${cargo}:${nomeNormalizado.toLowerCase()}`;
  const anterior = cache.get(chave);

  if (anterior && Date.now() - anterior.at < CACHE_TTL) {
    return anterior.data;
  }

  const pendente = emVoo.get(chave);
  if (pendente) return pendente;

  const promessa = consultar(nomeNormalizado, cargo)
    .then((data) => {
      guardarCache(chave, data);
      return data;
    })
    .catch(() =>
      resultadoComErro(
        "Não foi possível consultar as notícias agora.",
        anterior,
      ),
    )
    .finally(() => {
      emVoo.delete(chave);
    });

  emVoo.set(chave, promessa);
  return promessa;
}
