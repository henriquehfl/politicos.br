import type { TimelineEvent } from "@/lib/types";

/** Ordem decrescente (mais recente primeiro) — aplicada no componente */
export const historicoBrasilEvents: TimelineEvent[] = [
  {
    id: "h-2026-eleicoes",
    year: 2026,
    date: "2026-10-04",
    title: "Eleições Gerais 2026",
    summary:
      "Renovação de toda a Câmara, de um terço do Senado e dos governos estaduais.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["TSE", "Partidos e federações", "Congresso Nacional"],
    detail:
      "Primeiro turno em 4 de outubro e segundo turno em 25 de outubro. A nova composição toma posse em 1º de fevereiro de 2027, com a legislatura 58ª e a definição das presidências da Câmara e do Senado.",
    sources: [
      {
        label: "Calendário eleitoral (TSE)",
        href: "https://www.tse.jus.br/eleitor/calendario-eleitoral",
      },
    ],
  },
  {
    id: "h-2025-stf-golpe",
    year: 2025,
    date: "2025-09-11",
    title: "STF condena a trama golpista",
    summary:
      "Primeira condenação de um ex-presidente por tentativa de golpe de Estado.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["STF", "Jair Bolsonaro", "Procuradoria-Geral da República"],
    detail:
      "A Primeira Turma do STF condenou o ex-presidente Jair Bolsonaro e aliados por crimes ligados à tentativa de golpe após as eleições de 2022, incluindo organização criminosa e tentativa de abolição violenta do Estado Democrático de Direito.",
    sources: [{ label: "STF — notícias", href: "https://portal.stf.jus.br/" }],
  },
  {
    id: "h-2025-cop30",
    year: 2025,
    date: "2025-11-10",
    title: "COP30 em Belém",
    summary:
      "Brasil sedia a conferência do clima e coloca a Amazônia no centro da agenda.",
    category: "historico",
    impact: "positivo",
    protagonists: ["Governo Federal", "ONU", "Sociedade civil"],
    detail:
      "A conferência reuniu chefes de Estado e negociadores em Belém (PA), com debates sobre financiamento climático, transição energética e proteção florestal.",
    sources: [{ label: "COP30", href: "https://cop30.br/" }],
  },
  {
    id: "h-2024-tributaria",
    year: 2024,
    date: "2024-12-20",
    title: "Regulamentação da reforma tributária",
    summary:
      "Congresso conclui as leis que criam CBS, IBS e o Imposto Seletivo.",
    category: "financas",
    impact: "positivo",
    protagonists: [
      "Congresso Nacional",
      "Ministério da Fazenda",
      "Comitê Gestor do IBS",
    ],
    detail:
      "O pacote regulamenta a EC 132/2023 e define as regras de transição do sistema de tributos sobre o consumo, com início de testes em 2026 e substituição gradual até 2033.",
    sources: [
      {
        label: "EC 132/2023 (Planalto)",
        href: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm",
      },
    ],
  },
  {
    id: "h-2024-municipais",
    year: 2024,
    date: "2024-10-06",
    title: "Eleições municipais",
    summary: "Pleito em mais de 5,5 mil municípios redefine forças para 2026.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["TSE", "Prefeitos", "Vereadores"],
    detail:
      "Primeiro turno em 6 de outubro, com segundo turno em 27 de outubro nas capitais e cidades com mais de 200 mil eleitores. O resultado serviu de termômetro para as alianças das eleições gerais de 2026.",
    sources: [{ label: "TSE — resultados", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-2023-8jan",
    year: 2023,
    date: "2023-01-08",
    title: "Atos de 8 de Janeiro",
    summary: "Invasão e depredação das sedes dos Três Poderes em Brasília.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["STF", "Governo Lula", "Polícia Federal"],
    detail:
      "Manifestantes contrários ao resultado das eleições invadiram o Congresso, o Palácio do Planalto e o STF. O inquérito identificou financiadores, articuladores e executores, com centenas de réus e condenações.",
    sources: [{ label: "STF — inquérito", href: "https://portal.stf.jus.br/" }],
  },
  {
    id: "h-2023-arcabouco",
    year: 2023,
    date: "2023-08-01",
    title: "Novo arcabouço fiscal",
    summary: "Regra de gastos substitui o teto criado em 2016.",
    category: "financas",
    impact: "alerta",
    protagonists: ["Ministério da Fazenda", "Câmara", "Senado"],
    detail:
      "A Lei Complementar 200/2023 limita o crescimento das despesas a 70% do crescimento real da receita, com bandas de resultado primário e mecanismos de ajuste.",
    sources: [
      {
        label: "LC 200/2023 (Planalto)",
        href: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp200.htm",
      },
    ],
  },
  {
    id: "h-2023-tributaria",
    year: 2023,
    date: "2023-12-20",
    title: "Reforma tributária promulgada",
    summary: "EC 132 unifica tributos sobre consumo em IVA dual.",
    category: "votacao",
    impact: "positivo",
    protagonists: ["Arthur Lira", "Rodrigo Pacheco", "Aguinaldo Ribeiro"],
    detail:
      "Depois de décadas de discussão, o Congresso promulgou a emenda que cria CBS (federal) e IBS (estados e municípios), além do Imposto Seletivo e de um regime específico para a Zona Franca de Manaus.",
    sources: [
      {
        label: "EC 132/2023 (Planalto)",
        href: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm",
      },
    ],
  },
  {
    id: "h-2022-rp9",
    year: 2022,
    date: "2022-12-19",
    title: "Fim do orçamento secreto (RP9)",
    summary: "STF declara inconstitucionais as emendas de relator.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["STF", "TCU", "Congresso Nacional"],
    detail:
      "O STF confirmou a inconstitucionalidade do modelo de emendas de relator, que concentrava bilhões sem critério público de distribuição. Os recursos migraram para emendas impositivas e de bancada.",
    sources: [
      { label: "STF — ADPF 850", href: "https://portal.stf.jus.br/" },
      { label: "TCU", href: "https://portal.tcu.gov.br/" },
    ],
  },
  {
    id: "h-2022-eleicoes",
    year: 2022,
    date: "2022-10-30",
    title: "Eleições presidenciais de 2022",
    summary: "Segundo turno entre Lula e Jair Bolsonaro.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["Lula", "Jair Bolsonaro", "TSE"],
    detail:
      "Lula venceu o segundo turno por margem estreita. A disputa foi marcada por ataques ao sistema eletrônico de votação e por contestação do resultado por apoiadores do então presidente.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },

  {
    id: "h-2021-cpi",
    year: 2021,
    date: "2021-04-27",
    title: "CPI da Covid",
    summary:
      "Comissão investiga a gestão federal da pandemia e desgasta o governo.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["Senado Federal", "Renan Calheiros", "Ministério da Saúde"],
    detail:
      "A CPI ouviu ministros, governadores e empresários, apontou omissões e recomendou indiciamentos. O relatório final foi enviado ao Ministério Público e virou base de investigações posteriores.",
    sources: [
      { label: "Relatório final (Senado)", href: "https://www12.senado.leg.br/" },
    ],
  },
  {
    id: "h-2021-precatorios",
    year: 2021,
    date: "2021-12-08",
    title: "PEC dos Precatórios",
    summary: "Mudança contábil abre espaço fiscal para o Auxílio Brasil em ano eleitoral.",
    category: "financas",
    impact: "alerta",
    protagonists: ["Câmara", "Senado", "Ministério da Economia"],
    detail:
      "A emenda alterou o cálculo do teto de gastos e parcelou precatórios, permitindo ampliar o programa social em 2022. Economistas apontaram perda de transparência nas contas públicas.",
    sources: [
      { label: "Câmara — PEC 23/2021", href: "https://www.camara.leg.br/" },
    ],
  },
  {
    id: "h-2020-pandemia",
    year: 2020,
    date: "2020-03-11",
    title: "Pandemia de Covid-19",
    summary:
      "Congresso aprova estado de calamidade e o maior pacote de auxílio emergencial da história.",
    category: "historico",
    impact: "critico",
    protagonists: ["OMS", "Congresso Nacional", "Governo Federal"],
    detail:
      "Com o reconhecimento da pandemia pela OMS, o Brasil decretou calamidade pública e aprovou o auxílio emergencial, além de transferências a estados e municípios. A crise sanitária matou mais de 700 mil pessoas no país.",
    sources: [
      { label: "Fiocruz", href: "https://portal.fiocruz.br/" },
      { label: "Congresso — calamidade", href: "https://www.camara.leg.br/" },
    ],
  },
  {
    id: "h-2020-stf-rp9",
    year: 2020,
    date: "2020-11-09",
    title: "STF suspende o orçamento secreto",
    summary: "Emenda de relator é barrada por falta de transparência.",
    category: "auditoria",
    impact: "alerta",
    protagonists: ["STF", "Rosa Weber", "Congresso Nacional"],
    detail:
      "A ministra Rosa Weber suspendeu a execução das emendas de relator (RP9), decisão referendada pelo plenário. O caso expôs bilhões distribuídos sem critério público.",
    sources: [
      { label: "STF — ADPF 850", href: "https://portal.stf.jus.br/" },
    ],
  },
  {
    id: "h-2019-previdencia",
    year: 2019,
    date: "2019-11-12",
    title: "Reforma da Previdência",
    summary: "EC 103 muda idade mínima e regras de aposentadoria.",
    category: "votacao",
    impact: "positivo",
    protagonists: ["Jair Bolsonaro", "Rodrigo Maia", "Paulo Guedes"],
    detail:
      "A emenda fixou idade mínima de 65 anos para homens e 62 para mulheres, com regras de transição e mudanças na aposentadoria rural e de servidores. Foi a maior reforma previdenciária desde 2003.",
    sources: [
      { label: "EC 103/2019 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm" },
    ],
  },
  {
    id: "h-2019-vaza-jato",
    year: 2019,
    date: "2019-06-09",
    title: "Vaza Jato",
    summary: "Mensagens vazadas colocam em xeque a imparcialidade da Lava Jato.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["The Intercept", "Sergio Moro", "STF"],
    detail:
      "Diálogos entre o então juiz Sergio Moro e procuradores foram publicados e levaram o STF a considerar que o juiz não foi imparcial no caso do triplex de Lula, abrindo caminho para a anulação de condenações.",
    sources: [
      { label: "STF — habeas corpus", href: "https://portal.stf.jus.br/" },
    ],
  },
  {
    id: "h-2018-intervencao",
    year: 2018,
    date: "2018-02-16",
    title: "Intervenção federal no Rio de Janeiro",
    summary: "Primeira intervenção federal na segurança pública desde 1988.",
    category: "historico",
    impact: "alerta",
    protagonists: ["Michel Temer", "Exército", "Governo do Rio"],
    detail:
      "O decreto colocou as forças de segurança do estado sob comando militar até o fim de 2018, com efeitos sobre a política estadual e o debate sobre segurança pública.",
    sources: [
      { label: "Planalto — decreto", href: "https://www.planalto.gov.br/" },
    ],
  },
  {
    id: "h-2018-eleicoes",
    year: 2018,
    date: "2018-10-28",
    title: "Eleição de Jair Bolsonaro",
    summary: "Campanha marcada por redes sociais e pela prisão de Lula.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["Jair Bolsonaro", "Fernando Haddad", "TSE"],
    detail:
      "Bolsonaro venceu o segundo turno contra Fernando Haddad. A eleição ocorreu após a prisão de Lula e a inelegibilidade do ex-presidente, em um ambiente de forte polarização.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-2018-lula",
    year: 2018,
    date: "2018-04-07",
    title: "Prisão de Lula",
    summary: "Ex-presidente se entrega após condenação na Lava Jato.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["Sergio Moro", "Lula", "TRF-4"],
    detail:
      "Lula foi preso em Curitiba após condenação por corrupção e lavagem de dinheiro no caso do triplex. As condenações foram anuladas pelo STF em 2021, por incompetência da 13ª Vara Federal.",
    sources: [
      { label: "STF — anulação", href: "https://portal.stf.jus.br/" },
    ],
  },

  {
    id: "h-2017-joesley",
    year: 2017,
    date: "2017-05-17",
    title: "Joesley Day",
    summary: "Gravação com Michel Temer abre crise política e nova denúncia.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["Michel Temer", "Joesley Batista", "STF"],
    detail:
      "A delação de executivos da JBS revelou gravações com o presidente e levou à abertura de inquérito e a duas denúncias na Câmara, ambas barradas por votação parlamentar.",
    sources: [{ label: "STF", href: "https://portal.stf.jus.br/" }],
  },
  {
    id: "h-2017-trabalhista",
    year: 2017,
    date: "2017-07-13",
    title: "Reforma trabalhista",
    summary: "CLT é alterada em pontos centrais de negociação e financiamento sindical.",
    category: "votacao",
    impact: "alerta",
    protagonists: ["Congresso Nacional", "Michel Temer", "Centrais sindicais"],
    detail:
      "A Lei 13.467/2017 flexibilizou jornada, intervalos e negociação coletiva, além de criar o trabalho intermitente. A reforma foi alvo de ações no STF.",
    sources: [
      { label: "Lei 13.467/2017 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm" },
    ],
  },
  {
    id: "h-2016-impeachment",
    year: 2016,
    date: "2016-08-31",
    title: "Impeachment de Dilma Rousseff",
    summary: "Senado afasta a presidenta por crime de responsabilidade.",
    category: "historico",
    impact: "critico",
    protagonists: ["Dilma Rousseff", "Michel Temer", "Senado Federal"],
    detail:
      "Após a aprovação na Câmara e o afastamento em maio, o Senado condenou Dilma por pedaladas fiscais e decretos de crédito, em um processo contestado por parte dos juristas.",
    sources: [
      { label: "Senado — processo", href: "https://www12.senado.leg.br/" },
    ],
  },
  {
    id: "h-2016-teto",
    year: 2016,
    date: "2016-12-15",
    title: "Teto de gastos (EC 95)",
    summary: "Despesas primárias ficam congeladas por até 20 anos.",
    category: "financas",
    impact: "alerta",
    protagonists: ["Michel Temer", "Congresso Nacional", "Equipe econômica"],
    detail:
      "A emenda limitou o crescimento das despesas primárias à inflação do ano anterior, regra que vigorou até ser substituída pelo arcabouço fiscal de 2023.",
    sources: [
      { label: "EC 95/2016 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc95.htm" },
    ],
  },
  {
    id: "h-2015-pedaladas",
    year: 2015,
    date: "2015-10-07",
    title: "Pedaladas fiscais e crise fiscal",
    summary: "TCU recomenda rejeição das contas de 2014 e abre caminho para o impeachment.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["TCU", "Dilma Rousseff", "Congresso Nacional"],
    detail:
      "O tribunal apontou atrasos em repasses a bancos públicos e recomendações de rejeição das contas, decisão que embasou o processo de impeachment.",
    sources: [{ label: "TCU", href: "https://portal.tcu.gov.br/" }],
  },
  {
    id: "h-2014-lava-jato",
    year: 2014,
    date: "2014-03-17",
    title: "Operação Lava Jato",
    summary: "Investigação sobre corrupção em contratos da Petrobras.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["MPF", "Sergio Moro", "Polícia Federal"],
    detail:
      "A operação revelou um esquema bilionário de propinas em contratos da Petrobras, com condenações de empresários e políticos, delações premiadas e desdobramentos por mais de uma década.",
    sources: [
      { label: "MPF — Lava Jato", href: "https://www.mpf.mp.br/" },
    ],
  },
  {
    id: "h-2014-eleicoes",
    year: 2014,
    date: "2014-10-26",
    title: "Reeleição de Dilma Rousseff",
    summary: "Segundo turno contra Aécio Neves em disputa apertada.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["Dilma Rousseff", "Aécio Neves", "TSE"],
    detail:
      "Dilma foi reeleita com cerca de 51,6% dos votos válidos. O resultado, combinado ao ajuste fiscal e à Lava Jato, abriu uma das maiores crises políticas do período democrático.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-2013-jornadas",
    year: 2013,
    date: "2013-06-17",
    title: "Jornadas de Junho",
    summary: "Protestos massivos por transporte, saúde e educação.",
    category: "historico",
    impact: "alerta",
    protagonists: ["Movimento Passe Livre", "Sociedade civil", "Governos"],
    detail:
      "Manifestações começaram contra o aumento das tarifas de ônibus e se espalharam pelo país, com pautas difusas e forte impacto na agenda política, incluindo a proposta de constituinte exclusiva para a reforma política.",
    sources: [
      { label: "Câmara — memoria", href: "https://www.camara.leg.br/" },
    ],
  },
  {
    id: "h-2012-mensalao",
    year: 2012,
    date: "2012-08-02",
    title: "Julgamento do Mensalão",
    summary: "STF condena dirigentes políticos e empresários do esquema.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["STF", "Joaquim Barbosa", "Petistas"],
    detail:
      "O Supremo julgou a Ação Penal 470, condenando figuras centrais do governo Lula por corrupção, lavagem de dinheiro e formação de quadrilha. Foi o primeiro grande julgamento penal transmitido em tempo real.",
    sources: [{ label: "STF — AP 470", href: "https://portal.stf.jus.br/" }],
  },
  {
    id: "h-2011-dilma",
    year: 2011,
    date: "2011-01-01",
    title: "Dilma assume a Presidência",
    summary: "Primeira mulher eleita presidenta do Brasil.",
    category: "eleicao",
    impact: "positivo",
    protagonists: ["Dilma Rousseff", "Lula", "PT"],
    detail:
      "Ex-ministra da Casa Civil, Dilma tomou posse após vencer José Serra no segundo turno de 2010, com foco em continuidade social e combate à miséria.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },

  {
    id: "h-2010-eleicoes",
    year: 2010,
    date: "2010-10-31",
    title: "Eleição de Dilma Rousseff",
    summary: "Sucessão de Lula e continuidade do ciclo petista.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["Dilma Rousseff", "José Serra", "TSE"],
    detail:
      "Dilma venceu José Serra no segundo turno com cerca de 56% dos votos válidos. No mesmo pleito, o Congresso renovou grande parte das bancadas e consolidou a força do PT no Senado.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-2010-ficha-limpa",
    year: 2010,
    date: "2010-06-04",
    title: "Lei da Ficha Limpa",
    summary: "Candidatos condenados por órgãos colegiados ficam inelegíveis.",
    category: "votacao",
    impact: "positivo",
    protagonists: ["Congresso Nacional", "MCCE", "TSE"],
    detail:
      "A Lei Complementar 135/2010 nasceu de iniciativa popular com mais de 1,6 milhão de assinaturas e alterou critérios de inelegibilidade, sendo aplicada a partir das eleições de 2012 após decisão do STF.",
    sources: [
      { label: "LC 135/2010 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm" },
    ],
  },
  {
    id: "h-2008-crise",
    year: 2008,
    date: "2008-09-15",
    title: "Crise financeira global",
    summary: "Quebra do Lehman Brothers atinge o Brasil e a política econômica.",
    category: "financas",
    impact: "critico",
    protagonists: ["Banco Central", "Governo Lula", "G20"],
    detail:
      "A crise mundial derrubou o comércio e o crédito. O governo respondeu com redução de juros, desonerações e ampliação do crédito público, preservando o emprego e a popularidade presidencial.",
    sources: [
      { label: "Banco Central", href: "https://www.bcb.gov.br/" },
    ],
  },
  {
    id: "h-2006-eleicoes",
    year: 2006,
    date: "2006-10-29",
    title: "Reeleição de Lula",
    summary: "Segundo mandato após o escândalo do mensalão.",
    category: "eleicao",
    impact: "alerta",
    protagonists: ["Lula", "Geraldo Alckmin", "TSE"],
    detail:
      "Lula venceu Geraldo Alckmin no segundo turno. A campanha foi marcada pelo mensalão e pelo dossiê dos aloprados, mas o crescimento econômico e os programas sociais sustentaram a reeleição.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-2005-mensalao",
    year: 2005,
    date: "2005-06-06",
    title: "Escândalo do Mensalão",
    summary: "Denúncia de compra de votos no Congresso abre a CPI dos Correios.",
    category: "auditoria",
    impact: "critico",
    protagonists: ["Roberto Jefferson", "CPI dos Correios", "STF"],
    detail:
      "A delação de Roberto Jefferson revelou pagamentos a parlamentares em troca de apoio. O caso derrubou dirigentes do governo, cassou mandatos e culminou na AP 470, julgada em 2012.",
    sources: [
      { label: "Câmara — CPI", href: "https://www.camara.leg.br/" },
    ],
  },
  {
    id: "h-2003-previdencia",
    year: 2003,
    date: "2003-12-19",
    title: "Reforma da Previdência",
    summary: "EC 41 muda regras dos servidores públicos e cria contribuição de inativos.",
    category: "votacao",
    impact: "alerta",
    protagonists: ["Lula", "Congresso Nacional", "Servidores públicos"],
    detail:
      "A primeira grande reforma do governo Lula enfrentou resistência de servidores e do próprio partido, mas foi aprovada com apoio do centrão e de parte da oposição.",
    sources: [
      { label: "EC 41/2003 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc41.htm" },
    ],
  },
  {
    id: "h-2003-bolsa-familia",
    year: 2003,
    date: "2003-10-20",
    title: "Criação do Bolsa Família",
    summary: "Programa unifica auxílios e se torna marca da política social brasileira.",
    category: "historico",
    impact: "positivo",
    protagonists: ["Lula", "Ministério do Desenvolvimento Social", "Municípios"],
    detail:
      "A Medida Provisória 132/2003 unificou programas de transferência de renda e condicionou o benefício à frequência escolar e à vacinação, modelo posteriormente replicado internacionalmente.",
    sources: [
      { label: "Lei 10.836/2004 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.836.htm" },
    ],
  },
  {
    id: "h-2002-eleicoes",
    year: 2002,
    date: "2002-10-27",
    title: "Eleição de Lula",
    summary: "Primeiro operário eleito presidente da República.",
    category: "eleicao",
    impact: "positivo",
    protagonists: ["Lula", "José Serra", "PT"],
    detail:
      "Lula venceu o segundo turno contra José Serra após três tentativas. A campanha combinou a Carta ao Povo Brasileiro com compromissos de estabilidade econômica e inclusão social.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-2000-lrf",
    year: 2000,
    date: "2000-05-04",
    title: "Lei de Responsabilidade Fiscal",
    summary: "Regras de disciplina fiscal para União, estados e municípios.",
    category: "financas",
    impact: "positivo",
    protagonists: ["Fernando Henrique Cardoso", "Congresso Nacional", "Tesouro"],
    detail:
      "A LC 101/2000 estabeleceu limites de gasto com pessoal, transparência das contas e punições para gestores, tornando-se referência de gestão fiscal no país.",
    sources: [
      { label: "LC 101/2000 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm" },
    ],
  },

  {
    id: "h-1999-cambio",
    year: 1999,
    date: "1999-01-13",
    title: "Desvalorização do real",
    summary: "Fim do câmbio controlado e adoção do regime de metas de inflação.",
    category: "financas",
    impact: "critico",
    protagonists: ["Banco Central", "Fernando Henrique Cardoso", "FMI"],
    detail:
      "Após a crise asiática e a fuga de capitais, o governo liberou o câmbio. O real se desvalorizou, o país adotou metas de inflação e cumpriu um ajuste fiscal acordado com o FMI.",
    sources: [
      { label: "Banco Central — histórico", href: "https://www.bcb.gov.br/" },
    ],
  },
  {
    id: "h-1997-reeleicao",
    year: 1997,
    date: "1997-06-04",
    title: "Emenda da Reeleição",
    summary: "EC 16 permite reeleição para presidentes, governadores e prefeitos.",
    category: "votacao",
    impact: "alerta",
    protagonists: ["Fernando Henrique Cardoso", "Congresso Nacional", "PMDB"],
    detail:
      "A emenda aprovou a reeleição para cargos executivos sem a exigência de desincompatibilização. A votação foi marcada por denúncias de compra de votos, investigadas posteriormente.",
    sources: [
      { label: "EC 16/1997 (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc16.htm" },
    ],
  },
  {
    id: "h-1994-real",
    year: 1994,
    date: "1994-07-01",
    title: "Plano Real",
    summary: "Nova moeda estabiliza a economia e elege Fernando Henrique.",
    category: "financas",
    impact: "positivo",
    protagonists: ["Fernando Henrique Cardoso", "Itamar Franco", "Pedro Malan"],
    detail:
      "O plano combinou ajuste fiscal, URV e a criação do real. A inflação caiu de forma abrupta, elevando o poder de compra e sustentando a eleição de FHC no mesmo ano.",
    sources: [
      { label: "Banco Central — Plano Real", href: "https://www.bcb.gov.br/" },
    ],
  },
  {
    id: "h-1994-eleicoes",
    year: 1994,
    date: "1994-10-03",
    title: "Eleição de Fernando Henrique Cardoso",
    summary: "Plano Real impulsiona vitória no primeiro turno.",
    category: "eleicao",
    impact: "positivo",
    protagonists: ["Fernando Henrique Cardoso", "Lula", "TSE"],
    detail:
      "FHC venceu no primeiro turno com ampla vantagem sobre Lula. A eleição consolidou o real como moeda e abriu o ciclo de privatizações e reformas liberais dos anos 1990.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-1993-plebiscito",
    year: 1993,
    date: "1993-04-21",
    title: "Plebiscito sobre a forma de governo",
    summary: "Brasileiros confirmam república e presidencialismo.",
    category: "eleicao",
    impact: "positivo",
    protagonists: ["TSE", "Congresso Nacional", "Sociedade civil"],
    detail:
      "O plebiscito previsto na Constituição de 1988 rejeitou a monarquia e o parlamentarismo. A consulta reforçou a legitimidade do presidencialismo, então recém-restaurado.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-1992-collor",
    year: 1992,
    date: "1992-09-29",
    title: "Impeachment de Collor",
    summary: "Primeiro presidente afastado por impeachment após a redemocratização.",
    category: "historico",
    impact: "critico",
    protagonists: ["Fernando Collor", "Itamar Franco", "Câmara dos Deputados"],
    detail:
      "As denúncias de corrupção envolvendo Paulo César Farias levaram a Câmara a aprovar o impeachment. Collor renunciou em dezembro, e o Senado manteve a condenação e a inelegibilidade.",
    sources: [
      { label: "Câmara — impeachment", href: "https://www.camara.leg.br/" },
    ],
  },
  {
    id: "h-1990-collor",
    year: 1990,
    date: "1990-03-16",
    title: "Plano Collor",
    summary: "Confisco de poupanças e retorno da inflação em patamar elevado.",
    category: "financas",
    impact: "critico",
    protagonists: ["Fernando Collor", "Zélia Cardoso de Mello", "Banco Central"],
    detail:
      "O plano bloqueou ativos financeiros e contas poupança por 18 meses, medida que gerou enorme reação social e não conteve a inflação. Foi o marco inicial de uma década de planos fracassados antes do real.",
    sources: [
      { label: "Banco Central — histórico", href: "https://www.bcb.gov.br/" },
    ],
  },
  {
    id: "h-1989-eleicoes",
    year: 1989,
    date: "1989-11-15",
    title: "Primeira eleição direta para presidente",
    summary: "Collor e Lula disputam o segundo turno.",
    category: "eleicao",
    impact: "positivo",
    protagonists: ["Fernando Collor", "Lula", "TSE"],
    detail:
      "Após 29 anos sem eleição direta para a Presidência, os brasileiros foram às urnas. Collor venceu Lula no segundo turno, em uma campanha marcada pela exposição midiática e pelo debate sobre a Constituinte.",
    sources: [{ label: "TSE", href: "https://www.tse.jus.br/" }],
  },
  {
    id: "h-1988-constituicao",
    year: 1988,
    date: "1988-10-05",
    title: "Constituição Cidadã",
    summary: "Promulgação da Carta de 1988 e marco da redemocratização.",
    category: "historico",
    impact: "positivo",
    protagonists: ["Ulysses Guimarães", "Assembleia Constituinte", "Sociedade civil"],
    detail:
      "A Constituição ampliou direitos sociais, restabeleceu eleições diretas, fortaleceu o federalismo e criou instrumentos de participação popular. Foi emendada dezenas de vezes desde então.",
    sources: [
      { label: "Constituição (Planalto)", href: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm" },
      { label: "Câmara — Constituinte", href: "https://www.camara.leg.br/" },
    ],
  },

];
