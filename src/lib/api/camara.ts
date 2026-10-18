import { cacheLife } from "next/cache";
import { CAMARA, fetchJson } from "./http";
import { buildMediaLinks } from "@/lib/media";
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
  tipoDiscurso: string;
  keywords?: string;
  sumario: string;
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
/** Quantas legislaturas de discursos buscar (atual + 2 anteriores). */
const LEGISLATURAS_DISCURSOS = 3;
/** Teto de falas na linha do tempo (as mais recentes). */
const TETO_DISCURSOS = 90;
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

function isPolemico(texto: string): boolean {
  const t = texto.toLowerCase();
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
): Promise<{ nome: string; partido: string; uf: string } | null> {
  "use cache";
  cacheLife("hours");

  const detalhe = await getDeputadoDetalhe(id);
  if (!detalhe?.dados) return null;
  const s = detalhe.dados.ultimoStatus;

  return {
    nome: s?.nome ?? detalhe.dados.nomeCivil ?? "Deputado",
    partido: s?.siglaPartido ?? "—",
    uf: s?.siglaUf ?? "—",
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

export async function getDeputadoDiscursos(
  id: string,
  legislatura: number,
): Promise<CamaraDiscurso[]> {
  // Falas da legislatura atual e das duas anteriores (histórico real).
  const legislaturas = Array.from(
    { length: LEGISLATURAS_DISCURSOS },
    (_, i) => legislatura - i,
  ).filter((l) => l > 0);

  const respostas = await Promise.all(
    legislaturas.map((leg) =>
      fetchJson<{ dados: CamaraDiscurso[] }>(
        `${CAMARA}/deputados/${id}/discursos?idLegislatura=${leg}&itens=100&ordem=DESC&ordenarPor=dataHoraInicio`,
      ),
    ),
  );

  const vistos = new Set<string>();
  return respostas
    .flatMap((r) => r?.dados ?? [])
    .filter((d) => {
      const chave = `${d.dataHoraInicio}-${d.tipoDiscurso}-${d.sumario}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
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
  const data = await fetchJson<{
    dados: { siglaOrgao?: string; nomeOrgao?: string; titulo?: string; sigla?: string; nome?: string }[];
  }>(`${CAMARA}/deputados/${id}/orgaos?idLegislatura=${legislatura}&itens=100`);
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
    events.push({
      id: `vot-${v.votacao.id}`,
      year,
      date: v.votacao.data,
      title: v.votacao.proposicaoObjeto
        ? `Votação — ${v.votacao.proposicaoObjeto}`
        : "Votação nominal em plenário",
      summary: v.votacao.descricao,
      category: "votacao",
      vote: v.voto,
      voteProposicao: v.votacao.proposicaoObjeto ?? undefined,
      detail:
        `Posicionamento registrado: ${v.voto}. ` + v.votacao.descricao +
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
    const texto = d.transcricao ?? d.sumario ?? "";
    const polemico = isPolemico(texto);
    events.push({
      id: `dis-${d.dataHoraInicio}-${year}-${events.length}`,
      year,
      date: d.dataHoraInicio.slice(0, 10),
      title: polemico
        ? "Discurso de impacto / fala polêmica"
        : `Pronunciamento — ${d.tipoDiscurso}`,
      summary: d.sumario?.slice(0, 220) ?? "Pronunciamento em plenário.",
      category: "discurso",
      impact: polemico ? "alerta" : undefined,
      discurso: {
        tipo: d.tipoDiscurso,
        tema: d.keywords?.split(",")?.slice(0, 5).join(", "),
        resumo: d.sumario,
        urlTexto: d.urlTexto ?? undefined,
        polemico,
      },
      detail: d.transcricao ? d.transcricao.slice(0, 600) : d.sumario,
      sources: d.urlTexto
        ? [{ label: "Íntegra do discurso (Diário)", href: d.urlTexto }]
        : undefined,
    });
  }

  // Finanças: agrupa despesas por ano e por tipo (top gastos)
  const porAno = new Map<
    number,
    { total: number; porTipo: Map<string, number>; comNF: number }
  >();
  for (const d of input.despesas) {
    const entry = porAno.get(d.ano) ?? {
      total: 0,
      porTipo: new Map(),
      comNF: 0,
    };
    entry.total += d.valorLiquido ?? 0;
    entry.porTipo.set(
      d.tipoDespesa,
      (entry.porTipo.get(d.tipoDespesa) ?? 0) + (d.valorLiquido ?? 0),
    );
    if (d.urlDocumento) entry.comNF += 1;
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

export async function buildDeputado(id: string): Promise<Politico | null> {
  "use cache";
  cacheLife("hours");

  const detalhe = await getDeputadoDetalhe(id);
  if (!detalhe?.dados) return null;
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
  const nome = s?.nome ?? detalhe.dados.nomeCivil ?? "Deputado";
  const naturalidade =
    [detalhe.dados.municipioNascimento, detalhe.dados.ufNascimento]
      .filter(Boolean)
      .join(" / ") || undefined;
  const anoLegislatura = 2023 - (57 - legislatura) * 4;

  const events = buildDeputadoEvents({
    deputadoId: id,
    despesas,
    discursos,
    votacoes,
    proposicoes,
    frentes,
    anoLegislatura,
    bio: {
      nascimento: detalhe.dados.dataNascimento,
      naturalidade,
      escolaridade: detalhe.dados.escolaridade,
    },
  });

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

  const midia = buildMediaLinks({
    nome,
    cargo: "deputado",
    id,
    redes: detalhe.dados.redeSocial ?? [],
    site: detalhe.dados.urlWebsite,
  });

  const polemicas = events.filter(
    (e) => e.impact === "critico" || e.discurso?.polemico,
  ).length;

  // Presença estimada: sessões nominais varridas vs. sessões com voto do deputado
  const votacoesComVoto = votacoes.length;
  const presencaMedia = votacaoInfo.nominais
    ? Math.round((votacoesComVoto / votacaoInfo.nominais) * 100)
    : 0;

  const ceap = sumExpenses(despesas);
  const comNF = despesas.filter((d) => d.urlDocumento).length;
  const scoreNF = despesas.length ? Math.round((comNF / despesas.length) * 100) : 50;

  return {
    id,
    nome,
    nomeBusca: `${s?.nome ?? ""} ${s?.siglaPartido ?? ""} ${s?.siglaUf ?? ""}`.toLowerCase(),
    cargo: "deputado",
    vigente: (s?.descricaoStatus ?? "").toLowerCase().includes("exerc") ||
      (s?.situacao ?? "").toLowerCase().includes("exerc"),
    uf: s?.siglaUf ?? "—",
    partido: s?.siglaPartido ?? "—",
    fotoUrl: s?.urlFoto,
    legislatura: String(legislatura),
    sexo: detalhe.dados.sexo ?? "—",
    escolaridade: detalhe.dados.escolaridade ?? "—",
    condicao: s?.condicaoEleitoral ?? "Titular",
    transparencia: {
      score: scoreNF,
      label:
        scoreNF >= 80
          ? "Boa transparência"
          : scoreNF >= 50
            ? "Transparência moderada"
            : "Transparência baixa",
    },
    gabinete: {
      predio: s?.gabinete?.predio ?? "—",
      sala: s?.gabinete?.sala ?? "—",
      telefone: s?.gabinete?.telefone ?? "—",
      email: s?.gabinete?.email ?? s?.email ?? "—",
    },
    comissoes: orgaos,
    stats: {
      presencaMedia,
      diasTrabalhados: votacoesComVoto,
      ceapTotal: ceap,
    },
    events,
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
    profissoes,
    frentes: frentes.map((f) => f.titulo).slice(0, 24),
    midia,
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
