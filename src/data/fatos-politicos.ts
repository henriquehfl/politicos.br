import type {
  CitacaoEvento,
  FonteDados,
  TimelineCategory,
} from "@/lib/types";

/**
 * Fatos históricos curados que não existem nas APIs do Congresso.
 *
 * A Câmara e o Senado cobrem mandato, votações e pronunciamentos. Prisões,
 * condenações, cassações, declarações e publicações em redes sociais precisam
 * de curadoria com fonte. O catálogo é indexado pelo nome oficial da pessoa
 * (o mesmo de `src/data/presidentes.ts`) e é aplicado a qualquer perfil que
 * corresponda ao nome — não há regra específica para um político.
 *
 * Regras de curadoria:
 * - data no formato AAAA-MM-DD;
 * - texto factual, sem adjetivos de opinião;
 * - ao menos uma fonte oficial ou jornalística verificável;
 * - `polemico: true` apenas para falas/posts que geraram repercussão pública.
 */
export type TipoFatoPolitico =
  | "judicial"
  | "declaracao"
  | "rede-social"
  | "governo"
  | "eleicao"
  | "mandato";

export interface FatoPolitico {
  id: string;
  /** Nome oficial usado no perfil da Câmara/Senado. */
  pessoa: string;
  /** Nomes alternativos; exigem data de nascimento compatível. */
  aliases?: string[];
  nascimento?: string;
  data: string;
  titulo: string;
  resumo: string;
  detalhe: string;
  categoria: TimelineCategory;
  impacto?: "positivo" | "alerta" | "critico";
  tipo: TipoFatoPolitico;
  /** Marca falas/posts com repercussão pública e tom de embate. */
  polemico?: boolean;
  /** Trecho literal da fala/publicação, quando houver. */
  citacao?: CitacaoEvento;
  fontes: FonteDados[];
}

const STF: FonteDados = {
  label: "STF — notícias",
  href: "https://portal.stf.jus.br/noticias/",
};

const TSE: FonteDados = {
  label: "TSE — notícias",
  href: "https://www.tse.jus.br/comunicacao/noticias",
};

const CAMARA: FonteDados = {
  label: "Câmara dos Deputados",
  href: "https://www.camara.leg.br/",
};

const SENADO: FonteDados = {
  label: "Senado Federal",
  href: "https://www12.senado.leg.br/noticias",
};

const PLANALTO: FonteDados = {
  label: "Planalto — Galeria de presidentes",
  href: "https://www2.planalto.gov.br/acervo/galeria-de-presidentes/biografias-dos-ex-presidentes",
};

const MPF: FonteDados = {
  label: "MPF — Lava Jato",
  href: "https://www.mpf.mp.br/",
};

const TRF4: FonteDados = {
  label: "TRF-4 — notícias",
  href: "https://www.trf4.jus.br/trf4/controlador.php?acao=noticia",
};

const BCB: FonteDados = {
  label: "Banco Central — histórico",
  href: "https://www.bcb.gov.br/",
};

export const FATOS_POLITICOS: FatoPolitico[] = [
  /* ------------------------------- Sarney ------------------------------- */
  {
    id: "sarney-plano-cruzado",
    pessoa: "JOSÉ SARNEY",
    aliases: ["JOSÉ RIBAMAR FERREIRA DE ARAÚJO COSTA"],
    nascimento: "1930-04-24",
    data: "1986-02-28",
    titulo: "Plano Cruzado",
    resumo: "Congelamento de preços e criação do cruzado.",
    detalhe:
      "O governo Sarney lançou o Plano Cruzado em 28/02/1986, com congelamento de preços, salários e câmbio e a substituição do cruzeiro pelo cruzado. O plano conteve a inflação no curto prazo, mas perdeu sustentação ao longo do ano.",
    categoria: "financas",
    impacto: "alerta",
    tipo: "governo",
    fontes: [BCB],
  },
  {
    id: "sarney-moratoria",
    pessoa: "JOSÉ SARNEY",
    aliases: ["JOSÉ RIBAMAR FERREIRA DE ARAÚJO COSTA"],
    nascimento: "1930-04-24",
    data: "1987-02-20",
    titulo: "Moratória da dívida externa",
    resumo: "Suspensão temporária do pagamento de juros a credores privados.",
    detalhe:
      "Em 20/02/1987, o governo anunciou a suspensão do pagamento de juros da dívida externa a bancos privados. A medida foi apresentada como defesa das reservas e teve efeitos duradouros na credibilidade externa do país.",
    categoria: "financas",
    impacto: "critico",
    tipo: "governo",
    fontes: [BCB, PLANALTO],
  },
  {
    id: "sarney-constituinte",
    pessoa: "JOSÉ SARNEY",
    aliases: ["JOSÉ RIBAMAR FERREIRA DE ARAÚJO COSTA"],
    nascimento: "1930-04-24",
    data: "1987-02-01",
    titulo: "Instalação da Assembleia Constituinte",
    resumo: "Congresso assume a tarefa de redigir a nova Constituição.",
    detalhe:
      "A Assembleia Nacional Constituinte foi instalada em 01/02/1987, com os parlamentares eleitos em 1986. Os trabalhos duraram cerca de 20 meses e resultaram na Constituição de 1988.",
    categoria: "historico",
    impacto: "positivo",
    tipo: "governo",
    fontes: [CAMARA],
  },
  {
    id: "sarney-constituicao",
    pessoa: "JOSÉ SARNEY",
    aliases: ["JOSÉ RIBAMAR FERREIRA DE ARAÚJO COSTA"],
    nascimento: "1930-04-24",
    data: "1988-10-05",
    titulo: "Promulgação da Constituição de 1988",
    resumo: "Nova Constituição amplia direitos sociais e reorganiza o Estado.",
    detalhe:
      "A Constituição Cidadã foi promulgada em 05/10/1988. O texto consolidou direitos sociais, eleições diretas em todos os níveis e um novo desenho federativo, com regras de transição para a ordem econômica.",
    categoria: "historico",
    impacto: "positivo",
    tipo: "governo",
    fontes: [
      {
        label: "Constituição de 1988 (Planalto)",
        href: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
      },
    ],
  },

  /* ------------------------------- Collor ------------------------------- */
  {
    id: "collor-afastamento",
    pessoa: "FERNANDO COLLOR",
    aliases: ["FERNANDO AFONSO COLLOR DE MELLO"],
    nascimento: "1949-08-12",
    data: "1992-10-02",
    titulo: "Afastamento pelo Senado",
    resumo: "Senado afasta Collor durante o processo de impeachment.",
    detalhe:
      "Em 02/10/1992, o Senado aprovou o afastamento de Fernando Collor do exercício da Presidência para responder ao processo por crime de responsabilidade. Itamar Franco assumiu interinamente.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [SENADO],
  },
  {
    id: "collor-renuncia",
    pessoa: "FERNANDO COLLOR",
    aliases: ["FERNANDO AFONSO COLLOR DE MELLO"],
    nascimento: "1949-08-12",
    data: "1992-12-29",
    titulo: "Renúncia durante o impeachment",
    resumo: "Collor renuncia antes da conclusão do julgamento no Senado.",
    detalhe:
      "Fernando Collor renunciou à Presidência em 29/12/1992, no mesmo dia em que o Senado concluiu o julgamento do impeachment. A Casa reconheceu a perda do cargo e aplicou a pena de inabilitação política por oito anos.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [SENADO],
  },

  /* ------------------------------- Itamar ------------------------------- */
  {
    id: "itamar-interino",
    pessoa: "ITAMAR FRANCO",
    aliases: ["ITAMAR AUGUSTO CAUTIERO FRANCO"],
    nascimento: "1930-06-28",
    data: "1992-10-02",
    titulo: "Exercício interino da Presidência",
    resumo: "Vice assume interinamente após o afastamento de Collor.",
    detalhe:
      "Itamar Franco assumiu interinamente a Presidência em 02/10/1992, após o afastamento de Fernando Collor pelo Senado. Com a renúncia do titular, passou ao exercício definitivo em 29/12/1992.",
    categoria: "mandato",
    impacto: "alerta",
    tipo: "mandato",
    fontes: [PLANALTO],
  },

  /* --------------------------- Fernando Henrique ------------------------ */
  {
    id: "fhc-reeleicao",
    pessoa: "FERNANDO HENRIQUE CARDOSO",
    nascimento: "1931-06-18",
    data: "1998-10-04",
    titulo: "Reeleição de Fernando Henrique Cardoso",
    resumo: "Primeiro presidente reeleito no novo regime democrático.",
    detalhe:
      "Fernando Henrique Cardoso foi reeleito em primeiro turno em 04/10/1998, beneficiado pela estabilidade do real e pela emenda constitucional que permitiu a reeleição para cargos executivos.",
    categoria: "eleicao",
    impacto: "alerta",
    tipo: "eleicao",
    fontes: [TSE],
  },

  /* -------------------------------- Lula -------------------------------- */
  {
    id: "lula-conducao-coercitiva",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2016-03-04",
    titulo: "Condução coercitiva na Lava Jato",
    resumo: "Lula é levado a depor na 24ª fase da Operação Lava Jato.",
    detalhe:
      "Em 04/03/2016, a Polícia Federal cumpriu mandado de condução coercitiva contra Lula no âmbito da 24ª fase da Lava Jato. A medida gerou repercussão política e questionamentos jurídicos.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [MPF],
  },
  {
    id: "lula-condenacao-moro",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2017-07-12",
    titulo: "Condenação em primeira instância",
    resumo: "Moro condena Lula no caso do triplex em Guarujá.",
    detalhe:
      "Em 12/07/2017, o então juiz Sergio Moro condenou Lula por corrupção passiva e lavagem de dinheiro no caso do triplex em Guarujá. A sentença foi confirmada e ampliada pelo TRF-4 em janeiro de 2018.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [MPF],
  },
  {
    id: "lula-trf4",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2018-01-24",
    titulo: "Condenação confirmada pelo TRF-4",
    resumo: "Tribunal mantém a condenação e aumenta a pena.",
    detalhe:
      "Em 24/01/2018, a 8ª Turma do TRF-4 negou provimento ao recurso de Lula, confirmou a condenação por corrupção e lavagem de dinheiro e elevou a pena. A decisão abriu caminho para a prisão após o esgotamento de recursos.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [TRF4],
  },
  {
    id: "lula-prisao",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2018-04-07",
    titulo: "Prisão de Lula",
    resumo: "Ex-presidente se entrega à Polícia Federal em Curitiba.",
    detalhe:
      "Em 07/04/2018, Lula se entregou à Polícia Federal em Curitiba após a ordem de prisão expedida por Sergio Moro. Ele permaneceu preso por 580 dias, até a decisão do STF que considerou inconstitucional a prisão após condenação em segunda instância.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [MPF, TRF4],
  },
  {
    id: "lula-candidatura-indeferida",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2018-08-31",
    titulo: "Candidatura indeferida pelo TSE",
    resumo: "TSE barra a candidatura de Lula com base na Lei da Ficha Limpa.",
    detalhe:
      "Em 31/08/2018, o TSE indeferiu o registro da candidatura de Lula à Presidência por maioria de votos, aplicando a Lei da Ficha Limpa em razão da condenação confirmada pelo TRF-4. O PT substituiu a candidatura por Fernando Haddad.",
    categoria: "eleicao",
    impacto: "critico",
    tipo: "judicial",
    fontes: [TSE],
  },
  {
    id: "lula-soltura",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2019-11-08",
    titulo: "Soltura de Lula",
    resumo: "STF derruba a prisão em segunda instância e Lula deixa a cadeia.",
    detalhe:
      "Em 08/11/2019, Lula foi solto após o STF decidir que a prisão após condenação em segunda instância era inconstitucional. Ele havia completado 580 dias de prisão em Curitiba.",
    categoria: "auditoria",
    impacto: "positivo",
    tipo: "judicial",
    fontes: [STF],
  },
  {
    id: "lula-anulacao",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2021-03-08",
    titulo: "Anulação das condenações pelo STF",
    resumo: "Fachin anula as condenações da Lava Jato e restitui direitos políticos.",
    detalhe:
      "Em 08/03/2021, o ministro Edson Fachin anulou as condenações de Lula na Lava Jato por incompetência da 13ª Vara Federal de Curitiba. A decisão foi referendada pelo plenário do STF e restituiu os direitos políticos de Lula.",
    categoria: "auditoria",
    impacto: "positivo",
    tipo: "judicial",
    fontes: [STF],
  },
  {
    id: "lula-rede-social-2022",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2022-10-30",
    titulo: "Publicação após a vitória eleitoral",
    resumo: "Lula celebra o resultado nas redes sociais e defende reconciliação.",
    detalhe:
      "Após a confirmação da vitória no segundo turno, Lula publicou mensagem em seus perfis oficiais sobre esperança, diálogo e reconstrução do país. A publicação integra a cobertura de redes sociais do período eleitoral.",
    categoria: "discurso",
    impacto: "positivo",
    tipo: "rede-social",
    polemico: false,
    fontes: [
      {
        label: "Perfil oficial de Lula no X",
        href: "https://x.com/LulaOficial",
      },
      TSE,
    ],
  },
  {
    id: "lula-candidatura-1989",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "1989-12-17",
    titulo: "Candidatura presidencial de 1989",
    resumo: "Lula chega ao segundo turno e perde para Fernando Collor.",
    detalhe:
      "Em 1989, primeira eleição direta para presidente após a ditadura, Lula foi ao segundo turno pelo PT e perdeu para Fernando Collor. A campanha marcou a entrada do PT na disputa presidencial em escala nacional.",
    categoria: "eleicao",
    impacto: "alerta",
    tipo: "eleicao",
    fontes: [TSE],
  },
  {
    id: "lula-candidatura-1994",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "1994-10-03",
    titulo: "Candidatura presidencial de 1994",
    resumo: "Lula disputa a Presidência e perde para FHC no primeiro turno.",
    detalhe:
      "Em 03/10/1994, Lula foi candidato à Presidência pelo PT e terminou em segundo lugar, atrás de Fernando Henrique Cardoso, eleito no primeiro turno. A eleição consolidou o Plano Real como principal tema da disputa.",
    categoria: "eleicao",
    impacto: "alerta",
    tipo: "eleicao",
    fontes: [TSE],
  },
  {
    id: "lula-candidatura-1998",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "1998-10-04",
    titulo: "Candidatura presidencial de 1998",
    resumo: "Lula disputa a Presidência pelo PT e perde para FHC no primeiro turno.",
    detalhe:
      "Em 04/10/1998, Lula foi candidato à Presidência pelo PT e terminou em segundo lugar, atrás de Fernando Henrique Cardoso, que foi reeleito no primeiro turno. Foi a terceira candidatura presidencial de Lula.",
    categoria: "eleicao",
    impacto: "alerta",
    tipo: "eleicao",
    fontes: [TSE],
  },
  {
    id: "lula-mensalao",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2005-06-06",
    titulo: "Escândalo do Mensalão",
    resumo: "Denúncia de compra de votos abre crise no primeiro mandato.",
    detalhe:
      "Em junho de 2005, a revelação de pagamentos a parlamentares em troca de apoio político abriu a CPI dos Correios e uma crise no governo Lula. O caso levou à cassação de mandatos, à condenação de dirigentes e ao julgamento da Ação Penal 470 pelo STF em 2012.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "governo",
    fontes: [CAMARA, STF],
  },

  {
    id: "lula-fala-toque-2026",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2026-09-28",
    titulo: "Fala sobre “tomar toque” em comício",
    resumo:
      "Declaração sobre exames de próstata repercute e vira disputa eleitoral.",
    detalhe:
      "Em 28/09/2026, durante comício em Belém (PA), Lula defendeu a prevenção ao câncer de próstata e afirmou que as mulheres aprendem a “tomar toque” desde pequenas, em referência a exames ginecológicos. A fala foi criticada pela oposição; a campanha petista disse que a comparação tratava de exames preventivos e acionou o TSE contra publicações do deputado Nikolas Ferreira (PL-MG).",
    categoria: "discurso",
    impacto: "critico",
    tipo: "declaracao",
    polemico: true,
    citacao: {
      texto:
        "As mulheres aprendem a tomar toque desde pequenas. O homem não, ele é cheio de trejeitos. Ele não sabe que, quando ele tiver câncer de próstata, vão dar muito toque nele.",
      autor: "Lula",
      contexto: "Comício em Belém (PA), 28/09/2026",
    },
    fontes: [
      {
        label: "Poder360 — fala e contexto",
        href: "https://www.poder360.com.br/poder-eleicoes-2026/assista-ao-video-de-lula-sobre-cancer-de-prostata-e-mulher-tomar-toque/",
        tipo: "noticia",
        veiculo: "Poder360",
        data: "2026-09-29",
      },
      {
        label: "Vídeo da fala",
        href: "https://www.youtube.com/watch?v=f94OsFSdh8o",
        tipo: "video",
        veiculo: "Poder360",
        data: "2026-09-29",
      },
    ],
  },

  {
    id: "lula-nikolas-janja-2026",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2026-09-29",
    titulo: "Lula chama Nikolas de “canalha”; Janja reage",
    resumo:
      "Em Salvador, Lula critica deputado por distorcer a fala sobre exames; primeira-dama sobe o tom.",
    detalhe:
      "Em 29/09/2026, em comício em Salvador (BA), Lula chamou o deputado Nikolas Ferreira (PL-MG) de “canalha” e disse que o parlamentar distorceu a declaração sobre exames preventivos. Janja Lula da Silva também reagiu ao deputado. A campanha de Lula acionou o TSE contra duas publicações de Nikolas sobre o tema e divulgou nota afirmando que a fala se referia a exames ginecológicos.",
    categoria: "discurso",
    impacto: "critico",
    tipo: "declaracao",
    polemico: true,
    fontes: [
      {
        label: "Poder360 — repercussão e nota da campanha",
        href: "https://www.poder360.com.br/poder-eleicoes-2026/lula-pede-que-janja-explique-fala-sobre-toque-e-critica-nikolas/",
        tipo: "noticia",
        veiculo: "Poder360",
        data: "2026-09-29",
      },
      {
        label: "O Globo — fala de Lula e reação de Janja",
        href: "https://oglobo.globo.com/politica/eleicoes-2026/noticia/2026/09/29/lula-chama-nikolas-de-canalha-por-explorar-fala-sobre-exame-ginecologico-e-janja-eleva-o-tom-pia-de-bosta.ghtml",
        tipo: "noticia",
        veiculo: "O Globo",
        data: "2026-09-29",
      },
      {
        label: "Vídeo — Janja responde a Nikolas",
        href: "https://www.youtube.com/watch?v=v3RNpxZvdGs",
        tipo: "video",
        veiculo: "Poder360",
        data: "2026-09-29",
      },
    ],
  },

  {
    id: "lula-debate-band-2026",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2026-10-18",
    titulo: "Primeiro debate do 2º turno com Flávio Bolsonaro",
    resumo:
      "Debate na Band tem acusações sobre SUS, Banco Master, INSS e sigilos.",
    detalhe:
      "Em 18/10/2026, Lula e Flávio Bolsonaro (PL) se enfrentaram no primeiro debate do segundo turno, na Band. O encontro teve acusações de corrupção, troca de ataques sobre investigações do Banco Master e fraudes no INSS, além de propostas econômicas. Lula questionou se o adversário pretendia privatizar o SUS e cobrou a abertura de sigilos bancário e telefônico.",
    categoria: "eleicao",
    impacto: "alerta",
    tipo: "eleicao",
    polemico: true,
    citacao: {
      texto: "Será que ele quer privatizar o SUS? É isso que eu entendi?",
      autor: "Lula",
      contexto: "Debate na Band, 18/10/2026",
    },
    fontes: [
      {
        label: "InfoMoney — resumo do debate",
        href: "https://www.infomoney.com.br/politica/debate-entre-lula-e-flavio-tem-ataques-acusacoes-e-propostas/",
        tipo: "noticia",
        veiculo: "InfoMoney",
        data: "2026-10-18",
      },
      {
        label: "Vídeo — íntegra do debate",
        href: "https://www.youtube.com/watch?v=X1fp4JzouvA",
        tipo: "video",
        veiculo: "BandNews FM",
        data: "2026-10-19",
      },
    ],
  },

  {
    id: "lula-meta-tse-2026",
    pessoa: "LUIZ INÁCIO LULA DA SILVA",
    aliases: ["LULA"],
    nascimento: "1945-10-27",
    data: "2026-10-19",
    titulo: "Campanha aciona TSE contra a Meta",
    resumo:
      "Coligação alega favorecimento a Flávio Bolsonaro e descumprimento de decisão judicial.",
    detalhe:
      "Em 19/10/2026, a campanha de Lula voltou a acionar o TSE alegando que a Meta descumpriu a ordem de garantir isonomia entre as candidaturas no segundo turno. A coligação afirmou que ferramentas de inteligência artificial e traduções automáticas seguiam favorecendo Flávio Bolsonaro e pediu o aumento da multa diária para R$ 1 milhão. As alegações constam da ação protocolada; o mérito cabe à Justiça Eleitoral.",
    categoria: "eleicao",
    impacto: "alerta",
    tipo: "eleicao",
    polemico: true,
    citacao: {
      texto:
        "A Meta não apenas mentiu para o Relator, em suas petições anteriores, como abertamente descumpriu o principal comando da ordem judicial originária [...]",
      autor: "Campanha de Lula, na ação ao TSE",
      contexto: "Trecho reproduzido pelo g1 em 19/10/2026",
    },
    fontes: [
      {
        label: "g1 — campanha aciona TSE contra a Meta",
        href: "https://g1.globo.com/politica/eleicoes/2026/noticia/2026/10/19/campanha-de-lula-volta-a-acionar-tse-e-diz-que-meta-continua-favorecendo-flavio-bolsonaro-nas-redes.ghtml",
        tipo: "noticia",
        veiculo: "g1",
        data: "2026-10-19",
      },
    ],
  },

  /* -------------------------------- Dilma ------------------------------- */
  {
    id: "dilma-afastamento",
    pessoa: "DILMA ROUSSEFF",
    aliases: ["DILMA VANA ROUSSEFF"],
    nascimento: "1947-12-14",
    data: "2016-05-12",
    titulo: "Afastamento pelo Senado",
    resumo: "Senado afasta Dilma para o julgamento do impeachment.",
    detalhe:
      "Em 12/05/2016, o Senado aprovou a abertura do processo de impeachment e afastou Dilma Rousseff do exercício da Presidência por até 180 dias. Michel Temer assumiu interinamente.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [SENADO],
  },

  /* -------------------------------- Temer ------------------------------- */
  {
    id: "temer-interino",
    pessoa: "MICHEL TEMER",
    aliases: ["MICHEL MIGUEL ELIAS TEMER LULIA"],
    nascimento: "1940-09-23",
    data: "2016-05-12",
    titulo: "Exercício interino da Presidência",
    resumo: "Vice assume interinamente durante o afastamento de Dilma.",
    detalhe:
      "Michel Temer assumiu interinamente a Presidência em 12/05/2016, após o afastamento de Dilma Rousseff pelo Senado. Com a conclusão do impeachment, passou ao exercício definitivo em 31/08/2016.",
    categoria: "mandato",
    impacto: "alerta",
    tipo: "mandato",
    fontes: [PLANALTO],
  },
  {
    id: "temer-denuncias",
    pessoa: "MICHEL TEMER",
    aliases: ["MICHEL MIGUEL ELIAS TEMER LULIA"],
    nascimento: "1940-09-23",
    data: "2017-10-25",
    titulo: "Câmara rejeita denúncias contra Temer",
    resumo: "Plenário barra as duas denúncias apresentadas naquele ano.",
    detalhe:
      "Em agosto e outubro de 2017, a Câmara rejeitou por votação nominal as denúncias contra Michel Temer relacionadas à delação da JBS. Com o arquivamento, o STF ficou impedido de processar o presidente durante o mandato.",
    categoria: "auditoria",
    impacto: "alerta",
    tipo: "judicial",
    fontes: [CAMARA, STF],
  },

  /* ------------------------------ Bolsonaro ----------------------------- */
  {
    id: "bolsonaro-fala-rosario",
    pessoa: "JAIR BOLSONARO",
    aliases: ["JAIR MESSIAS BOLSONARO"],
    nascimento: "1955-03-21",
    data: "2014-12-09",
    titulo: "Fala polêmica no plenário",
    resumo: "Declaração direcionada à deputada Maria do Rosário gera processo.",
    detalhe:
      "Em 09/12/2014, durante discurso no plenário da Câmara, Jair Bolsonaro dirigiu-se à deputada Maria do Rosário com uma declaração sobre estupro que gerou repercussão e levou a um processo por quebra de decoro. Em 2016, o STF aceitou denúncia por incitação ao crime.",
    categoria: "discurso",
    impacto: "alerta",
    tipo: "declaracao",
    polemico: true,
    fontes: [CAMARA, STF],
  },
  {
    id: "bolsonaro-video-ministerial",
    pessoa: "JAIR BOLSONARO",
    aliases: ["JAIR MESSIAS BOLSONARO"],
    nascimento: "1955-03-21",
    data: "2020-05-22",
    titulo: "Divulgação de vídeo de reunião ministerial",
    resumo: "Vídeo de reunião do governo é publicado após decisão do STF.",
    detalhe:
      "Em 22/05/2020, o governo divulgou o vídeo da reunião ministerial de 22/04/2020, em cumprimento a decisão do STF no inquérito que apurava suposta interferência na Polícia Federal. O conteúdo gerou repercussão e virou prova no processo.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "rede-social",
    polemico: true,
    fontes: [STF],
  },
  {
    id: "bolsonaro-urnas",
    pessoa: "JAIR BOLSONARO",
    aliases: ["JAIR MESSIAS BOLSONARO"],
    nascimento: "1955-03-21",
    data: "2022-07-18",
    titulo: "Ataques ao sistema eleitoral",
    resumo: "Reunião com embaixadores amplia questionamentos às urnas eletrônicas.",
    detalhe:
      "Em 18/07/2022, em reunião com embaixadores no Palácio da Alvorada, Bolsonaro repetiu questionamentos sem provas sobre a segurança das urnas eletrônicas. O TSE e entidades internacionais rebateram as alegações.",
    categoria: "discurso",
    impacto: "critico",
    tipo: "declaracao",
    polemico: true,
    fontes: [TSE],
  },
  {
    id: "bolsonaro-tse-inelegivel",
    pessoa: "JAIR BOLSONARO",
    aliases: ["JAIR MESSIAS BOLSONARO"],
    nascimento: "1955-03-21",
    data: "2023-06-30",
    titulo: "TSE declara Bolsonaro inelegível",
    resumo: "Ex-presidente fica inelegível por oito anos por abuso de poder.",
    detalhe:
      "Em 30/06/2023, o TSE declarou Jair Bolsonaro inelegível por oito anos por abuso de poder político e uso indevido dos meios de comunicação na reunião com embaixadores de 2022. A decisão o impediu de disputar eleições até 2030.",
    categoria: "auditoria",
    impacto: "critico",
    tipo: "judicial",
    fontes: [TSE],
  },
];
