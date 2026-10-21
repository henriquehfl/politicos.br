# Políticos.BR

Plataforma para explorar a política brasileira com **dados abertos oficiais**: linha do tempo do país, perfis completos de deputados e senadores (em exercício e históricos), votações, proposições, discursos, despesas de cota parlamentar e links de mídia.

## Destaques

- **Busca instantânea** em um índice local com ~4.100 parlamentares (deputados e senadores, ativos e históricos, da 48ª legislatura em diante), com apelidos (`lula`, `dilma`, `fhc`), partido/UF, iniciais e destaque de correspondência.
- **Listagens completas** em `/politicos` (Câmara + Senado), `/deputados` e `/senadores`, com filtros por Casa (na visão unificada) e situação, busca por nome, UF, partido ou cargo, fotos oficiais e carregamento incremental.
- **Resultado eleitoral oficial**: no perfil, votos, percentual, turno e situação (eleito, suplente, não eleito ou 2º turno) da eleição geral de 2026, com link para o TSE.
- **Apuração em tempo real**: em `/apuracao`, totalização oficial do TSE por UF e cargo (governador, senador, deputado federal e estadual/distrital), com seções apuradas, comparecimento, abstenções, votos válidos e ranking de candidatos, atualizada automaticamente.
- **Notícias por parlamentar**: no painel lateral de cada perfil, manchetes recentes com veículo, data e link para a matéria original, atualizadas automaticamente a cada 10 minutos.
- **Dossiês** com biografia, redes oficiais, atividade parlamentar, comissões, frentes, profissões, mandatos, CEAP, polêmicas e links para notícias e vídeos.
- **Perfis em streaming**: cabeçalho, painel e notícias aparecem com a ficha básica; discursos, votações, despesas e a linha do tempo completa chegam em segundo plano, sem bloquear a primeira pintura. A timeline é revelada em lotes de 30 eventos para carreiras longas.
- **Fatos com fonte rastreável**: cada evento curado pode trazer citação literal, tipo de fonte (vídeo, notícia, post ou documento), veículo, data e link direto compartilhável para o evento.
- **Painel lateral** com foto, trajetória, resultado eleitoral e fontes, aberto automaticamente no desktop e recolhido no mobile.
- **Linha do tempo do Brasil** com 47 marcos (1988–2026), datas, protagonistas e fontes.
- Interface em **Next.js 16 + React 19**, CSS Modules e ícones [Lucide](https://lucide.dev/), com animações e suporte a `prefers-reduced-motion`.

## Fontes de dados

| Fonte | Uso |
| --- | --- |
| [Câmara dos Deputados – Dados Abertos](https://dadosabertos.camara.leg.br/) | Deputados, proposições, votações, discursos, frentes, ocupações e CEAP |
| [Senado Federal – Dados Abertos](https://legis.senado.leg.br/dadosabertos/) | Senadores, mandatos, filiações, autorias, relatorias, cargos, lideranças, discursos e votações |
| [TSE](https://www.tse.jus.br/) | Resultados e apuração da eleição de 2026 por UF/cargo: votos, percentual, situação, seções apuradas, comparecimento e abstenções; contexto eleitoral na linha do tempo |
| [STF](https://portal.stf.jus.br/) · [TCU](https://portal.tcu.gov.br/) | Contexto judicial e de auditoria na linha do tempo |
| [Portal da Transparência](https://portaldatransparencia.gov.br/) · [Planalto](https://www.gov.br/planalto/) | Dados orçamentários e textos legais |
| [Google Notícias](https://news.google.com/) | Manchetes recentes por parlamentar via feed RSS de busca e atalhos para a busca completa |

> O projeto consome apenas APIs e feeds públicos e não faz scraping de páginas. TikTok, Instagram e X não oferecem API pública por parlamentar, então esses botões abrem buscas públicas.

> As notícias exibem somente manchete, veículo, data e link; o texto completo permanece no site do veículo. O feed de busca do Google Notícias é adequado para uso pessoal/não comercial. Para uso comercial, configure um provedor de notícias licenciado antes do deploy.

> A plataforma é descritiva e imparcial: **não classifica nem emite juízo de valor** sobre parlamentares. Indicadores são apenas contagens e resultados oficiais, sempre com a fonte original.

> Fatos que não estão nas APIs do Congresso (prisões, condenações, cassações, declarações e publicações em redes sociais) ficam em `src/data/fatos-politicos.ts`, com data e fonte por item. Como o X/Twitter não tem API pública por parlamentar, essas publicações são curadas manualmente e não coletadas em tempo real. A cobertura de campanha segue a mesma regra: é datada, revisada e sempre aponta para o vídeo, notícia ou publicação original — não é um feed ao vivo.

## Atualização automática

| Conteúdo | Como atualiza | Intervalo |
| --- | --- | --- |
| Apuração do TSE (`/apuracao`) | Polling no navegador, pausado com a aba em segundo plano | 30 s |
| Notícias do parlamentar | Polling do painel + cache do servidor | 10 min |
| Votações (`/votacoes`) | `router.refresh()` + cache de dados do Next | 5 min |
| Dossiês de deputados e senadores | `router.refresh()` + cache `use cache` | 15 min |
| Índice de políticos | Revalidação em segundo plano no navegador | 1 h |
| Linha do tempo do Brasil e fatos curados | Só mudam com edição do código e novo deploy | — |

> A plataforma não raspa redes sociais. X/Twitter, Instagram e TikTok continuam como links de busca ou perfis oficiais; “fofocas” e fatos fora das APIs permanecem curados em `src/data/fatos-politicos.ts`, com data e fonte.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Para produção:

```bash
npm run build
npm start
```

Para acompanhar o 2º turno, defina o código da eleição publicado pelo TSE e o turno no ambiente:

```bash
TSE_ELEICAO="codigo-publicado-pelo-tse" TSE_TURNO=2 npm start
```

Opcionalmente, `TSE_DATA_ELEICAO=AAAA-MM-DD` ajusta a data exibida na fonte. Sem essas variáveis, a apuração usa o 1º turno (código 6259).

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Linha do tempo do Brasil e busca |
| `/deputados` · `/deputados/[id]` | Lista e dossiê de deputados |
| `/senadores` · `/senadores/[id]` | Lista e dossiê de senadores |
| `/apuracao` | Apuração oficial do TSE por UF e cargo |
| `/votacoes` | Painel de votações |
| `/api/politicos` | Índice agregado (Câmara + Senado) |
| `/api/apuracao?uf=SP&cargo=governador` | Snapshot da apuração oficial do TSE |
| `/api/noticias?nome=&cargo=deputado` | Manchetes recentes do parlamentar |
| `/api/search?q=` | Busca server-side (fallback do índice local) |
| `/api/deputado/[id]` · `/api/senador/[id]` | Dossiês normalizados |

## Arquitetura

```
src/
  app/                 rotas (App Router) e APIs
  components/          UI (busca, diretório, painel, timeline)
  data/                linha do tempo
  lib/
    api/               clientes Câmara/Senado/TSE, cache e normalização
    noticias.ts        busca e parsing do RSS de notícias por parlamentar
    atualizacao.ts     intervalos de polling/cache compartilhados
    politicos-index.ts índice compacto (máscara de legislaturas)
    search-index.ts    ordenação por relevância e busca local
    politicos-client.ts cache no navegador
```

- O índice é gerado no servidor, cacheado por dia e enviado de forma compacta; no navegador fica em `sessionStorage` por 1h e é revalidado em segundo plano.
- Requisições em voo são deduplicadas e repetidas em caso de falha transitória.
- A página de perfil usa uma ficha-base rápida e transmite o dossiê pesado em boundaries de `Suspense` independentes (contadores, painel e timeline). A timeline renderiza 30 eventos por lote, com carregamento automático ao rolar.
- Dossiês usam cache de 10 min no servidor e degradam com elegância quando uma fonte está indisponível.
- Notícias usam cache de 5 min no servidor, polling de 10 min no painel e mantêm a última lista quando o feed falha.

## Limitações

- A cobertura histórica começa na 48ª legislatura (1987).
- A ficha básica do perfil aparece imediatamente; o dossiê completo (votações nominais, discursos e despesas) pode levar alguns segundos na primeira carga e depois é servido por cache. Em carreiras longas, a timeline continua chegando em lotes.
- Dados de redes sociais são links oficiais ou buscas públicas, não conteúdo raspado.
- A busca de notícias é por nome + cargo; homônimos podem aparecer e parlamentares com pouca cobertura podem não ter manchetes recentes. Cada card sempre leva ao veículo original.
- O feed do Google Notícias é usado para manchetes e links. Para uso comercial, troque por um provedor licenciado (a rota `/api/noticias` centraliza essa integração).
- O bloco eleitoral cobre a eleição geral de 2026. Quando não há candidatura registrada, o perfil informa a ausência e aponta a consulta oficial; falhas do TSE aparecem como indisponibilidade, nunca como ausência de candidatura.
- A apuração por UF usa os arquivos oficiais do TSE para governador, senador, deputado federal e deputado estadual/distrital. O conjunto consultado não publica a disputa presidencial por UF. A atualização depende da publicação do TSE e pode levar cerca de um minuto.

## Deploy

Compatível com [Vercel](https://vercel.com/new) ou qualquer host Node.js. Nenhuma variável de ambiente é obrigatória.
