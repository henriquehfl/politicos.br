import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CAMARA, fetchJson } from "@/lib/api/http";
import { REFRESH_VOTACOES_MS } from "@/lib/atualizacao";
import styles from "../listagem.module.css";

export const metadata: Metadata = {
  title: "Votações recentes — POLITICOS.BR",
  description: "Votações nominais recentes do Plenário da Câmara dos Deputados.",
};

interface Votacao {
  id: string;
  data: string;
  siglaOrgao: string;
  descricao: string;
  aprovacao: number | null;
  proposicaoObjeto?: string | null;
}

async function getVotacoes(): Promise<Votacao[]> {
  // Dados de tempo real: força a renderização no momento da requisição.
  await connection();

  // A API da Câmara aceita no máximo 3 meses por consulta.
  const fim = new Date();
  const ini = new Date();
  ini.setDate(ini.getDate() - 89);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const data = await fetchJson<{ dados: Votacao[] }>(
    `${CAMARA}/votacoes?dataInicio=${iso(ini)}&dataFim=${iso(fim)}&idOrgao=180&itens=80&ordem=DESC&ordenarPor=id`,
    // O painel atualiza a cada 5 min; o cache do servidor acompanha.
    { ttl: 2 * 60_000, revalidate: 300 },
  );
  return data?.dados ?? [];
}

function resultadoLabel(a: number | null): string {
  if (a === 1) return "Aprovado";
  if (a === 0) return "Rejeitado";
  return "—";
}

/** Assunto da votação: proposição quando houver, senão o início da descrição. */
function tituloVotacao(v: Votacao): string {
  if (v.proposicaoObjeto) return v.proposicaoObjeto;
  const descricao = v.descricao?.trim();
  if (!descricao) return "Votação nominal em plenário";
  return descricao.length > 110 ? `${descricao.slice(0, 107)}…` : descricao;
}

async function VotacoesList() {
  const votacoes = await getVotacoes();

  if (votacoes.length === 0) {
    return <p className={styles.subtitle}>Nenhuma votação encontrada.</p>;
  }

  return (
    <>
      <p className={styles.subtitle}>
        {votacoes.length} votações nos últimos 89 dias — Câmara dos Deputados.
        Atualização automática a cada 5 minutos.
      </p>
      <ul className={styles.grid}>
        {votacoes.map((v) => (
          <li key={v.id}>
            <a
              href={`${CAMARA}/votacoes/${v.id}`}
              target="_blank"
              rel="noreferrer"
              className={styles.card}
            >
              <span className={styles.nome}>{tituloVotacao(v)}</span>
              <span className={styles.meta}>
                {v.data} · {v.siglaOrgao ?? "PLEN"} · {resultadoLabel(v.aprovacao)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function VotacoesPage() {
  return (
    <main className={styles.wrap}>
      <AutoRefresh intervalMs={REFRESH_VOTACOES_MS} />
      <h1 className={styles.title}>Votações recentes do Plenário</h1>
      <Suspense
        fallback={
          <p className="page-loading">Carregando votações da Câmara…</p>
        }
      >
        <VotacoesList />
      </Suspense>
    </main>
  );
}
