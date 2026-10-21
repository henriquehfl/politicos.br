import type { ElectionResult, FonteDados } from "./types";

/** Unidades da Federação usadas no portal de resultados do TSE. */
export const UFS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
] as const;

export type UfSigla = (typeof UFS)[number]["sigla"];

export type CargoApuracaoId =
  | "governador"
  | "senador"
  | "deputado-federal"
  | "deputado-estadual";

export interface CargoApuracao {
  id: CargoApuracaoId;
  label: string;
  /** Código do cargo nos arquivos do TSE (ex.: 3 = governador). */
  codigo: string;
}

/**
 * Cargos publicados por UF no conjunto de resultados de 2026.
 *
 * O TSE usa o código 8 para deputado distrital no DF; o cliente troca
 * automaticamente o código quando a UF é o Distrito Federal.
 */
export const CARGOS_APURACAO: readonly CargoApuracao[] = [
  { id: "governador", label: "Governador", codigo: "3" },
  { id: "senador", label: "Senador", codigo: "5" },
  { id: "deputado-federal", label: "Deputado federal", codigo: "6" },
  {
    id: "deputado-estadual",
    label: "Deputado estadual/distrital",
    codigo: "7",
  },
];

export function ufValida(valor: string): valor is UfSigla {
  const alvo = valor.trim().toUpperCase();
  return UFS.some((uf) => uf.sigla === alvo);
}

export function cargoApuracao(
  valor: string | null | undefined,
): CargoApuracao | null {
  return CARGOS_APURACAO.find((cargo) => cargo.id === valor) ?? null;
}

export interface ApuracaoCandidato {
  id: string;
  numero: string;
  nome: string;
  nomeCompleto: string;
  partido: string;
  coligacao?: string;
  votos: number;
  percentual: number;
  situacao?: string;
  resultado: ElectionResult;
}

export interface ApuracaoSnapshot {
  uf: UfSigla;
  cargo: CargoApuracaoId;
  cargoNome: string;
  ano: number;
  turno: 1 | 2;
  /** Data/hora de geração informada pelo TSE (ex.: 05/10/2026 11:47:48). */
  atualizadoEm: string | null;
  secoesTotal: number;
  secoesApuradas: number;
  percentualApurado: number;
  finalizada: boolean;
  comparecimento: number;
  abstencoes: number;
  votosValidos: number;
  votosTotais: number;
  totalCandidatos: number;
  candidatos: ApuracaoCandidato[];
  fonte: FonteDados;
}

export function rotuloResultado(resultado: ElectionResult): string {
  if (resultado === "eleito") return "Eleito";
  if (resultado === "suplente") return "Suplente";
  if (resultado === "nao_eleito") return "Não eleito";
  return "Candidato";
}
