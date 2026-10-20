# Políticos.BR

Plataforma para explorar a política brasileira com **dados abertos oficiais**: linha do tempo do país, perfis completos de deputados e senadores (em exercício e históricos), votações, proposições, discursos, despesas de cota parlamentar e links de mídia.

## Destaques

- **Busca instantânea** em um índice local com ~4.100 parlamentares (deputados e senadores, ativos e históricos, da 48ª legislatura em diante), com apelidos (`lula`, `dilma`, `fhc`), partido/UF, iniciais e destaque de correspondência.
- **Listagens completas** em `/politicos` (Câmara + Senado), `/deputados` e `/senadores`, com filtros por Casa (na visão unificada) e situação, busca por nome, UF, partido ou cargo, fotos oficiais e carregamento incremental.
- **Ranking transparente** com até 50 parlamentares, nota de 0 a 100 por pronunciamentos e comissões ativas, decomposição por critério e fórmula aberta em `/ranking`.
- **Dossiês** com biografia, redes oficiais, atividade parlamentar, comissões, frentes, profissões, mandatos, CEAP, polêmicas e links para notícias e vídeos.
- **Fatos com fonte rastreável**: cada evento curado pode trazer citação literal, tipo de fonte (vídeo, notícia, post ou documento), veículo, data e link direto compartilhável para o evento.
- **Painel lateral** com foto, score de transparência e fontes, aberto automaticamente no desktop e recolhido no mobile.
- **Linha do tempo do Brasil** com 47 marcos (1988–2026), datas, protagonistas e fontes.
- Interface em **Next.js 16 + React 19**, CSS Modules e ícones [Lucide](https://lucide.dev/), com animações e suporte a `prefers-reduced-motion`.

## Fontes de dados

| Fonte | Uso |
| --- | --- |
| [Câmara dos Deputados – Dados Abertos](https://dadosabertos.camara.leg.br/) | Deputados, proposições, votações, discursos, frentes, ocupações e CEAP |
| [Senado Federal – Dados Abertos](https://legis.senado.leg.br/dadosabertos/) | Senadores, mandatos, filiações, autorias, relatorias, cargos, lideranças, discursos e votações |
| [TSE](https://www.tse.jus.br/) · [STF](https://portal.stf.jus.br/) · [TCU](https://portal.tcu.gov.br/) | Contexto eleitoral, judicial e de auditoria na linha do tempo |
| [Portal da Transparência](https://portaldatransparencia.gov.br/) · [Planalto](https://www.gov.br/planalto/) | Dados orçamentários e textos legais |
| [Google Notícias](https://news.google.com/) | Atalhos de pesquisa para notícias e polêmicas |

> O projeto consome apenas APIs públicas e não faz scraping. TikTok, Instagram e X não oferecem API pública por parlamentar, então esses botões abrem buscas públicas.

> Fatos que não estão nas APIs do Congresso (prisões, condenações, cassações, declarações e publicações em redes sociais) ficam em `src/data/fatos-politicos.ts`, com data e fonte por item. Como o X/Twitter não tem API pública por parlamentar, essas publicações são curadas manualmente e não coletadas em tempo real. A cobertura de campanha segue a mesma regra: é datada, revisada e sempre aponta para o vídeo, notícia ou publicação original — não é um feed ao vivo.

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

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Linha do tempo do Brasil e busca |
| `/deputados` · `/deputados/[id]` | Lista e dossiê de deputados |
| `/senadores` · `/senadores/[id]` | Lista e dossiê de senadores |
| `/ranking` | Ranking de transparência |
| `/votacoes` | Painel de votações |
| `/api/politicos` | Índice agregado (Câmara + Senado) |
| `/api/search?q=` | Busca server-side (fallback do índice local) |
| `/api/deputado/[id]` · `/api/senador/[id]` | Dossiês normalizados |

## Arquitetura

```
src/
  app/                 rotas (App Router) e APIs
  components/          UI (busca, diretório, painel, timeline)
  data/                linha do tempo
  lib/
    api/               clientes Câmara/Senado, cache e normalização
    politicos-index.ts índice compacto (máscara de legislaturas)
    search-index.ts    ranking e busca local
    politicos-client.ts cache no navegador
```

- O índice é gerado no servidor, cacheado por dia e enviado de forma compacta; no navegador fica em `sessionStorage` por 1h.
- Requisições em voo são deduplicadas e repetidas em caso de falha transitória.
- Dossiês usam cache curto e degradam com elegância quando uma fonte está indisponível.

## Limitações

- A cobertura histórica começa na 48ª legislatura (1987).
- A primeira carga de um dossiê muito extenso pode levar alguns segundos (coleta de votações nominais); depois é servida por cache.
- Dados de redes sociais são links oficiais ou buscas públicas, não conteúdo raspado.

## Deploy

Compatível com [Vercel](https://vercel.com/new) ou qualquer host Node.js. Nenhuma variável de ambiente é obrigatória.
