import { FATOS_POLITICOS, type FatoPolitico } from "@/data/fatos-politicos";
import { historicoBrasilEvents } from "@/data/historico-brasil";
import { getPresidente } from "@/lib/cargos";
import { normalizarNome, primeiroTexto, textoLimpo } from "@/lib/texto";
import type { TimelineEvent } from "@/lib/types";

/**
 * Combina a linha do tempo parlamentar com fatos históricos curados.
 *
 * O vínculo é sempre por nome (e, para aliases, por data de nascimento). Isso
 * mantém a regra genérica: qualquer político com ficha no catálogo recebe os
 * mesmos eventos, sem condicionais por id ou por nome específico.
 */

function chavesDaPessoa(nome: string, nascimento?: string): Set<string> {
  const chaves = new Set<string>();
  const adicionar = (valor?: string) => {
    if (!valor) return;
    const chave = normalizarNome(valor);
    if (chave) chaves.add(chave);
  };

  adicionar(nome);

  const presidente = getPresidente(nome, nascimento);
  if (presidente) {
    adicionar(presidente.nome);
    for (const alias of presidente.aliases ?? []) adicionar(alias);
  }

  return chaves;
}

/** Aceita "Governo Lula" como referência a Lula, sem perder o nome exato. */
function chavesDoProtagonista(valor: string): string[] {
  const exato = normalizarNome(valor);
  const semCargo = exato.replace(
    /^(governo|gestao|presidente|ex presidente)\s+/,
    "",
  );
  return exato === semCargo ? [exato] : [exato, semCargo];
}

function fatoParaEvento(fato: FatoPolitico, prefixo: string): TimelineEvent {
  const declaracao = fato.tipo === "declaracao" || fato.tipo === "rede-social";
  const tipo =
    fato.tipo === "rede-social"
      ? "Publicação em rede social"
      : fato.tipo === "declaracao"
        ? "Declaração pública"
        : undefined;

  return {
    id: `${prefixo}-fato-${fato.id}`,
    year: Number(fato.data.slice(0, 4)),
    date: fato.data,
    title: fato.titulo,
    summary: fato.resumo,
    category: fato.categoria,
    impact: fato.impacto,
    detail: fato.detalhe,
    sources: fato.fontes,
    discurso: declaracao
      ? {
          tipo,
          resumo: fato.resumo,
          polemico: Boolean(fato.polemico),
        }
      : undefined,
  };
}

/**
 * Eventos históricos aplicáveis ao perfil.
 *
 * Inclui:
 * - fatos curados (prisão, condenação, cassação, declarações, redes sociais);
 * - marcos nacionais em que a pessoa aparece como protagonista.
 */
export function getEventosHistoricos(
  nome: string,
  nascimento: string | undefined,
  prefixo: string,
): TimelineEvent[] {
  const chaves = chavesDaPessoa(nome, nascimento);

  const fatos = FATOS_POLITICOS.filter((fato) =>
    chaves.has(normalizarNome(fato.pessoa)),
  ).map((fato) => fatoParaEvento(fato, prefixo));

  const nacionais = historicoBrasilEvents
    .filter((evento) =>
      (evento.protagonists ?? []).some((protagonista) =>
        chavesDoProtagonista(protagonista).some((chave) => chaves.has(chave)),
      ),
    )
    .map((evento) => ({
      ...evento,
      id: `${prefixo}-hist-${evento.id}`,
    }));

  return [...fatos, ...nacionais];
}

/**
 * Mescla listas na ordem de prioridade (base → cargos → fatos → nacional).
 * Evita ids repetidos, fatos nacionais repetindo um fato curado e posse
 * duplicada por um evento nacional genérico ("Fulano assume a Presidência").
 * Pronunciamentos da base não são colapsados.
 */
export function mesclarEventos(...listas: TimelineEvent[][]): TimelineEvent[] {
  const resultado: TimelineEvent[] = [];
  const ids = new Set<string>();
  const chaves = new Set<string>();

  for (const lista of listas) {
    for (const evento of lista) {
      if (!evento?.id || ids.has(evento.id)) continue;

      // Fatos curados e marcos nacionais podem repetir um evento já existente
      // (ex.: "Prisão de Lula" na base nacional e no catálogo). Já os eventos
      // parlamentares usam ids únicos: dois pronunciamentos no mesmo dia com o
      // mesmo tipo são falas distintas e não podem ser colapsados pelo título.
      const curado =
        evento.id.includes("-fato-") || evento.id.includes("-hist-");
      // Data + categoria identifica o mesmo acontecimento mesmo quando a base
      // nacional usa outro título ("Eleição de FHC" x "Candidatura de Lula").
      const chave = `${evento.date ?? evento.year}-${evento.category}`;
      if (curado && chaves.has(chave)) continue;

      const posseDuplicada =
        evento.category === "eleicao" &&
        Boolean(evento.date) &&
        /assume|posse/i.test(evento.title) &&
        resultado.some(
          (existente) =>
            existente.date === evento.date && existente.category === "mandato",
        );
      if (posseDuplicada) continue;

      ids.add(evento.id);
      if (curado) chaves.add(chave);
      resultado.push(evento);
    }
  }

  return resultado;
}

/** Remove `null`, vazio e placeholders de qualquer evento, de qualquer fonte. */
export function sanearEventos(eventos: TimelineEvent[]): TimelineEvent[] {
  return eventos.map((evento) => {
    const summary =
      textoLimpo(evento.summary, 600) ??
      "Sem descrição disponível na fonte oficial.";

    return {
      ...evento,
      title: textoLimpo(evento.title, 180) ?? "Evento sem título",
      summary,
      detail: textoLimpo(evento.detail, 2000),
      date: textoLimpo(evento.date),
      voteProposicao: textoLimpo(evento.voteProposicao),
      sources: evento.sources
        ?.map((fonte) => ({
          label: primeiroTexto(fonte.label, "Fonte"),
          href: textoLimpo(fonte.href),
        }))
        .filter(
          (fonte): fonte is { label: string; href: string } =>
            Boolean(fonte.label && fonte.href),
        ),
      discurso: evento.discurso
        ? {
            ...evento.discurso,
            tipo: textoLimpo(evento.discurso.tipo),
            tema: textoLimpo(evento.discurso.tema),
            resumo:
              textoLimpo(evento.discurso.resumo, 600) ?? summary,
            urlTexto: textoLimpo(evento.discurso.urlTexto),
          }
        : undefined,
    };
  });
}

/** Contagem usada pelo painel lateral; inclui fatos curados. */
export function contarPolemicas(eventos: TimelineEvent[]): number {
  return eventos.filter(
    (evento) => evento.impact === "critico" || evento.discurso?.polemico,
  ).length;
}
