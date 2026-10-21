import { cacheLife } from "next/cache";
import { CAMARA, fetchJson } from "./http";
import { getEleicaoPolitico } from "./tse";
import { buildCargoEvents, getCargosPublicos } from "@/lib/cargos";
import {
  contarPolemicas,
  getEventosHistoricos,
  mesclarEventos,
  sanearEventos,
} from "@/lib/historico";
import { buildMediaLinks } from "@/lib/media";
import { textoLimpo } from "@/lib/texto";
import type {
  Comissao,
  Politico,
  TimelineEvent,
  VotePosition,
} from "@/lib/types";

/* ------------------------------- DTOs ---------------------------------- */

interface CamaraDetalhe {
  dados: {
    id: number;
    nomeCivil: string;
    ultimoStatus: {
      id: number;
      nome: string;
      siglaPartido: string;
      siglaUf: string;
      idLegislatura: number;
      urlFoto?: string;
      email?: string;
      condicaoEleitoral?: string;
      descricaoStatus?: string;
      gabinete?: {
        nome?: string;
        predio?: string;
        sala?: string;
        andar?: string;
        telefone?: string;
        email?: string;
      };
      situacao?: string;
    };
    cpf?: string;
    sexo?: string;
    urlWebsite?: string | null;
    redeSocial?: string[] | null;
    dataNascimento?: string;
    dataFalecimento?: string | null;
    escolaridade?: string;
    municipioNascimento?: string;
    ufNascimento?: string;
  };
}

interface CamaraProposicao {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
  dataApresentacao?: string;
}

interface CamaraFrente {
  id: number;
  titulo: string;
}

interface CamaraOrgaoMembro {
  siglaOrgao?: string;
  nomeOrgao?: string;
  titulo?: string;
  sigla?: string;
  nome?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
}

interface CamaraOcupacao {
  titulo: string | null;
  entidade: string | null;
  entidadeUF: string | null;
  anoInicio: number | null;
  anoFim: number | null;
}

interface CamaraDespesa {
  ano: number;
  mes: number;
  tipoDespesa: string;
  nomeFornecedor: string;
  valorLiquido: number;
  urlDocumento: string | null;
  dataDocumento?: string;
}

interface CamaraDiscurso {
  dataHoraInicio: string;
  /** A API devolve `null` em muitos discursos antigos (ex.: Constituinte). */
  tipoDiscurso?: string | null;
  keywords?: string | null;
  sumario?: string | null;
  transcricao?: string | null;
  urlTexto?: string | null;
}

interface CamaraVotacao {
  id: string;
  data: string;
  siglaOrgao: string;
  descricao: string;
  aprovacao: number | null;
  proposicaoObjeto?: string | null;
}

interface CamaraVoto {
  tipoVoto: string;
  dataRegistroVoto?: string;
  deputado_?: { id: number; nome: string };
}

/* --------------------- janelas de consulta de votações ------------------ */

/** Limite imposto pela API da Câmara: intervalo máximo de 3 meses. */
const JANELA_VOTACOES_DIAS = 89;
/** Até onde voltar procurando votos do deputado. */
const BUSCA_VOTACOES_MESES = 12;
/** Requisições de votos em paralelo por lote (a API limita a taxa). */
const LOTE_VOTOS = 8;
/** Teto de consultas de votos para manter a página responsiva (~10 req/s). */
const TETO_CONSULTAS_VOTOS = 50;
/**
 * Primeira legislatura com dados abertos de discursos (Constituinte).
 * A busca percorre todas as legislaturas do mandato, não só as três últimas.
 */
const PRIMEIRA_LEGISLATURA_DISCURSOS = 48;
/** Falas por ano: preserva o início da carreira sem inflar o payload. */
const DISCURSOS_POR_ANO = 4;
/** Teto de falas na linha do tempo. */
const TETO_DISCURSOS = 160;
/** Teto de páginas de proposições (100 cada) para não estourar o payload. */
const TETO_PAGINAS_PROPOSICOES = 4;

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Janelas consecutivas de 89 dias, da mais recente para a mais antiga. */
function janelasDeVotacoes(): Array<{ ini: string; fim: string }> {
  const janelas: Array<{ ini: string; fim: string }> = [];
  const dia = 86_400_000;
  const total = Math.ceil((BUSCA_VOTACOES_MESES * 30) / JANELA_VOTACOES_DIAS);

  let fim = Date.now();
  for (let i = 0; i < total; i++) {
    const ini = fim - JANELA_VOTACOES_DIAS * dia;
    janelas.push({
      ini: isoDia(new Date(ini)),
      fim: isoDia(new Date(fim)),
    });
    fim = ini - dia;
  }

  return janelas;
}

/* --------------------------- normalizadores ---------------------------- */

function toVotePosition(tipo: string): VotePosition {
  const t = tipo.toLowerCase();
  if (t.includes("sim")) return "SIM";
  if (t.includes("não") || t.includes("nao")) return "NAO";
  if (t.includes("abst")) return "ABSTENCAO";
  return "OBSTRUCAO";
}

function yearFromDate(d?: string | null): number | null {
  if (!d) return null;
  const y = Number(d.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

/** Idade em anos completos na data de referência (ou hoje). */
function calcularIdade(nascimento?: string, falecimento?: string | null) {
  if (!nascimento) return undefined;
  const nasceu = new Date(nascimento);
  if (Number.isNaN(nasceu.getTime())) return undefined;
  const referencia = falecimento ? new Date(falecimento) : new Date();
  let idade = referencia.getFullYear() - nasceu.getFullYear();
  const mes = referencia.getMonth() - nasceu.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < nasceu.getDate())) {
    idade--;
  }
  return idade >= 0 ? idade : undefined;
}

function isPolemico(texto?: string | null): boolean {
  const t = textoLimpo(texto)?.toLowerCase() ?? "";
  if (!t) return false;
  const termos = [
    "corrup",
    "escândal",
    "escandal",
    "denúncia",
    "denuncia",
    "fraude",
    "cassação",
    "cassacao",
    "imoral",
    "absurdo",
    "mentira",
    "crime",
    "suspeit",
    "caos",
    "irregular",
    "stf",
    "preso",
    "réu",
    "reacao",
  ];
  return termos.some((w) => t.includes(w));
}

/* ------------------------------ fetchers ------------------------------- */

export async function getDeputadoDetalhe(id: string): Promise<CamaraDetalhe | null> {
  return fetchJson<CamaraDetalhe>(`${CAMARA}/deputados/${id}`);
}

/**
 * Identidade mínima do deputado (uma única chamada, rápida) usada em
 * `generateMetadata` — evita bloquear o streaming da página esperando o
 * dossiê completo.
 */
export async function getDeputadoResumo(
  id: string,
): Promise<{ nome: string; partido: string; uf: string; nascimento?: string } | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });

  const detalhe = await getDeputadoDetalhe(id);
  if (!detalhe?.dados) return null;
  const s = detalhe.dados.ultimoStatus;

  return {
    nome: s?.nome ?? detalhe.dados.nomeCivil ?? "Deputado",
    partido: s?.siglaPartido ?? "—",
    uf: s?.siglaUf ?? "—",
    nascimento: detalhe.dados.dataNascimento,
  };
}

export async function getDeputadoDespesas(
  id: string,
  legislatura: number,
): Promise<CamaraDespesa[]> {
  // Quatro páginas de 100, em paralelo — cobre a legislatura inteira sem
  // transformar a renderização em uma fila de requisições.
  const paginas = [1, 2, 3, 4];
  const resultados = await Promise.all(
    paginas.map((pagina) =>
      fetchJson<{ dados: CamaraDespesa[] }>(
        `${CAMARA}/deputados/${id}/despesas?idLegislatura=${legislatura}&itens=100&ordem=DESC&ordenarPor=ano&pagina=${pagina}`,
      ),
    ),
  );
  return resultados.flatMap((r) => r?.dados ?? []);
}

async function getDiscursosDaLegislatura(
  id: string,
  legislatura: number,
): Promise<{ dados?: CamaraDiscurso[] } | null> {
  const url = `${CAMARA}/deputados/${id}/discursos?idLegislatura=${legislatura}&itens=100&ordem=DESC&ordenarPor=dataHoraInicio`;

  const primeira = await fetchJson<{ dados: CamaraDiscurso[] }>(url, {
    timeoutMs: 20000,
  });
  if (primeira) return primeira;

  // Segunda chance antes de devolver vazio: o cache de perfil dura horas e
  // uma falha transitória não pode virar "político sem discursos".
  await new Promise((resolve) => setTimeout(resolve, 500));
  return fetchJson<{ dados: CamaraDiscurso[] }>(url, { timeoutMs: 20000 });
}

export async function getDeputadoDiscursos(
  id: string,
  legislatura: number,
): Promise<CamaraDiscurso[]> {
  // Percorre todas as legislaturas do mandato (48ª em diante), não apenas as
  // três mais recentes. Sem isso, quem teve mandatos antigos perdia as falas
  // da juventude política — exatamente o começo da trajetória.
  const legislaturas = Array.from(
    { length: Math.max(0, legislatura - PRIMEIRA_LEGISLATURA_DISCURSOS + 1) },
    (_, i) => legislatura - i,
  ).filter((leg) => leg >= PRIMEIRA_LEGISLATURA_DISCURSOS);

  // Lotes de cinco para não disparar 10 requisições simultâneas à API.
  const respostas: Array<{ dados?: CamaraDiscurso[] } | null> = [];
  for (let i = 0; i < legislaturas.length; i += 5) {
    const lote = legislaturas.slice(i, i + 5);
    respostas.push(
      ...(await Promise.all(
        lote.map((leg) => getDiscursosDaLegislatura(id, leg)),
      )),
    );
  }

  const vistos = new Set<string>();
  const todos = respostas
    .flatMap((r) => r?.dados ?? [])
    .filter((d) => {
      if (!d?.dataHoraInicio) return false;
      const chave = [
        d.dataHoraInicio,
        textoLimpo(d.tipoDiscurso),
        textoLimpo(d.sumario),
      ].join("|");
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .sort((a, b) =>
      (b.dataHoraInicio ?? "").localeCompare(a.dataHoraInicio ?? ""),
    );

  // Carreiras curtas mantêm todas as falas; só há amostragem quando o volume
  // passa do teto. Assim o Lula deputado (1987–1991) não perde pronunciamentos.
  if (todos.length <= TETO_DISCURSOS) return todos;

  // Amostra por ano: mantém falas de 1987 e de 2026 no mesmo perfil. O corte
  // apenas pelas mais recentes apagava o início da carreira em mandatos longos.
  const porAno = new Map<number, CamaraDiscurso[]>();
  for (const discurso of todos) {
    const ano = yearFromDate(discurso.dataHoraInicio);
    if (!ano) continue;
    const lista = porAno.get(ano) ?? [];
    if (lista.length < DISCURSOS_POR_ANO) {
      lista.push(discurso);
      porAno.set(ano, lista);
    }
  }

  return [...porAno.values()]
    .flat()
    .sort((a, b) =>
      (b.dataHoraInicio ?? "").localeCompare(a.dataHoraInicio ?? ""),
    )
    .slice(0, TETO_DISCURSOS);
}

export async function getDeputadoFrentes(
  id: string,
  legislatura: number,
): Promise<CamaraFrente[]> {
  const data = await fetchJson<{ dados: CamaraFrente[] }>(
    `${CAMARA}/deputados/${id}/frentes?idLegislatura=${legislatura}&itens=100`,
  );
  return (data?.dados ?? []).filter((f) => Boolean(f?.titulo));
}

export async function getDeputadoOcupacoes(
  id: string,
): Promise<CamaraOcupacao[]> {
  const data = await fetchJson<{ dados: CamaraOcupacao[] }>(
    `${CAMARA}/deputados/${id}/ocupacoes`,
  );
  return (data?.dados ?? []).filter((o) => Boolean(o?.titulo));
}

export async function getDeputadoProposicoes(
  id: string,
): Promise<CamaraProposicao[]> {
  const base = `${CAMARA}/proposicoes?idDeputadoAutor=${id}&itens=100&ordem=DESC&ordenarPor=id`;

  const primeira = await fetchJson<{
    dados: CamaraProposicao[];
    links?: Array<{ rel: string; href: string }>;
  }>(`${base}&pagina=1`, { timeoutMs: 15000 });
  if (!primeira?.dados?.length) return [];

  const ultima = Number(
    primeira.links
      ?.find((l) => l.rel === "last")
      ?.href.match(/pagina=(\d+)/)?.[1] ?? 1,
  );
  const totalPaginas = Math.min(ultima, TETO_PAGINAS_PROPOSICOES);
  if (totalPaginas <= 1) return primeira.dados;

  const restantes = await Promise.all(
    Array.from({ length: totalPaginas - 1 }, (_, i) =>
      fetchJson<{ dados: CamaraProposicao[] }>(`${base}&pagina=${i + 2}`, {
        timeoutMs: 15000,
      }),
    ),
  );

  return [
    ...primeira.dados,
    ...restantes.flatMap((r) => r?.dados ?? []),
  ].filter((p) => Boolean(p?.id));
}

export async function getDeputadoOrgaos(
  id: string,
  legislatura: number,
): Promise<Comissao[]> {
  const data = await fetchJson<{ dados: CamaraOrgaoMembro[] }>(
    `${CAMARA}/deputados/${id}/orgaos?idLegislatura=${legislatura}&itens=100`,
  );
  const rows = data?.dados ?? [];
  return rows
    .map((r) => ({
      sigla: (r.siglaOrgao ?? r.sigla ?? "—").toUpperCase(),
      titularidade:
        (r.titulo ?? "").toLowerCase().includes("suplente")
          ? ("Suplente" as const)
          : ("Titular" as const),
      nome: r.nomeOrgao ?? r.nome ?? "",
    }))
    .filter((c) => c.nome);
}

/**
 * Votações nominais do plenário em que o deputado registrou voto.
 *
 * A API da Câmara recusa intervalos maiores que 3 meses em `/votacoes`
 * ("A diferença entre as datas não pode ser maior que 3 meses"), então a
 * varredura é feita em janelas de 89 dias, das mais recentes para as mais
 * antigas, até preencher o limite ou esgotar o orçamento de consultas.
 *
 * Só é possível descobrir o voto de um deputado baixando `/votacoes/{id}/votos`
 * de cada sessão (não há endpoint por deputado), e a API responde ~10 req/s.
 * Por isso `nominais` também é devolvido: permite calcular presença comparando
 * as sessões nominais varridas com as que têm voto do deputado.
 */
export async function getDeputadoVotacoes(
  deputadoId: string,
  limit = 40,
): Promise<{
  votos: Array<{ votacao: CamaraVotacao; voto: VotePosition }>;
  nominais: number;
}> {
  const votos: Array<{ votacao: CamaraVotacao; voto: VotePosition }> = [];
  const alvo = String(deputadoId);
  let consultas = 0;
  let nominais = 0;

  // As listas de cada janela são independentes: buscar todas em paralelo
  // evita ~5 idas sequenciais antes de começar a consultar os votos.
  const janelas = janelasDeVotacoes();
  const listas = await Promise.all(
    janelas.map(({ ini, fim }) =>
      fetchJson<{ dados: CamaraVotacao[] }>(
        `${CAMARA}/votacoes?dataInicio=${ini}&dataFim=${fim}&idOrgao=180&itens=100&ordem=DESC&ordenarPor=id`,
      ),
    ),
  );

  const votacoes = listas
    .flatMap((lista) => lista?.dados ?? [])
    .filter((v) => Boolean(v?.id))
    .sort(
      (a, b) =>
        (b.data ?? "").localeCompare(a.data ?? "") ||
        String(b.id).localeCompare(String(a.id)),
    );

  // Consulta em lotes paralelos moderados (a API limita a taxa).
  for (let i = 0; i < votacoes.length; i += LOTE_VOTOS) {
    if (votos.length >= limit || consultas >= TETO_CONSULTAS_VOTOS) break;
    const lote = votacoes.slice(i, i + LOTE_VOTOS);
    consultas += lote.length;

    const votosPorVotacao = await Promise.all(
      lote.map((v) =>
        fetchJson<{ dados: CamaraVoto[] }>(`${CAMARA}/votacoes/${v.id}/votos`),
      ),
    );

    votosPorVotacao.forEach((res, idx) => {
      const registros = res?.dados ?? [];
      // Votações simbólicas não têm registro nominal.
      if (!registros.length) return;
      nominais++;
      const voto = registros.find((x) => String(x.deputado_?.id) === alvo);
      if (voto?.tipoVoto && votos.length < limit) {
        votos.push({ votacao: lote[idx], voto: toVotePosition(voto.tipoVoto) });
      }
    });
  }

  return {
    votos: votos
      .sort((a, b) => (b.votacao.data ?? "").localeCompare(a.votacao.data ?? ""))
      .slice(0, limit),
    nominais,
  };
}

/* ------------------------------ mappers -------------------------------- */

export function buildDeputadoEvents(input: {
  deputadoId: string;
  despesas: CamaraDespesa[];
  discursos: CamaraDiscurso[];
  votacoes: Array<{ votacao: CamaraVotacao; voto: VotePosition }>;
  proposicoes?: CamaraProposicao[];
  frentes?: CamaraFrente[];
  anoLegislatura?: number;
  bio?: {
    nascimento?: string;
    naturalidade?: string;
    escolaridade?: string;
  };
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Perfil: nascimento, naturalidade e formação (base da ficha).
  if (input.bio?.nascimento) {
    const ano = yearFromDate(input.bio.nascimento);
    if (ano) {
      events.push({
        id: "bio-nascimento",
        year: ano,
        date: input.bio.nascimento,
        title: "Nascimento e formação",
        summary: [input.bio.naturalidade, input.bio.escolaridade]
          .filter(Boolean)
          .join(" · "),
        category: "carreira",
        impact: "positivo",
        detail: `Natural de ${input.bio.naturalidade ?? "—"}. Escolaridade: ${
          input.bio.escolaridade ?? "—"
        }.`,
        sources: [
          {
            label: "Perfil oficial (Câmara)",
            href: `https://www.camara.leg.br/deputados/${input.deputadoId}`,
          },
        ],
      });
    }
  }

  // Frentes parlamentares: quantas e quais (amostra das principais).
  if (input.frentes?.length) {
    const titulos = input.frentes.map((f) => f.titulo);
    events.push({
      id: "frentes-parlamentares",
      year: input.anoLegislatura ?? new Date().getFullYear(),
      title: "Frentes parlamentares",
      summary: `Participa de ${titulos.length} frente(s) parlamentar(es).`,
      category: "carreira",
      detail: titulos.slice(0, 8).join("; ") + (titulos.length > 8 ? "…" : ""),
      sources: [
        {
          label: "Frentes (Câmara)",
          href: `${CAMARA}/deputados/${input.deputadoId}/frentes`,
        },
      ],
    });
  }

  // Proposições de autoria — agrupadas por ano para não inflar a linha.
  const propostasPorAno = new Map<number, CamaraProposicao[]>();
  for (const p of input.proposicoes ?? []) {
    const ano =
      p.ano && p.ano > 1900 ? p.ano : yearFromDate(p.dataApresentacao);
    if (!ano) continue;
    const lista = propostasPorAno.get(ano) ?? [];
    lista.push(p);
    propostasPorAno.set(ano, lista);
  }
  for (const [ano, lista] of propostasPorAno) {
    const exemplos = lista
      .slice(0, 4)
      .map((p) => `${p.siglaTipo} ${p.numero}/${p.ano}`)
      .join(", ");
    events.push({
      id: `prop-${ano}`,
      year: ano,
      title: `Proposições de autoria — ${ano}`,
      summary: `${lista.length} proposição(ões) apresentada(s) em ${ano}.`,
      category: "proposicao",
      detail: `Exemplos: ${exemplos}.${
        lista.length > 4 ? ` Total de ${lista.length} no ano.` : ""
      }`,
      sources: [
        {
          label: "Proposições (Câmara)",
          href: `${CAMARA}/proposicoes?idDeputadoAutor=${input.deputadoId}`,
        },
      ],
    });
  }


  for (const v of input.votacoes) {
    const year = yearFromDate(v.votacao.data);
    if (!year) continue;
    const descricao =
      textoLimpo(v.votacao.descricao) ?? "Votação nominal em plenário.";
    const objeto = textoLimpo(v.votacao.proposicaoObjeto);
    events.push({
      id: `vot-${v.votacao.id}`,
      year,
      date: textoLimpo(v.votacao.data),
      title: objeto ? `Votação — ${objeto}` : "Votação nominal em plenário",
      summary: descricao,
      category: "votacao",
      vote: v.voto,
      voteProposicao: objeto,
      detail:
        `Posicionamento registrado: ${v.voto}. ${descricao}` +
        (v.votacao.aprovacao === 1
          ? " Resultado: aprovado."
          : v.votacao.aprovacao === 0
            ? " Resultado: rejeitado."
            : ""),
      sources: [
        {
          label: "Detalhe da votação (Câmara)",
          href: `${CAMARA}/votacoes/${v.votacao.id}`,
        },
      ],
    });
  }

  for (const d of input.discursos) {
    const year = yearFromDate(d.dataHoraInicio);
    if (!year) continue;

    const tipo =
      textoLimpo(d.tipoDiscurso) ?? "Discurso em plenário";
    const sumario = textoLimpo(d.sumario);
    const transcricao = textoLimpo(d.transcricao);
    const resumo =
      sumario ??
      transcricao?.slice(0, 220) ??
      "Pronunciamento registrado; resumo não disponível na fonte oficial.";
    const textoAnalise = transcricao ?? sumario ?? "";
    const polemico = isPolemico(textoAnalise);
    const urlTexto = textoLimpo(d.urlTexto);
    const tema = textoLimpo(d.keywords)
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");

    events.push({
      id: `dis-${d.dataHoraInicio}-${year}-${events.length}`,
      year,
      date: textoLimpo(d.dataHoraInicio)?.slice(0, 10),
      title: polemico
        ? "Discurso de impacto / fala polêmica"
        : `Pronunciamento — ${tipo}`,
      summary: resumo,
      category: "discurso",
      impact: polemico ? "alerta" : undefined,
      discurso: {
        tipo,
        tema,
        resumo,
        urlTexto,
        polemico,
      },
      detail: transcricao?.slice(0, 600) ?? resumo,
      sources: urlTexto
        ? [{ label: "Íntegra do discurso (Diário)", href: urlTexto }]
        : undefined,
    });
  }

  // Finanças: agrupa despesas por ano e por tipo (top gastos)
  const porAno = new Map<
    number,
    { total: number; porTipo: Map<string, number> }
  >();
  for (const d of input.despesas) {
    const entry = porAno.get(d.ano) ?? {
      total: 0,
      porTipo: new Map(),
    };
    entry.total += d.valorLiquido ?? 0;
    entry.porTipo.set(
      d.tipoDespesa,
      (entry.porTipo.get(d.tipoDespesa) ?? 0) + (d.valorLiquido ?? 0),
    );
    porAno.set(d.ano, entry);
  }

  for (const [ano, info] of porAno) {
    const tipos = [...info.porTipo.entries()].sort((a, b) => b[1] - a[1]);
    const top = tipos
      .slice(0, 3)
      .map(
        ([tipo, val]) =>
          `${tipo.toLowerCase()} (${val.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })})`,
      )
      .join(", ");
    events.push({
      id: `fin-${ano}`,
      year: ano,
      title: `Cota Parlamentar (CEAP) — ${ano}`,
      summary: `${info.total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })} em despesas.`,
      category: "financas",
      detail: `Total gasto no ano: ${info.total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}. Principais rubricas: ${top || "—"}.`,
      sources: [
        {
          label: "Notas fiscais (Câmara)",
          href: `${CAMARA}/deputados`,
        },
      ],
    });
  }

  return events;
}

export function sumExpenses(despesas: CamaraDespesa[]): number {
  return despesas.reduce((acc, d) => acc + (d.valorLiquido ?? 0), 0);
}

/**
 * Ficha enxuta do deputado: apenas o detalhe oficial e dados locais.
 *
 * É o suficiente para pintar cabeçalho, painel e notícias enquanto o dossiê
 * pesado (discursos, votações, despesas, proposições e TSE) ainda carrega em
 * segundo plano. Evita que uma carreira longa bloqueie o primeiro HTML.
 */
function montarDeputadoBase(id: string, detalhe: CamaraDetalhe): Politico {
  const s = detalhe.dados.ultimoStatus;
  const legislatura = s?.idLegislatura ?? 57;
  const nome = s?.nome ?? detalhe.dados.nomeCivil ?? "Deputado";
  const naturalidade =
    [detalhe.dados.municipioNascimento, detalhe.dados.ufNascimento]
      .filter(Boolean)
      .join(" / ") || undefined;
  const cargos = getCargosPublicos(nome, detalhe.dados.dataNascimento);
  const cargoAtual = cargos.find((cargo) => cargo.atual) ?? null;
  const vigente =
    (s?.descricaoStatus ?? "").toLowerCase().includes("exerc") ||
    (s?.situacao ?? "").toLowerCase().includes("exerc");
  const midia = buildMediaLinks({
    nome,
    cargo: "deputado",
    id,
    redes: detalhe.dados.redeSocial ?? [],
    site: detalhe.dados.urlWebsite,
  });

  return {
    id,
    nome,
    nomeBusca: `${s?.nome ?? ""} ${s?.siglaPartido ?? ""} ${s?.siglaUf ?? ""}`.toLowerCase(),
    cargo: "deputado",
    vigente,
    uf: s?.siglaUf ?? "—",
    partido: s?.siglaPartido ?? "—",
    fotoUrl: s?.urlFoto,
    legislatura: String(legislatura),
    sexo: detalhe.dados.sexo ?? "—",
    escolaridade: detalhe.dados.escolaridade ?? "—",
    condicao: s?.condicaoEleitoral ?? "Titular",
    gabinete: {
      predio: s?.gabinete?.predio ?? "—",
      sala: s?.gabinete?.sala ?? "—",
      telefone: s?.gabinete?.telefone ?? "—",
      email: s?.gabinete?.email ?? s?.email ?? "—",
    },
    comissoes: [],
    cargos,
    situacaoAtual: cargoAtual,
    events: [],
    bio: {
      nomeCivil: detalhe.dados.nomeCivil,
      nascimento: detalhe.dados.dataNascimento,
      idade: calcularIdade(
        detalhe.dados.dataNascimento,
        detalhe.dados.dataFalecimento,
      ),
      naturalidade,
      falecimento: detalhe.dados.dataFalecimento ?? undefined,
    },
    profissoes: [],
    frentes: [],
    midia,
    polemicas: 0,
  };
}

/**
 * Dados mínimos do perfil, cacheados separadamente do dossiê completo.
 * A página usa esta função para liberar o HTML inicial rapidamente.
 */
export async function buildDeputadoBase(id: string): Promise<Politico | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });

  const detalhe = await getDeputadoDetalhe(id);
  if (!detalhe?.dados) return null;
  return montarDeputadoBase(id, detalhe);
}

export async function buildDeputado(id: string): Promise<Politico | null> {
  "use cache";
  // O perfil se atualiza no máximo a cada 10 min no servidor; o cliente
  // revalida a rota a cada 15 min. Evita reconstruir dossiês pesados a cada
  // abertura e respeita os limites das APIs da Câmara.
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });

  const detalhe = await getDeputadoDetalhe(id);
  if (!detalhe?.dados) return null;
  const base = montarDeputadoBase(id, detalhe);
  const s = detalhe.dados.ultimoStatus;
  const legislatura = s?.idLegislatura ?? 57;

  const [despesas, discursos, orgaos, votacaoInfo, proposicoes, frentes, ocupacoes] =
    await Promise.all([
      getDeputadoDespesas(id, legislatura),
      getDeputadoDiscursos(id, legislatura),
      getDeputadoOrgaos(id, legislatura),
      getDeputadoVotacoes(id, 24),
      getDeputadoProposicoes(id),
      getDeputadoFrentes(id, legislatura),
      getDeputadoOcupacoes(id),
    ]);

  const votacoes = votacaoInfo.votos;
  const eleicao2026Promise = getEleicaoPolitico({
    nome: base.nome,
    nomeCivil: detalhe.dados.nomeCivil,
    nascimento: detalhe.dados.dataNascimento,
    uf: base.uf,
    cargo: "deputado",
  });
  const anoLegislatura = 2023 - (57 - legislatura) * 4;
  const cargos = base.cargos ?? [];
  const vigente = base.vigente;

  const eventosBase = buildDeputadoEvents({
    deputadoId: id,
    despesas,
    discursos,
    votacoes,
    proposicoes,
    frentes,
    anoLegislatura,
    bio: {
      nascimento: detalhe.dados.dataNascimento,
      naturalidade: base.bio?.naturalidade,
      escolaridade: detalhe.dados.escolaridade,
    },
  });

  // A linha do tempo parlamentar é a base; cargos e fatos históricos entram
  // depois, sem duplicar posse/data e com saneamento final de nulos.
  const events = sanearEventos(
    mesclarEventos(
      eventosBase,
      buildCargoEvents(cargos, id),
      getEventosHistoricos(base.nome, detalhe.dados.dataNascimento, id),
    ),
  );

  const profissoes = ocupacoes.map((o) => {
    const periodo =
      o.anoInicio && o.anoFim
        ? ` (${o.anoInicio}–${o.anoFim})`
        : o.anoInicio
          ? ` (desde ${o.anoInicio})`
          : "";
    const entidade = o.entidade ? ` — ${o.entidade}` : "";
    return `${o.titulo}${entidade}${periodo}`;
  });

  const polemicas = contarPolemicas(events);

  // Presença estimada apenas para quem está em exercício: sessões nominais
  // varridas vs. sessões com voto do deputado. Mandatos encerrados não têm
  // janela recente e ficam sem o indicador (null) em vez de 0%.
  const votacoesComVoto = votacoes.length;
  const presencaMedia =
    vigente && votacaoInfo.nominais
      ? Math.round((votacoesComVoto / votacaoInfo.nominais) * 100)
      : null;

  const ceap = sumExpenses(despesas);
  const eleicao2026 = await eleicao2026Promise;

  return {
    ...base,
    comissoes: orgaos,
    stats: {
      presencaMedia,
      diasTrabalhados: votacoesComVoto,
      ceapTotal: despesas.length ? ceap : null,
    },
    eleicao: eleicao2026,
    events,
    profissoes,
    frentes: frentes.map((f) => f.titulo).slice(0, 24),
    polemicas,
    atividade: {
      votacoes: votacoes.length,
      discursos: discursos.length,
      proposicoes: proposicoes.length,
      despesas: despesas.length,
      frentes: frentes.length,
    },
  };
}
