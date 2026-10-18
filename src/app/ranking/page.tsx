import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { getPoliticosIndex } from "@/lib/api/search";
import { getSenadorComissoes, getSenadorDiscursos } from "@/lib/api/senado";
import styles from "../listagem.module.css";

export const metadata: Metadata = {
  title: "Ranking de participação — POLITICOS.BR",
  description:
    "Ranking de senadores por volume de pronunciamentos e participação em comissões, com base nos Dados Abertos do Senado.",
};

const AMOSTRA = 12;
const PARALELO = 4;

interface LinhaRanking {
  id: string;
  nome: string;
  uf: string;
  partido: string;
  discursos: number;
  comissoes: number;
}

/** Executa tarefas em lotes para não saturar a API do Senado. */
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

/** Amostra distribuída ao longo da lista (evita só os primeiros alfabéticos). */
function amostraEspalhada<T>(itens: T[], tamanho: number): T[] {
  if (itens.length <= tamanho) return itens;
  const passo = itens.length / tamanho;
  return Array.from({ length: tamanho }, (_, i) => itens[Math.floor(i * passo)]);
}

async function getRanking(): Promise<LinhaRanking[]> {
  "use cache";
  cacheLife("hours");

  const index = await getPoliticosIndex();
  const senadores = amostraEspalhada(
    index.filter((p) => p.cargo === "senador" && p.vigente),
    AMOSTRA,
  );

  const linhas = await emLotes(senadores, PARALELO, async (s) => {
    const [discursos, comissoes] = await Promise.all([
      getSenadorDiscursos(s.id, 2023).catch(() => []),
      getSenadorComissoes(s.id).catch(() => []),
    ]);
    return {
      id: s.id,
      nome: s.nome,
      uf: s.uf,
      partido: s.partido,
      discursos: discursos.length,
      comissoes: comissoes.length,
    } satisfies LinhaRanking;
  });

  return linhas.sort(
    (a, b) =>
      b.discursos + b.comissoes * 2 - (a.discursos + a.comissoes * 2) ||
      a.nome.localeCompare(b.nome),
  );
}

async function RankingList() {
  const ranking = await getRanking();

  if (ranking.length === 0) {
    return <p className={styles.subtitle}>Sem dados suficientes no momento.</p>;
  }

  return (
    <>
      <p className={styles.subtitle}>
        Amostra de {ranking.length} senadores, ordenada por pronunciamentos
        (desde 2023) e comissões ativas.
      </p>
      <ul className={styles.grid}>
        {ranking.map((s, i) => (
          <li key={s.id}>
            <Link href={`/senadores/${s.id}`} className={styles.card}>
              <span className={styles.nome}>
                {i + 1}. {s.nome}
              </span>
              <span className={styles.meta}>
                {s.partido}/{s.uf} · {s.discursos} pronunciamentos ·{" "}
                {s.comissoes} comissões
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function RankingPage() {
  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>Ranking de participação</h1>
      <Suspense
        fallback={
          <p className="page-loading">
            Calculando ranking com dados do Senado…
          </p>
        }
      >
        <RankingList />
      </Suspense>
    </main>
  );
}
