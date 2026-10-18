import { cacheLife } from "next/cache";
import { SENADO, fetchJson } from "./http";
import { buildMediaLinks } from "@/lib/media";
import type { Comissao, Politico, TimelineEvent, VotePosition } from "@/lib/types";

/* ------------------------------- DTOs ---------------------------------- */

interface SenadorBasico {
  CodigoParlamentar: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar?: string;
  SexoParlamentar?: string;
  UrlFotoParlamentar?: string;
  UrlPaginaParlamentar?: string;
  EmailParlamentar?: string;
  SiglaPartidoParlamentar?: string;
  UfParlamentar?: string;
  Telefones?: {
    Telefone?: { NumeroTelefone?: string }[] | { NumeroTelefone?: string };
  };
  DadosBasicosParlamentar?: {
    DataNascimento?: string;
    Naturalidade?: string;
    UfNaturalidade?: string;
    EnderecoParlamentar?: string;
  };
}

interface SenadorDetalhe {
  DetalheParlamentar?: {
    Parlamentar?: {
      IdentificacaoParlamentar?: SenadorBasico;
      DadosBasicosParlamentar?: SenadorBasico["DadosBasicosParlamentar"];
      Telefones?: SenadorBasico["Telefones"];
    };
  };
}

/** Filição crua: a API aninha o partido em `Partido`. */
interface FiliacaoRaw {
  Partido?: { SiglaPartido?: string; NomePartido?: string };
  SiglaPartido?: string;
  NomePartido?: string;
  DataFiliacao?: string;
  DataDesfiliacao?: string;
}

export interface Filiacao {
  SiglaPartido?: string;
  NomePartido?: string;
  DataFiliacao?: string;
  DataDesfiliacao?: string;
}

interface Pronunciamento {
  DataPronunciamento?: string;
  TipoUsoPalavra?: { Descricao?: string };
  TextoResumo?: string;
  Indexacao?: string;
  UrlTexto?: string;
  SiglaPartidoParlamentarNaData?: string;
}

export interface MateriaSenado {
  Codigo?: string;
  IdentificacaoProcesso?: string;
  DescricaoIdentificacao?: string;
  Sigla?: string;
  Numero?: string;
  Ano?: string;
  Ementa?: string;
  Data?: string;
  Autor?: string;
}

export interface AutoriaSenado {
  Materia?: MateriaSenado;
  IndicadorAutorPrincipal?: string;
}

export interface RelatoriaSenado {
  DescricaoTipoRelator?: string;
  DataDesignacao?: string;
  DataDestituicao?: string;
  Materia?: MateriaSenado;
  Comissao?: { Sigla?: string; Nome?: string; SiglaCasa?: string };
}

export interface CargoSenado {
  IdentificacaoComissao?: {
    CodigoComissao?: string;
    SiglaComissao?: string;
    NomeComissao?: string;
    SiglaCasaComissao?: string;
  };
  CodigoCargo?: string;
  DescricaoCargo?: string;
  DataInicio?: string;
  DataFim?: string;
}

export interface LiderancaSenado {
  UnidadeLideranca?: string;
  Partido?: { CodigoPartido?: string; SiglaPartido?: string; NomePartido?: string };
  SiglaCasaLideranca?: string;
  NomeCasaLideranca?: string;
  DescricaoTipoLideranca?: string;
  DataDesignacao?: string;
  DataFim?: string;
}

/** Votação crua: data em `SessaoPlenaria` e voto em `SiglaDescricaoVoto`. */
interface VotacaoSenadoRaw {
  SessaoPlenaria?: { DataSessao?: string; SiglaTipoSessao?: string };
  DataSessao?: string;
  Materia?: {
    Codigo?: string;
    DescricaoIdentificacao?: string;
    Ementa?: string;
    Sigla?: string;
    Numero?: string;
    Ano?: string;
  };
  Tramitacao?: { IdentificacaoTramitacao?: { TextoTramitacao?: string } };
  DescricaoVotacao?: string;
  DescricaoResultado?: string;
  SiglaDescricaoVoto?: string;
  DescricaoVoto?: string;
  VotoParlamentar?: string;
}

export interface VotacaoSenado {
  DataSessao?: string;
  DescricaoVotacao?: string;
  DescricaoResultado?: string;
  VotoParlamentar?: string;
  DescricaoVoto?: string;
  Materia?: VotacaoSenadoRaw["Materia"];
  DescricaoIdentificacaoMateria?: string;
  TextoTramitacao?: string;
}

/* --------------------------- normalizadores ---------------------------- */

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Traduz a sigla/descrição do voto do Senado para o enum da UI.
 * Retorna null quando não houve voto registrado (presença, missão etc.).
 */
function toVotePosition(voto: string): VotePosition | null {
  const t = (voto ?? "").toLowerCase().trim();
  if (t.startsWith("sim")) return "SIM";
  if (t.startsWith("não") || t.startsWith("nao")) return "NAO";
  if (t.includes("abst")) return "ABSTENCAO";
  if (t.startsWith("obs")) return "OBSTRUCAO";
  return null;
}

function yearFromDate(d?: string): number | null {
  if (!d) return null;
  const y = Number(d.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

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
  return [
    "corrup",
    "escândal",
    "escandal",
    "denúncia",
    "denuncia",
    "fraude",
    "cassação",
    "crime",
    "suspeit",
    "stf",
    "preso",
    "réu",
    "absurdo",
    "mentira",
    "processo",
  ].some((w) => t.includes(w));
}

/* ------------------------------ fetchers ------------------------------- */

export async function getSenadorDetalhe(id: string): Promise<SenadorBasico | null> {
  const data = await fetchJson<SenadorDetalhe>(`${SENADO}/senador/${id}.json`, {
    timeoutMs: 15000,
  });
  const parlamentar = data?.DetalheParlamentar?.Parlamentar;
  const identificacao = parlamentar?.IdentificacaoParlamentar;
  if (!identificacao) return null;
  return {
    ...identificacao,
    Telefones: parlamentar?.Telefones ?? identificacao.Telefones,
    DadosBasicosParlamentar:
      parlamentar?.DadosBasicosParlamentar ??
      identificacao.DadosBasicosParlamentar,
  };
}

/**
 * Identidade mínima do senador (uma única chamada, rápida) usada em
 * `generateMetadata` — evita bloquear o streaming da página esperando o
 * dossiê completo.
 */
export async function getSenadorResumo(
  id: string,
): Promise<{ nome: string; partido: string; uf: string } | null> {
  "use cache";
  cacheLife("hours");

  const basico = await getSenadorDetalhe(id);
  if (!basico) return null;

  return {
    nome: basico.NomeParlamentar ?? "Senador",
    partido: basico.SiglaPartidoParlamentar ?? "—",
    uf: basico.UfParlamentar ?? "—",
  };
}

export async function getSenadorFiliacoes(id: string): Promise<Filiacao[]> {
  const data = await fetchJson<{
    FiliacaoParlamentar?: {
      Parlamentar?: {
        Filiacoes?: { Filiacao?: FiliacaoRaw[] | FiliacaoRaw };
      };
    };
  }>(`${SENADO}/senador/${id}/filiacoes.json?v=5`);
  const raw = data?.FiliacaoParlamentar?.Parlamentar?.Filiacoes?.Filiacao ?? [];
  return asArray(raw)
    .map((f) => ({
      SiglaPartido: f.Partido?.SiglaPartido ?? f.SiglaPartido,
      NomePartido: f.Partido?.NomePartido ?? f.NomePartido,
      DataFiliacao: f.DataFiliacao,
      DataDesfiliacao: f.DataDesfiliacao,
    }))
    .filter((f) => Boolean(f.DataFiliacao));
}

export async function getSenadorDiscursos(id: string, anoInicio = 2019) {
  const ini = `${anoInicio}0101`;
  const fim = `${new Date().getFullYear()}1231`;
  const data = await fetchJson<{
    DiscursosParlamentar?: {
      Parlamentar?: {
        Pronunciamentos?: {
          Pronunciamento?: Pronunciamento[] | Pronunciamento;
        };
      };
    };
  }>(
    `${SENADO}/senador/${id}/discursos.json?dataInicio=${ini}&dataFim=${fim}`,
    { timeoutMs: 20000 },
  );
  return asArray(
    data?.DiscursosParlamentar?.Parlamentar?.Pronunciamentos?.Pronunciamento,
  );
}

export async function getSenadorVotacoes(id: string): Promise<VotacaoSenado[]> {
  const data = await fetchJson<{
    VotacaoParlamentar?: {
      Parlamentar?: {
        Votacoes?: { Votacao?: VotacaoSenadoRaw[] | VotacaoSenadoRaw };
      };
      Votacoes?: { Votacao?: VotacaoSenadoRaw[] | VotacaoSenadoRaw };
    };
  }>(`${SENADO}/senador/${id}/votacoes.json?v=7`, { timeoutMs: 30000 });
  const raw =
    data?.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao ??
    data?.VotacaoParlamentar?.Votacoes?.Votacao ??
    [];

  const vistos = new Set<string>();
  return asArray(raw)
    .map((v) => ({
      DataSessao:
        v.SessaoPlenaria?.DataSessao ??
        v.DataSessao,
      DescricaoVotacao: v.DescricaoVotacao,
      DescricaoResultado: v.DescricaoResultado,
      VotoParlamentar: v.SiglaDescricaoVoto ?? v.VotoParlamentar,
      DescricaoVoto: v.DescricaoVoto,
      Materia: v.Materia,
      DescricaoIdentificacaoMateria: v.Materia?.DescricaoIdentificacao,
      TextoTramitacao: v.Tramitacao?.IdentificacaoTramitacao?.TextoTramitacao,
    }))
    .filter((v) => {
      if (!v.DataSessao) return false;
      // A API do Senado repete a mesma sessão/voto em alguns registros.
      const chave = `${v.DataSessao}|${v.DescricaoVotacao ?? ""}|${
        v.Materia?.Codigo ?? ""
      }|${v.VotoParlamentar ?? ""}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}

export async function getSenadorComissoes(id: string): Promise<Comissao[]> {
  const data = await fetchJson<{
    MembroComissaoParlamentar?: {
      Parlamentar?: {
        MembroComissoes?: {
          Comissao?:
            | {
                IdentificacaoComissao?: {
                  SiglaComissao?: string;
                  NomeComissao?: string;
                };
                DescricaoParticipacao?: string;
                DataInicio?: string;
                DataFim?: string;
              }[]
            | {
                IdentificacaoComissao?: {
                  SiglaComissao?: string;
                  NomeComissao?: string;
                };
                DescricaoParticipacao?: string;
                DataInicio?: string;
                DataFim?: string;
              };
        };
      };
    };
  }>(`${SENADO}/senador/${id}/comissoes.json?v=5`);
  const raw =
    data?.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao ??
    [];
  return asArray(raw)
    .filter((c) => !c.DataFim)
    .map((c) => ({
      sigla: (c.IdentificacaoComissao?.SiglaComissao ?? "—").toUpperCase(),
      titularidade: (c.DescricaoParticipacao ?? "")
        .toLowerCase()
        .includes("supl")
        ? ("Suplente" as const)
        : ("Titular" as const),
      nome: c.IdentificacaoComissao?.NomeComissao ?? "",
    }))
    .filter((c) => c.nome);
}

export async function getSenadorMandatos(id: string) {
  const data = await fetchJson<{
    MandatoParlamentar?: {
      Parlamentar?: {
        Mandatos?: {
          Mandato?:
            | {
                CodigoMandato?: string;
                UfParlamentar?: string;
                DescricaoParticipacao?: string;
                PrimeiraLegislaturaDoMandato?: {
                  NumeroLegislatura?: string;
                  DataInicio?: string;
                  DataFim?: string;
                };
              }[]
            | {
                CodigoMandato?: string;
                UfParlamentar?: string;
                DescricaoParticipacao?: string;
                PrimeiraLegislaturaDoMandato?: {
                  NumeroLegislatura?: string;
                  DataInicio?: string;
                  DataFim?: string;
                };
              };
        };
      };
    };
  }>(`${SENADO}/senador/${id}/mandatos.json?v=5`);
  const raw = data?.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato ?? [];
  return asArray(raw);
}

export async function getSenadorAutorias(id: string): Promise<AutoriaSenado[]> {
  const data = await fetchJson<{
    MateriasAutoriaParlamentar?: {
      Parlamentar?: {
        Autorias?: { Autoria?: AutoriaSenado[] | AutoriaSenado };
      };
    };
  }>(`${SENADO}/senador/${id}/autorias.json?v=7`, { timeoutMs: 20000 });
  return asArray(
    data?.MateriasAutoriaParlamentar?.Parlamentar?.Autorias?.Autoria,
  ).filter((a) => Boolean(a?.Materia?.DescricaoIdentificacao));
}

export async function getSenadorRelatorias(
  id: string,
): Promise<RelatoriaSenado[]> {
  const data = await fetchJson<{
    MateriasRelatoriaParlamentar?: {
      Parlamentar?: {
        Relatorias?: { Relatoria?: RelatoriaSenado[] | RelatoriaSenado };
      };
    };
  }>(`${SENADO}/senador/${id}/relatorias.json?v=6`, { timeoutMs: 20000 });
  return asArray(
    data?.MateriasRelatoriaParlamentar?.Parlamentar?.Relatorias?.Relatoria,
  ).filter((r) => Boolean(r?.Materia?.DescricaoIdentificacao));
}

export async function getSenadorCargos(id: string): Promise<CargoSenado[]> {
  const data = await fetchJson<{
    CargoParlamentar?: {
      Parlamentar?: { Cargos?: { Cargo?: CargoSenado[] | CargoSenado } };
    };
  }>(`${SENADO}/senador/${id}/cargos.json?v=5`);
  return asArray(data?.CargoParlamentar?.Parlamentar?.Cargos?.Cargo);
}

export async function getSenadorLiderancas(
  id: string,
): Promise<LiderancaSenado[]> {
  const data = await fetchJson<{
    LiderancaParlamentar?: {
      Parlamentar?: {
        Liderancas?: { Lideranca?: LiderancaSenado[] | LiderancaSenado };
      };
    };
  }>(`${SENADO}/senador/${id}/liderancas.json?v=5`);
  return asArray(
    data?.LiderancaParlamentar?.Parlamentar?.Liderancas?.Lideranca,
  );
}

/* ------------------------------ mappers -------------------------------- */

export function buildSenadorEvents(input: {
  senadorId: string;
  filiacoes: Filiacao[];
  discursos: Pronunciamento[];
  votacoes: VotacaoSenado[];
  mandatos: Awaited<ReturnType<typeof getSenadorMandatos>>;
  autorias?: AutoriaSenado[];
  relatorias?: RelatoriaSenado[];
  cargos?: CargoSenado[];
  liderancas?: LiderancaSenado[];
  bio?: {
    nascimento?: string;
    naturalidade?: string;
    nomeCivil?: string;
  };
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Perfil: nascimento e naturalidade.
  if (input.bio?.nascimento) {
    const ano = yearFromDate(input.bio.nascimento);
    if (ano) {
      events.push({
        id: "bio-nascimento",
        year: ano,
        date: input.bio.nascimento,
        title: "Nascimento",
        summary: input.bio.naturalidade ?? "—",
        category: "carreira",
        impact: "positivo",
        detail: `Nome civil: ${input.bio.nomeCivil ?? "—"}. Natural de ${
          input.bio.naturalidade ?? "—"
        }.`,
        sources: [
          {
            label: "Perfil oficial (Senado)",
            href: `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${input.senadorId}`,
          },
        ],
      });
    }
  }

  // Autorias de proposições — agrupadas por ano.
  const autoriasPorAno = new Map<number, AutoriaSenado[]>();
  for (const a of input.autorias ?? []) {
    const ano =
      yearFromDate(a.Materia?.Data) ??
      (a.Materia?.Ano ? Number(a.Materia.Ano) : null);
    if (!ano) continue;
    const lista = autoriasPorAno.get(ano) ?? [];
    lista.push(a);
    autoriasPorAno.set(ano, lista);
  }
  for (const [ano, lista] of autoriasPorAno) {
    events.push({
      id: `aut-${ano}`,
      year: ano,
      title: `Proposições de autoria — ${ano}`,
      summary: `${lista.length} matéria(s) de autoria do senador em ${ano}.`,
      category: "proposicao",
      detail: lista
        .slice(0, 5)
        .map(
          (a) =>
            `${a.Materia?.DescricaoIdentificacao ?? "Matéria"} — ${
              a.Materia?.Ementa ?? "sem ementa"
            }`,
        )
        .join(" | "),
      sources: [
        {
          label: "Autorias (Senado)",
          href: `https://www25.senado.leg.br/web/atividade/materias/-/materia?p_autor=${input.senadorId}`,
        },
      ],
    });
  }

  // Relatorias — agrupadas por ano.
  const relatoriasPorAno = new Map<number, RelatoriaSenado[]>();
  for (const r of input.relatorias ?? []) {
    const ano =
      yearFromDate(r.DataDesignacao) ?? yearFromDate(r.Materia?.Data);
    if (!ano) continue;
    const lista = relatoriasPorAno.get(ano) ?? [];
    lista.push(r);
    relatoriasPorAno.set(ano, lista);
  }
  for (const [ano, lista] of relatoriasPorAno) {
    events.push({
      id: `rel-${ano}`,
      year: ano,
      title: `Relatorias — ${ano}`,
      summary: `Designado(a) relator(a) de ${lista.length} matéria(s) em ${ano}.`,
      category: "proposicao",
      detail: lista
        .slice(0, 5)
        .map(
          (r) =>
            `${r.Materia?.DescricaoIdentificacao ?? "Matéria"} (${
              r.Comissao?.Sigla ?? "—"
            })`,
        )
        .join(", "),
      sources: [
        {
          label: "Relatorias (Senado)",
          href: `https://www25.senado.leg.br/web/atividade/materias`,
        },
      ],
    });
  }

  // Cargos em comissões, frentes e grupos parlamentares.
  for (const c of input.cargos ?? []) {
    const ano = yearFromDate(c.DataInicio);
    const orgao = c.IdentificacaoComissao;
    if (!ano || !c.DescricaoCargo || !orgao?.NomeComissao) continue;
    events.push({
      id: `cargo-${c.CodigoCargo ?? orgao.CodigoComissao}-${c.DataInicio}`,
      year: ano,
      date: c.DataInicio,
      title: `Cargo — ${c.DescricaoCargo}`,
      summary: `${orgao.NomeComissao} (${orgao.SiglaCasaComissao ?? orgao.SiglaComissao ?? "—"})`,
      category: "carreira",
      detail: `${c.DescricaoCargo} em ${orgao.NomeComissao}${
        c.DataFim ? `, até ${c.DataFim}` : " (em exercício)"
      }.`,
    });
  }

  // Lideranças partidárias e de bloco.
  for (const l of input.liderancas ?? []) {
    const ano = yearFromDate(l.DataDesignacao);
    if (!ano || !l.DescricaoTipoLideranca) continue;
    events.push({
      id: `lider-${l.DataDesignacao}-${l.UnidadeLideranca ?? events.length}`,
      year: ano,
      date: l.DataDesignacao,
      title: `Liderança — ${l.DescricaoTipoLideranca}`,
      summary: [l.UnidadeLideranca, l.Partido?.SiglaPartido, l.NomeCasaLideranca]
        .filter(Boolean)
        .join(" · "),
      category: "carreira",
      detail: `${l.DescricaoTipoLideranca}${l.Partido?.NomePartido ? ` pelo ${l.Partido.NomePartido}` : ""}${
        l.DataFim ? ` (até ${l.DataFim})` : ""
      }.`,
    });
  }


  // Votações nominais — apenas sessões com posição registrada (Sim/Não/
  // Abstenção/Obstrução). "Votou" (secreto), MIS e AP não revelam posição e
  // ficam de fora da linha do tempo para não inflar o payload da página.
  const votacoesRecentes = [...input.votacoes]
    .sort((a, b) => (b.DataSessao ?? "").localeCompare(a.DataSessao ?? ""))
    .slice(0, 40);

  for (const v of votacoesRecentes) {
    const year = yearFromDate(v.DataSessao);
    if (!year) continue;
    const posicao = v.VotoParlamentar ? toVotePosition(v.VotoParlamentar) : null;
    if (!posicao) continue;
    const materia =
      v.Materia?.DescricaoIdentificacao ??
      v.DescricaoIdentificacaoMateria ??
      v.DescricaoVotacao ??
      "Votação nominal";
    events.push({
      id: `vot-${v.DataSessao}-${v.DescricaoVotacao ?? events.length}`,
      year,
      date: v.DataSessao,
      title: `Votação — ${materia}`,
      summary:
        v.DescricaoVotacao ??
        v.Materia?.Ementa ??
        "Posicionamento em votação nominal no Senado.",
      category: "votacao",
      vote: posicao,
      voteProposicao: materia,
      detail: [
        v.DescricaoVotacao,
        v.Materia?.Ementa,
        v.DescricaoVoto ? `Voto do parlamentar: ${v.DescricaoVoto}.` : "",
        v.DescricaoResultado ? `Resultado: ${v.DescricaoResultado}.` : "",
        v.TextoTramitacao ? v.TextoTramitacao.slice(0, 300) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
      sources: [
        {
          label: "Votação (Senado)",
          href: `https://www25.senado.leg.br/web/atividade/votacoes`,
        },
      ],
    });
  }

  // Discursos
  const discursosRecentes = [...input.discursos]
    .sort((a, b) =>
      (b.DataPronunciamento ?? "").localeCompare(a.DataPronunciamento ?? ""),
    )
    .slice(0, 120);

  for (const p of discursosRecentes) {
    const year = yearFromDate(p.DataPronunciamento);
    if (!year) continue;
    const texto = p.TextoResumo ?? "";
    const polemico = isPolemico(texto);
    events.push({
      id: `dis-${p.DataPronunciamento}-${events.length}`,
      year,
      date: p.DataPronunciamento,
      title: polemico
        ? "Discurso de impacto / fala polêmica"
        : `Pronunciamento — ${p.TipoUsoPalavra?.Descricao ?? "Discurso"}`,
      summary: texto.slice(0, 220),
      category: "discurso",
      impact: polemico ? "alerta" : undefined,
      discurso: {
        tipo: p.TipoUsoPalavra?.Descricao,
        tema: p.Indexacao?.split(",")?.slice(0, 5).join(", "),
        resumo: texto,
        urlTexto: p.UrlTexto,
        polemico,
      },
      detail: texto,
      sources: p.UrlTexto
        ? [{ label: "Íntegra (Senado)", href: p.UrlTexto }]
        : undefined,
    });
  }

  // Filiações partidárias (migrações)
  for (const f of input.filiacoes) {
    const inicio = f.DataFiliacao;
    const year = yearFromDate(inicio);
    if (!year) continue;
    const fim = f.DataDesfiliacao;
    events.push({
      id: `fil-${inicio}-${f.SiglaPartido ?? events.length}`,
      year,
      date: inicio,
      title: `Filiação — ${f.SiglaPartido ?? f.NomePartido ?? "partido"}`,
      summary: `Filiação partidária a ${f.NomePartido ?? f.SiglaPartido}${
        fim ? ` (até ${fim})` : " (atual)"
      }.`,
      category: "partido",
      detail: `${f.NomePartido ?? f.SiglaPartido}: filiação em ${inicio}${
        fim ? ` e desfiliação em ${fim}` : " (sem data de saída)"
      }.`,
    });
  }

  // Mandatos
  for (const m of input.mandatos) {
    const inicio = m.PrimeiraLegislaturaDoMandato?.DataInicio;
    const year = yearFromDate(inicio);
    if (!year) continue;
    events.push({
      id: `man-${m.CodigoMandato ?? year}`,
      year,
      date: inicio,
      title: "Mandato de Senador",
      summary: `Início de mandato no Senado Federal (${m.UfParlamentar ?? "—"}).`,
      category: "mandato",
      impact: "positivo",
      detail: `Mandato iniciado em ${inicio}${
        m.PrimeiraLegislaturaDoMandato?.DataFim
          ? ` com término previsto em ${m.PrimeiraLegislaturaDoMandato.DataFim}`
          : ""
      }.`,
    });
  }

  return events;
}

export async function buildSenador(id: string): Promise<Politico | null> {
  "use cache";
  cacheLife("hours");

  const [basico, mandatos] = await Promise.all([
    getSenadorDetalhe(id),
    getSenadorMandatos(id),
  ]);
  if (!basico) return null;

  // Discursos desde o primeiro mandato (não só a legislatura atual).
  const anosMandato = mandatos
    .map((m) => yearFromDate(m.PrimeiraLegislaturaDoMandato?.DataInicio))
    .filter((ano): ano is number => Boolean(ano));
  const anoInicio = anosMandato.length ? Math.min(...anosMandato) : 1995;

  const [
    filiacoes,
    discursos,
    votacoes,
    comissoes,
    cargos,
    liderancas,
    autorias,
    relatorias,
  ] = await Promise.all([
    getSenadorFiliacoes(id),
    getSenadorDiscursos(id, anoInicio),
    getSenadorVotacoes(id),
    getSenadorComissoes(id),
    getSenadorCargos(id),
    getSenadorLiderancas(id),
    getSenadorAutorias(id),
    getSenadorRelatorias(id),
  ]);

  const nome = basico.NomeParlamentar ?? "Senador";
  const naturalidade =
    [
      basico.DadosBasicosParlamentar?.Naturalidade,
      basico.DadosBasicosParlamentar?.UfNaturalidade,
    ]
      .filter(Boolean)
      .join(" / ") || undefined;

  const events = buildSenadorEvents({
    senadorId: id,
    filiacoes,
    discursos,
    votacoes,
    mandatos,
    autorias,
    relatorias,
    cargos,
    liderancas,
    bio: {
      nascimento: basico.DadosBasicosParlamentar?.DataNascimento,
      naturalidade,
      nomeCivil: basico.NomeCompletoParlamentar,
    },
  });

  const midia = buildMediaLinks({
    nome,
    cargo: "senador",
    id,
    site: basico.UrlPaginaParlamentar,
  });

  const frentes = [
    ...new Set(
      cargos
        .map((c) => c.IdentificacaoComissao?.NomeComissao)
        .filter(
          (n): n is string =>
            Boolean(n) && /frente|grupo parlamentar/i.test(n ?? ""),
        ),
    ),
  ];

  const polemicas = events.filter(
    (e) => e.impact === "critico" || e.discurso?.polemico,
  ).length;

  // Presença = sessões em que não houve ausência justificada
  // (MIS = missão oficial da Casa, AP = atividade parlamentar).
  const totalVotacoes = votacoes.length;
  const ausencias = votacoes.filter((v) =>
    /^(mis|ap)$/i.test((v.VotoParlamentar ?? "").trim()),
  ).length;
  const presencaMedia = totalVotacoes
    ? Math.round(((totalVotacoes - ausencias) / totalVotacoes) * 100)
    : 0;

  const telefones = asArray(basico.Telefones?.Telefone ?? [])
    .map((t) => t.NumeroTelefone)
    .filter((t): t is string => Boolean(t))
    .join(", ");

  const mandatoAtual = mandatos[0];
  const legislatura = mandatoAtual?.PrimeiraLegislaturaDoMandato?.NumeroLegislatura
    ? `${mandatoAtual.PrimeiraLegislaturaDoMandato.NumeroLegislatura}ª`
    : "—";
  const condicao =
    (mandatoAtual?.DescricaoParticipacao ?? "").toLowerCase().includes("supl")
      ? "Suplente"
      : "Titular";
  const endereco = basico.DadosBasicosParlamentar?.EnderecoParlamentar ?? "";
  const sala = endereco.match(/gabinete\s*\d+/i)?.[0] ?? "—";

  return {
    id,
    nome,
    nomeBusca: `${basico.NomeParlamentar ?? ""} ${basico.SiglaPartidoParlamentar ?? ""} ${basico.UfParlamentar ?? ""}`.toLowerCase(),
    cargo: "senador",
    vigente: true,
    uf: basico.UfParlamentar ?? "—",
    partido: basico.SiglaPartidoParlamentar ?? "—",
    fotoUrl: basico.UrlFotoParlamentar,
    legislatura,
    sexo: basico.SexoParlamentar ?? "—",
    escolaridade: "—",
    condicao,
    transparencia: {
      score: Math.min(95, 50 + Math.round(discursos.length / 20)),
      label: "Transparência moderada",
    },
    gabinete: {
      predio: "Senado Federal",
      sala: sala === "—" ? "—" : sala.replace(/gabinete/i, "Gabinete "),
      telefone: telefones || "—",
      email: basico.EmailParlamentar ?? "—",
    },
    comissoes,
    stats: {
      presencaMedia,
      diasTrabalhados: totalVotacoes,
      ceapTotal: 0,
    },
    events,
    bio: {
      nomeCivil: basico.NomeCompletoParlamentar,
      nascimento: basico.DadosBasicosParlamentar?.DataNascimento,
      idade: calcularIdade(basico.DadosBasicosParlamentar?.DataNascimento),
      naturalidade,
    },
    frentes: frentes.slice(0, 24),
    midia,
    polemicas,
    atividade: {
      votacoes: totalVotacoes,
      discursos: discursos.length,
      proposicoes: autorias.length,
      relatorias: relatorias.length,
      despesas: 0,
      cargos: cargos.length,
    },
  };
}
