import type { FonteDados } from "@/lib/types";

/**
 * Presidentes da República desde a redemocratização (1985).
 *
 * A API da Câmara/Senado cobre apenas o mandato parlamentar. Este catálogo
 * completa a trajetória de quem também exerceu a Presidência, com datas de
 * posse e fim de mandato conferidas nas fontes oficiais do Planalto.
 *
 * Fontes:
 * - Galeria de ex-presidentes:
 *   https://www2.planalto.gov.br/acervo/galeria-de-presidentes/biografias-dos-ex-presidentes
 * - Biografia do presidente em exercício:
 *   https://www.gov.br/planalto/pt-br/conheca-a-presidencia/biografia-do-presidente/biografia-do-39o-presidente-da-republica
 */
export interface MandatoPresidencial {
  /** Data de posse (AAAA-MM-DD). */
  inicio: string;
  /** Último dia do mandato; ausente = em exercício. */
  fim?: string;
  /** Ano da eleição presidencial, quando houve eleição direta. */
  eleicao?: number;
  partido: string;
  vice?: string;
  observacao?: string;
}

export interface Presidente {
  /** Nome exibido no perfil da Câmara/Senado (NomeParlamentar). */
  nome: string;
  /** Nomes civis/alternativos; só são aceitos com data de nascimento igual. */
  aliases?: string[];
  nascimento: string;
  mandatos: MandatoPresidencial[];
  fonte: FonteDados;
}

const GALERIA: FonteDados = {
  label: "Planalto — Galeria de ex-presidentes",
  href: "https://www2.planalto.gov.br/acervo/galeria-de-presidentes/biografias-dos-ex-presidentes",
};

const BIO_ATUAL: FonteDados = {
  label: "Planalto — Biografia do presidente",
  href: "https://www.gov.br/planalto/pt-br/conheca-a-presidencia/biografia-do-presidente/biografia-do-39o-presidente-da-republica",
};

export const PRESIDENTES: Presidente[] = [
  {
    nome: "JOSÉ SARNEY",
    aliases: ["JOSÉ RIBAMAR FERREIRA DE ARAÚJO COSTA"],
    nascimento: "1930-04-24",
    mandatos: [
      {
        inicio: "1985-04-21",
        fim: "1990-03-14",
        partido: "PMDB",
        observacao:
          "Assumiu após a morte de Tancredo Neves; era o vice-presidente eleito indiretamente em 1985.",
      },
    ],
    fonte: GALERIA,
  },
  {
    nome: "FERNANDO COLLOR",
    aliases: ["FERNANDO AFONSO COLLOR DE MELLO"],
    nascimento: "1949-08-12",
    mandatos: [
      {
        inicio: "1990-03-15",
        fim: "1992-12-29",
        eleicao: 1989,
        partido: "PRN",
        vice: "Itamar Franco",
        observacao:
          "Renunciou em 29/12/1992, durante o processo de impeachment.",
      },
    ],
    fonte: GALERIA,
  },
  {
    nome: "ITAMAR FRANCO",
    aliases: ["ITAMAR AUGUSTO CAUTIERO FRANCO"],
    nascimento: "1930-06-28",
    mandatos: [
      {
        inicio: "1992-12-29",
        fim: "1994-12-31",
        partido: "PMDB",
        observacao:
          "Assumiu como vice-presidente após o afastamento de Collor; exercício interino desde 02/10/1992.",
      },
    ],
    fonte: GALERIA,
  },
  {
    nome: "FERNANDO HENRIQUE CARDOSO",
    nascimento: "1931-06-18",
    mandatos: [
      {
        inicio: "1995-01-01",
        fim: "1998-12-31",
        eleicao: 1994,
        partido: "PSDB",
        vice: "Marco Maciel",
      },
      {
        inicio: "1999-01-01",
        fim: "2002-12-31",
        eleicao: 1998,
        partido: "PSDB",
        vice: "Marco Maciel",
      },
    ],
    fonte: GALERIA,
  },
  {
    nome: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    mandatos: [
      {
        inicio: "2003-01-01",
        fim: "2006-12-31",
        eleicao: 2002,
        partido: "PT",
        vice: "José Alencar",
      },
      {
        inicio: "2007-01-01",
        fim: "2010-12-31",
        eleicao: 2006,
        partido: "PT",
        vice: "José Alencar",
      },
      {
        inicio: "2023-01-01",
        eleicao: 2022,
        partido: "PT",
        vice: "Geraldo Alckmin",
        observacao: "Em exercício; mandato iniciado em 01/01/2023.",
      },
    ],
    fonte: BIO_ATUAL,
  },
  {
    nome: "DILMA ROUSSEFF",
    aliases: ["DILMA VANA ROUSSEFF"],
    nascimento: "1947-12-14",
    mandatos: [
      {
        inicio: "2011-01-01",
        fim: "2014-12-31",
        eleicao: 2010,
        partido: "PT",
        vice: "Michel Temer",
      },
      {
        inicio: "2015-01-01",
        fim: "2016-08-31",
        eleicao: 2014,
        partido: "PT",
        vice: "Michel Temer",
        observacao:
          "Mandato encerrado por decisão do Senado no processo de impeachment (31/08/2016).",
      },
    ],
    fonte: GALERIA,
  },
  {
    nome: "MICHEL TEMER",
    aliases: ["MICHEL MIGUEL ELIAS TEMER LULIA"],
    nascimento: "1940-09-23",
    mandatos: [
      {
        inicio: "2016-08-31",
        fim: "2018-12-31",
        partido: "MDB",
        observacao:
          "Assumiu como vice-presidente após o afastamento de Dilma; exercício interino desde 12/05/2016.",
      },
    ],
    fonte: GALERIA,
  },
  {
    nome: "JAIR BOLSONARO",
    aliases: ["JAIR MESSIAS BOLSONARO"],
    nascimento: "1955-03-21",
    mandatos: [
      {
        inicio: "2019-01-01",
        fim: "2022-12-31",
        eleicao: 2018,
        partido: "PL",
        vice: "Hamilton Mourão",
      },
    ],
    fonte: GALERIA,
  },
];
