import { cacheLife } from "next/cache";
import { CAMARA, SENADO, fetchJson } from "./http";
import { searchPoliticos, type SearchOptions } from "@/lib/search-index";
import {
  anoInicioLegislatura,
  LEGISLATURA_ATUAL,
  LEGISLATURA_BASE,
  periodosDeLegislaturas,
} from "@/lib/politicos-index";
import type { PoliticoSummary } from "@/lib/types";

interface CamaraDeputado {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto?: string;
}

interface SenadorIdentificacao {
  CodigoParlamentar: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar?: string;
  SiglaPartidoParlamentar?: string;
  UfParlamentar?: string;
  UrlFotoParlamentar?: string;
}

interface SenadorMandato {
  UfParlamentar?: string;
  DescricaoParticipacao?: string;
  PrimeiraLegislaturaDoMandato?: { NumeroLegislatura?: string };
}

interface SenadorListaItem {
  IdentificacaoParlamentar?: SenadorIdentificacao;
  Mandatos?: { Mandato?: SenadorMandato[] | SenadorMandato };
}

interface Links {
  links?: Array<{ rel: string; href: string }>;
}

/**
 * Índice histórico: todas as legislaturas desde a Constituinte (48ª,
 * 1987–1991) até a atual (57ª, 2023–2027). Inclui titulares e suplentes que
 * exerceram mandato — ou seja, ativos e históricos.
 */
const PRIMEIRA_LEGISLATURA = LEGISLATURA_BASE;
const LEGISLATURAS = Array.from(
  { length: LEGISLATURA_ATUAL - PRIMEIRA_LEGISLATURA + 1 },
  (_, i) => PRIMEIRA_LEGISLATURA + i,
);

const INDEX_TTL = 1000 * 60 * 60 * 12; // espelho em memória: 12h
const PAGINA = 1000;
const CONCORRENCIA = 6;

const ANO_INICIO_LEGISLATURA = (leg: number) => anoInicioLegislatura(leg);

interface Entrada {
  id: string;
  nome: string;
  cargo: "deputado" | "senador";
  uf: string;
  partido: string;
  fotoUrl?: string;
  legislaturas: Set<number>;
}

async function emLotes<T, R>(
  itens: T[],
  tamanho: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const saida: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    const lote = itens.slice(i, i + tamanho);
    saida.push(...(await Promise.all(lote.map(fn))));
  }
  return saida;
}

function ultimaPagina(links: Links["links"]): number {
  const last = links?.find((l) => l.rel === "last")?.href;
  const match = last?.match(/pagina=(\d+)/);
  return match ? Number(match[1]) : 1;
}

async function getDeputadosPorLegislatura(
  legislatura: number,
): Promise<CamaraDeputado[]> {
  const primeiro = await fetchJson<{ dados: CamaraDeputado[] } & Links>(
    `${CAMARA}/deputados?idLegislatura=${legislatura}&itens=${PAGINA}&ordem=ASC&ordenarPor=nome&pagina=1`,
    { ttl: INDEX_TTL, timeoutMs: 20000 },
  );
  if (!primeiro?.dados?.length) return [];

  const total = ultimaPagina(primeiro.links);
  const restantes =
    total > 1
      ? await Promise.all(
          Array.from({ length: total - 1 }, (_, i) =>
            fetchJson<{ dados: CamaraDeputado[] }>(
              `${CAMARA}/deputados?idLegislatura=${legislatura}&itens=${PAGINA}&ordem=ASC&ordenarPor=nome&pagina=${i + 2}`,
              { ttl: INDEX_TTL, timeoutMs: 20000 },
            ),
          ),
        )
      : [];

  return [...primeiro.dados, ...restantes.flatMap((r) => r?.dados ?? [])];
}

async function getSenadoresPorLegislatura(
  legislatura: number,
): Promise<
  Array<{ identificacao: SenadorIdentificacao; uf: string; partido: string }>
> {
  const data = await fetchJson<{
    ListaParlamentarLegislatura?: {
      Parlamentares?: { Parlamentar?: SenadorListaItem[] | SenadorListaItem };
    };
  }>(`${SENADO}/senador/lista/legislatura/${legislatura}.json`, {
    ttl: INDEX_TTL,
    timeoutMs: 20000,
  });

  const raw =
    data?.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar ?? [];
  const itens = Array.isArray(raw) ? raw : [raw];

  return itens.flatMap((item) => {
    const identificacao = item?.IdentificacaoParlamentar;
    if (!identificacao?.CodigoParlamentar) return [];

    const mandatosRaw = item?.Mandatos?.Mandato;
    const mandatos = Array.isArray(mandatosRaw)
      ? mandatosRaw
      : mandatosRaw
        ? [mandatosRaw]
        : [];
    const mandato =
      mandatos.find(
        (m) =>
          Number(m?.PrimeiraLegislaturaDoMandato?.NumeroLegislatura) ===
          legislatura,
      ) ?? mandatos[0];

    return [
      {
        identificacao,
        uf: mandato?.UfParlamentar ?? identificacao.UfParlamentar ?? "—",
        partido: identificacao.SiglaPartidoParlamentar ?? "—",
      },
    ];
  });
}

async function getDeputadosAtuais(): Promise<Set<string>> {
  const primeiro = await fetchJson<{ dados: CamaraDeputado[] } & Links>(
    `${CAMARA}/deputados?itens=${PAGINA}&ordem=ASC&ordenarPor=nome&pagina=1`,
    { ttl: INDEX_TTL, timeoutMs: 20000 },
  );
  if (!primeiro?.dados?.length) return new Set();

  const total = ultimaPagina(primeiro.links);
  const restantes =
    total > 1
      ? await Promise.all(
          Array.from({ length: total - 1 }, (_, i) =>
            fetchJson<{ dados: CamaraDeputado[] }>(
              `${CAMARA}/deputados?itens=${PAGINA}&ordem=ASC&ordenarPor=nome&pagina=${i + 2}`,
              { ttl: INDEX_TTL, timeoutMs: 20000 },
            ),
          ),
        )
      : [];

  return new Set(
    [...primeiro.dados, ...restantes.flatMap((r) => r?.dados ?? [])].map((d) =>
      String(d.id),
    ),
  );
}

async function getSenadoresAtuais(): Promise<Set<string>> {
  const data = await fetchJson<{
    ListaParlamentarEmExercicio?: {
      Parlamentares?: { Parlamentar?: SenadorListaItem[] | SenadorListaItem };
    };
  }>(`${SENADO}/senador/lista/atual.json`, {
    ttl: INDEX_TTL,
    timeoutMs: 20000,
  });
  const raw =
    data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar ?? [];
  const itens = Array.isArray(raw) ? raw : [raw];
  return new Set(
    itens
      .map((i) => i?.IdentificacaoParlamentar?.CodigoParlamentar)
      .filter((id): id is string => Boolean(id)),
  );
}

function finalizar(entradas: Map<string, Entrada>, vigentes: Set<string>) {
  return [...entradas.values()].map((entrada): PoliticoSummary => {
    const legislaturas = [...entrada.legislaturas].sort((a, b) => a - b);
    const vigente = vigentes.has(entrada.id);
    return {
      id: entrada.id,
      nome: entrada.nome,
      cargo: entrada.cargo,
      vigente,
      uf: entrada.uf,
      partido: entrada.partido,
      fotoUrl: entrada.fotoUrl,
      legislaturas,
      desde: ANO_INICIO_LEGISLATURA(legislaturas[0]),
      ate: ANO_INICIO_LEGISLATURA(legislaturas[legislaturas.length - 1]) + 3,
      periodos: periodosDeLegislaturas(legislaturas, vigente),
    };
  });
}

/** Índice completo (ativos + históricos) montado a partir das duas Casas. */
export async function getPoliticosIndex(): Promise<PoliticoSummary[]> {
  "use cache";
  cacheLife("days");

  const [porLegislatura, deputadosAtuais, senadoresAtuais] = await Promise.all([
    emLotes(LEGISLATURAS, CONCORRENCIA, async (legislatura) => {
      const [deputados, senadores] = await Promise.all([
        getDeputadosPorLegislatura(legislatura),
        getSenadoresPorLegislatura(legislatura),
      ]);
      return { legislatura, deputados, senadores };
    }),
    getDeputadosAtuais(),
    getSenadoresAtuais(),
  ]);

  const deputados = new Map<string, Entrada>();
  const senadores = new Map<string, Entrada>();

  // Ordem crescente: cada legislatura mais recente atualiza partido/UF/foto.
  for (const {
    legislatura,
    deputados: listaDep,
    senadores: listaSen,
  } of porLegislatura) {
    for (const d of listaDep) {
      const id = String(d.id);
      const atual = deputados.get(id);
      const uf = d.siglaUf || atual?.uf || "—";
      const partido = d.siglaPartido || atual?.partido || "—";
      if (atual) {
        atual.nome = d.nome || atual.nome;
        atual.uf = uf;
        atual.partido = partido;
        atual.fotoUrl = d.urlFoto ?? atual.fotoUrl;
        atual.legislaturas.add(legislatura);
      } else {
        deputados.set(id, {
          id,
          nome: d.nome,
          cargo: "deputado",
          uf,
          partido,
          fotoUrl: d.urlFoto,
          legislaturas: new Set([legislatura]),
        });
      }
    }

    for (const s of listaSen) {
      const id = s.identificacao.CodigoParlamentar;
      const atual = senadores.get(id);
      const uf = s.uf !== "—" ? s.uf : (atual?.uf ?? "—");
      const partido = s.partido !== "—" ? s.partido : (atual?.partido ?? "—");
      if (atual) {
        atual.nome = s.identificacao.NomeParlamentar || atual.nome;
        atual.uf = uf;
        atual.partido = partido;
        atual.fotoUrl = s.identificacao.UrlFotoParlamentar ?? atual.fotoUrl;
        atual.legislaturas.add(legislatura);
      } else {
        senadores.set(id, {
          id,
          nome: s.identificacao.NomeParlamentar,
          cargo: "senador",
          uf,
          partido,
          fotoUrl: s.identificacao.UrlFotoParlamentar,
          legislaturas: new Set([legislatura]),
        });
      }
    }
  }

  return [
    ...finalizar(deputados, deputadosAtuais),
    ...finalizar(senadores, senadoresAtuais),
  ].sort(
    (a, b) =>
      Number(b.vigente) - Number(a.vigente) ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** Busca usando o mesmo score do cliente (sem round-trip desnecessário). */
export async function searchPoliticosApi(
  query: string,
  options: number | SearchOptions = 12,
): Promise<PoliticoSummary[]> {
  const opts: SearchOptions =
    typeof options === "number" ? { limit: options } : options;
  const index = await getPoliticosIndex();
  return searchPoliticos(index, query, { limit: 12, ...opts });
}

