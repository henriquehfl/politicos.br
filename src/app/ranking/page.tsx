import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { getPoliticosIndex } from "@/lib/api/search";
import {
  contarDiscursosDeputado,
  getDeputadoComissoesAtivas,
} from "@/lib/api/camara";
import { getSenadorComissoes, getSenadorDiscursos } from "@/lib/api/senado";
import { FotoPolitico } from "@/components/FotoPolitico";
import { fotoOficial } from "@/lib/imagem";
import { anoInicioLegislatura, LEGISLATURA_ATUAL } from "@/lib/politicos-index";
import {
  contarComissoesAtivas,
  LIMITE_RANKING,
  POR_CASA,
  pontuarRanking,
  selecionarRecorte,
  type RankingBase,
} from "@/lib/ranking";
import styles from "./ranking.module.css";

export const metadata: Metadata = {
  title: "Ranking de participação — Câmara e Senado | POLITICOS.BR",
  description:
    "Ranking transparente de deputados federais e senadores por pronunciamentos e comissões ativas, com nota de 0 a 100 e a fórmula aberta.",
};

const PARALELO = 6;
const ANO_INICIO_SENADO = anoInicioLegislatura(LEGISLATURA_ATUAL);

/** Executa tarefas em lotes para não saturar as APIs da Câmara e do Senado. */
async function emLotes<T, R>(
  itens: T[],
  tamanho: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const saida: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    const lote = itens.slice(i, i + tamanho);
    saida.push(...(await Promise.all(lote.map(fn))));
  }
  return saida;
}

async function getRanking() {
  "use cache";
  cacheLife("hours");

  const index = await getPoliticosIndex();
  const recorte = selecionarRecorte(index, LIMITE_RANKING);

  const linhas = await emLotes(recorte, PARALELO, async (p) => {
    const base = {
      id: p.id,
      nome: p.nome,
      uf: p.uf,
      partido: p.partido,
      cargo: p.cargo,
      fotoUrl: p.fotoUrl,
    } satisfies Omit<RankingBase, "discursos" | "comissoes">;

    if (p.cargo === "deputado") {
      const [discursos, comissoes] = await Promise.all([
        contarDiscursosDeputado(p.id, LEGISLATURA_ATUAL).catch(() => 0),
        getDeputadoComissoesAtivas(p.id, LEGISLATURA_ATUAL).catch(() => []),
      ]);
      return {
        ...base,
        discursos,
        comissoes: contarComissoesAtivas(comissoes),
      } satisfies RankingBase;
    }

    const [discursos, comissoes] = await Promise.all([
      getSenadorDiscursos(p.id, ANO_INICIO_SENADO).catch(() => []),
      getSenadorComissoes(p.id).catch(() => []),
    ]);
    return {
      ...base,
      discursos: discursos.length,
      comissoes: contarComissoesAtivas(comissoes),
    } satisfies RankingBase;
  });

  return pontuarRanking(linhas);
}

async function RankingList() {
  const ranking = await getRanking();

  if (ranking.length === 0) {
    return <p className={styles.vazio}>Sem dados suficientes no momento.</p>;
  }

  const deputados = ranking.filter((l) => l.cargo === "deputado").length;
  const senadores = ranking.length - deputados;
  const melhor = ranking[0];

  return (
    <>
      <div className={styles.resumo}>
        <span>
          <strong>{ranking.length}</strong> parlamentares no recorte
        </span>
        <span>
          <strong>{deputados}</strong> na Câmara ·{" "}
          <strong>{senadores}</strong> no Senado
        </span>
        <span>
          maior nota <strong>{melhor.score}</strong>/100
        </span>
      </div>

      <section className={styles.metodo} aria-labelledby="metodo-ranking">
        <div className={styles.metodoTopo}>
          <h2 id="metodo-ranking" className={styles.metodoTitulo}>
            Como calculamos
          </h2>
          <span className={styles.metodoEscala}>nota de 0 a 100</span>
        </div>

        <div className={styles.formula}>
          <div className={styles.criterio}>
            <span className={styles.criterioPeso}>50</span>
            <div>
              <strong>Pronunciamentos</strong>
              <p>
                Discursos registrados na legislatura atual (Câmara) ou desde{" "}
                {ANO_INICIO_SENADO} (Senado). Quem está no topo da escala do
                recorte leva os 50 pontos.
              </p>
            </div>
          </div>
          <div className={styles.criterio}>
            <span className={styles.criterioPeso}>50</span>
            <div>
              <strong>Comissões ativas</strong>
              <p>
                Comissões permanentes, CPIs/CPMIs e conselhos de ética em que o
                parlamentar ainda é titular ou suplente. Bancadas e frentes
                ficam fora.
              </p>
            </div>
          </div>
        </div>

        <p className={styles.nota}>
          <strong>Normalização:</strong> cada critério é dividido pelo percentil
          95 do recorte — não pelo máximo absoluto, que um único caso extremo
          distorceria — e multiplicado por 50. Quem supera a referência fica no
          teto. A nota final é a soma dos dois (0–100), para que Câmara e
          Senado fiquem na mesma escala.
        </p>
        <p className={styles.nota}>
          <strong>Recorte:</strong> {POR_CASA} deputados e {POR_CASA} senadores
          em exercício, escolhidos em intervalos regulares na lista oficial de
          cada Casa — não é o censo dos 594 parlamentares. A nota mede
          atividade parlamentar, não qualidade, ideologia ou alinhamento
          político.
        </p>

        <div className={styles.fontes}>
          <span>Fontes:</span>
          <a
            href="https://dadosabertos.camara.leg.br/"
            target="_blank"
            rel="noreferrer"
          >
            Dados Abertos da Câmara
          </a>
          <a
            href="https://www12.senado.leg.br/dados-abertos"
            target="_blank"
            rel="noreferrer"
          >
            Dados Abertos do Senado
          </a>
        </div>
      </section>

      <ol className={styles.lista}>
        {ranking.map((linha, i) => {
          const base = linha.cargo === "deputado" ? "deputados" : "senadores";
          return (
            <li key={`${linha.cargo}-${linha.id}`}>
              <Link href={`/${base}/${linha.id}`} className={styles.card}>
                <span className={styles.posicao}>
                  {String(i + 1).padStart(2, "0")}
                </span>

                <FotoPolitico
                  nome={linha.nome}
                  fotoUrl={
                    linha.fotoUrl ?? fotoOficial(linha.cargo, linha.id)
                  }
                  className={styles.avatar}
                  iniciaisClassName={styles.avatarIniciais}
                  imagemClassName={styles.avatarImg}
                />

                <span className={styles.conteudo}>
                  <span className={styles.topo}>
                    <span className={styles.identidade}>
                      <span className={styles.nome}>{linha.nome}</span>
                      <span className={styles.meta}>
                        {linha.partido}/{linha.uf} ·{" "}
                        {linha.cargo === "deputado"
                          ? "Câmara"
                          : "Senado"}
                      </span>
                    </span>
                    <span
                      className={styles.score}
                      aria-label={`Nota ${linha.score} de 100`}
                    >
                      <strong>{linha.score}</strong>
                      <span>/100</span>
                    </span>
                  </span>

                  <span className={styles.barra} aria-hidden>
                    <span
                      className={styles.barraPreenchida}
                      style={{ width: `${linha.score}%` }}
                    />
                  </span>

                  <span className={styles.breakdown}>
                    <span>
                      <strong>{linha.discursos}</strong> falas
                      <em>+{linha.pontosDiscursos} pts</em>
                    </span>
                    <span>
                      <strong>{linha.comissoes}</strong> comissões
                      <em>+{linha.pontosComissoes} pts</em>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className={styles.rodape}>
        Atualização em cache de horas. A nota é um retrato da atividade
        registrada nas APIs oficiais — não substitui uma análise qualitativa do
        mandato.
      </p>
    </>
  );
}

export default function RankingPage() {
  return (
    <main className={styles.wrap}>
      <header className={styles.cabecalho}>
        <p className={styles.kicker}>Câmara + Senado · legislatura atual</p>
        <h1 className={styles.title}>Ranking de participação</h1>
        <p className={styles.subtitle}>
          Pronunciamentos e comissões ativas em uma nota de 0 a 100. A fórmula,
          os pesos e o recorte estão abertos abaixo.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="page-loading">
            Calculando o ranking com dados da Câmara e do Senado…
          </p>
        }
      >
        <RankingList />
      </Suspense>
    </main>
  );
}

