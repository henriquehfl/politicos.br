import { PRESIDENTES, type MandatoPresidencial, type Presidente } from "@/data/presidentes";
import type { CargoPublico, TimelineEvent } from "@/lib/types";
import { normalizarNome } from "@/lib/texto";

function ano(iso: string): string {
  return iso.slice(0, 4);
}

function dataBR(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

function diaSeguinte(iso: string): string {
  const data = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + 1);
  return data.toISOString().slice(0, 10);
}

/**
 * Localiza a ficha presidencial pelo nome parlamentar.
 *
 * O nome oficial é tratado como chave única: bases da Câmara e do Senado
 * ocasionalmente divergem da data de nascimento oficial (ex.: Lula consta
 * como 06/10/1945 na Câmara, mas nasceu em 27/10/1945), então a data não
 * invalida um match de nome completo.
 *
 * A data de nascimento é usada apenas para validar aliases (apelidos e nomes
 * civis alternativos), evitando que homônimos recebam a trajetória de outra
 * pessoa. Sem data, aliases são recusados.
 */
export function getPresidente(nome: string, nascimento?: string): Presidente | null {
  const alvo = normalizarNome(nome);
  const data = nascimento?.slice(0, 10);

  const porNomeOficial = PRESIDENTES.find(
    (presidente) => normalizarNome(presidente.nome) === alvo,
  );
  if (porNomeOficial) return porNomeOficial;

  if (!data) return null;

  return (
    PRESIDENTES.find(
      (presidente) =>
        (presidente.aliases ?? []).some(
          (alias) => normalizarNome(alias) === alvo,
        ) && presidente.nascimento.slice(0, 10) === data,
    ) ?? null
  );
}

/** Agrupa mandatos consecutivos (ex.: 2011–2014 + 2015–2016 = 2011–2016). */
function agruparMandatos(mandatos: MandatoPresidencial[]): MandatoPresidencial[][] {
  const ordenados = [...mandatos].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const grupos: MandatoPresidencial[][] = [];

  for (const mandato of ordenados) {
    const grupoAtual = grupos[grupos.length - 1];
    const anterior = grupoAtual?.[grupoAtual.length - 1];
    const contiguo = anterior?.fim ? mandato.inicio === diaSeguinte(anterior.fim) : false;

    if (grupoAtual && contiguo) grupoAtual.push(mandato);
    else grupos.push([mandato]);
  }

  return grupos;
}

function cargoDoGrupo(
  presidente: Presidente,
  grupo: MandatoPresidencial[],
): CargoPublico {
  const primeiro = grupo[0];
  const ultimo = grupo[grupo.length - 1];
  const atual = !ultimo.fim;
  const observacao = grupo
    .map((mandato) => mandato.observacao)
    .filter(Boolean)
    .join(" ");

  return {
    cargo: "Presidente da República",
    periodo: `${ano(primeiro.inicio)}–${atual ? "hoje" : ano(ultimo.fim!)}`,
    inicio: primeiro.inicio,
    fim: ultimo.fim,
    atual,
    partido: ultimo.partido,
    vice: ultimo.vice,
    observacao: observacao || undefined,
    fonte: presidente.fonte,
    mandatos: grupo.map((mandato) => ({
      inicio: mandato.inicio,
      fim: mandato.fim,
      eleicao: mandato.eleicao,
      observacao: mandato.observacao,
    })),
  };
}

/**
 * Trajetória presidencial de um parlamentar, com mandatos agrupados.
 * Retorna lista vazia quando não há correspondência (ou quando a data de
 * nascimento não confere).
 */
export function getCargosPublicos(nome: string, nascimento?: string): CargoPublico[] {
  const presidente = getPresidente(nome, nascimento);
  if (!presidente) return [];
  return agruparMandatos(presidente.mandatos).map((grupo) =>
    cargoDoGrupo(presidente, grupo),
  );
}

/** Cargo em exercício para exibição em busca/listagens (match exato de nome). */
export function getCargoAtualPorNome(nome: string): CargoPublico | null {
  const presidente = PRESIDENTES.find(
    (item) => normalizarNome(item.nome) === normalizarNome(nome),
  );
  if (!presidente) return null;

  return (
    getCargosPublicos(presidente.nome, presidente.nascimento).find(
      (cargo) => cargo.atual,
    ) ?? null
  );
}

/** Converte a trajetória presidencial em eventos oficiais da linha do tempo. */
export function buildCargoEvents(cargos: CargoPublico[], prefix: string): TimelineEvent[] {
  return cargos.flatMap((cargo) => {
    const eventos: TimelineEvent[] = [];

    for (const mandato of cargo.mandatos) {
      const eleicao = mandato.eleicao ? ` Eleito em ${mandato.eleicao}.` : "";

      eventos.push({
        id: `${prefix}-presidente-${mandato.inicio}`,
        date: mandato.inicio,
        year: Number(ano(mandato.inicio)),
        title: mandato.fim
          ? "Posse — Presidente da República"
          : "Posse — Presidente da República (em exercício)",
        category: "mandato",
        summary: `Início do mandato presidencial (${cargo.periodo}).${eleicao}`,
        detail: [
          `Posse em ${dataBR(mandato.inicio)}.`,
          cargo.vice ? `Vice-presidente: ${cargo.vice}.` : "",
          mandato.observacao ?? "",
          `Fonte: ${cargo.fonte.label}.`,
        ]
          .filter(Boolean)
          .join(" "),
        impact: "positivo",
        sources: [cargo.fonte],
      });

      if (mandato.fim) {
        eventos.push({
          id: `${prefix}-presidente-fim-${mandato.fim}`,
          date: mandato.fim,
          year: Number(ano(mandato.fim)),
          title: "Fim do mandato — Presidente da República",
          category: "mandato",
          summary: `Encerramento do mandato presidencial (${cargo.periodo}).`,
          detail: [
            `Último dia do mandato: ${dataBR(mandato.fim)}.`,
            mandato.observacao ?? "",
            `Fonte: ${cargo.fonte.label}.`,
          ]
            .filter(Boolean)
            .join(" "),
          sources: [cargo.fonte],
        });
      }
    }

    return eventos;
  });
}
