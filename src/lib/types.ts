export type TimelineCategory =
  | "mandato"
  | "partido"
  | "votacao"
  | "eleicao"
  | "discurso"
  | "financas"
  | "auditoria"
  | "presenca"
  | "proposicao"
  | "carreira"
  | "historico";

export type VotePosition = "SIM" | "NAO" | "ABSTENCAO" | "OBSTRUCAO";

export type ElectionResult = "eleito" | "nao_eleito" | "suplente" | "candidato";

export interface ElectionInfo {
  cargo: string;
  ano: number;
  turno?: 1 | 2;
  votos?: number;
  percentual?: number;
  municipio?: string;
  resultado: ElectionResult;
  partido?: string;
  coligacao?: string;
  totalVotosValidos?: number;
  /** Situação oficial publicada pelo TSE (ex.: "Eleito por QP", "Suplente"). */
  situacao?: string;
  /** Link para o resultado oficial que sustenta os números. */
  fonte?: FonteDados;
}

/**
 * Consulta eleitoral de um perfil. `disponivel` separa falha de API de
 * ausência real de candidatura.
 */
export interface EleicaoPolitico {
  ano: number;
  disponivel: boolean;
  resultado: ElectionInfo | null;
  consulta: FonteDados;
}

export interface SpeechInfo {
  tipo?: string;
  tema?: string;
  resumo: string;
  urlTexto?: string;
  polemico?: boolean;
}

/** Tipo de fonte exibido junto ao link na linha do tempo. */
export type FonteTipo =
  | "oficial"
  | "documento"
  | "noticia"
  | "video"
  | "post"
  | "perfil";

export interface FonteDados {
  label: string;
  href: string;
  tipo?: FonteTipo;
  veiculo?: string;
  /** Data de publicação da fonte (AAAA-MM-DD). */
  data?: string;
}

/** Trecho literal de fala ou publicação, sempre acompanhado de fonte. */
export interface CitacaoEvento {
  texto: string;
  autor?: string;
  contexto?: string;
}

export interface AttendanceInfo {
  ano?: number;
  sessoes: number;
  diasPresente: number;
  faltasJustificadas: number;
  faltasNaoJustificadas: number;
}

export interface TimelineEvent {
  id: string;
  year: number;
  date?: string;
  title: string;
  summary: string;
  category: TimelineCategory;
  impact?: "positivo" | "alerta" | "critico";
  vote?: VotePosition;
  voteProposicao?: string;
  protagonists?: string[];
  sources?: FonteDados[];
  detail?: string;
  citacao?: CitacaoEvento;
  presenca?: AttendanceInfo;
  eleicao?: ElectionInfo;
  discurso?: SpeechInfo;
}

export interface Comissao {
  sigla: string;
  titularidade: "Titular" | "Suplente";
  nome: string;
}

export interface Expense {
  ano: number;
  mes: number;
  tipoDespesa: string;
  fornecedor: string;
  valor: number;
  urlDocumento?: string | null;
}

export interface PoliticoSummary {
  id: string;
  nome: string;
  cargo: "deputado" | "senador";
  vigente: boolean;
  uf: string;
  partido: string;
  fotoUrl?: string;
  /** Legislaturas em que o parlamentar atuou (ex.: [55, 56, 57]). */
  legislaturas?: number[];
  /** Primeiro e último ano de atuação parlamentar. */
  desde?: number;
  ate?: number;
  /** Intervalos contíguos formatados, ex.: "1987–2002 · 2019–hoje". */
  periodos?: string;
}

export type MediaKind =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "site"
  | "noticias"
  | "outro";

export interface MediaLink {
  tipo: MediaKind;
  label: string;
  url: string;
  /** Link oficial informado pelo próprio parlamentar. */
  oficial?: boolean;
}

export interface PoliticoBio {
  nomeCivil?: string;
  nascimento?: string;
  idade?: number;
  naturalidade?: string;
  falecimento?: string;
}

export interface PoliticoAtividade {
  votacoes: number;
  discursos: number;
  proposicoes: number;
  relatorias?: number;
  despesas: number;
  frentes?: number;
  cargos?: number;
}

export interface MandatoCargo {
  inicio: string;
  fim?: string;
  eleicao?: number;
  observacao?: string;
}

export interface CargoPublico {
  cargo: string;
  /** Intervalo agrupado, ex.: "2003–2010" ou "2023–hoje". */
  periodo: string;
  inicio: string;
  fim?: string;
  atual: boolean;
  partido: string;
  vice?: string;
  observacao?: string;
  fonte: FonteDados;
  mandatos: MandatoCargo[];
}

export interface Politico extends PoliticoSummary {
  nomeBusca: string;
  legislatura: string;
  sexo: string;
  escolaridade: string;
  condicao: string;
  /** Resultado oficial da eleição geral de 2026, quando consultável. */
  eleicao?: EleicaoPolitico;
  gabinete: {
    predio: string;
    sala: string;
    telefone: string;
    email: string;
  };
  comissoes: Comissao[];
  stats?: {
    presencaMedia: number | null;
    diasTrabalhados: number;
    ceapTotal: number | null;
  };
  /** Trajetória além do mandato parlamentar (ex.: Presidência da República). */
  cargos?: CargoPublico[];
  /** Cargo em exercício, quando houver. */
  situacaoAtual?: CargoPublico | null;
  events: TimelineEvent[];
  expenses?: Expense[];
  bio?: PoliticoBio;
  profissoes?: string[];
  frentes?: string[];
  midia?: MediaLink[];
  atividade?: PoliticoAtividade;
  /** Eventos sinalizados como polêmicos (discursos, votações sensíveis etc.). */
  polemicas?: number;
}
