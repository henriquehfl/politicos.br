import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ApuracaoDashboard } from "@/components/ApuracaoDashboard";
import {
  cargoApuracao,
  ufValida,
  type CargoApuracaoId,
  type UfSigla,
} from "@/lib/apuracao";
import styles from "./apuracao.module.css";

export const metadata: Metadata = {
  title: "Apuração 2026 — POLITICOS.BR",
  description:
    "Acompanhe a apuração oficial do TSE por estado e cargo, com atualização automática e sem projeções.",
};

interface ApuracaoSearchParams {
  uf?: string;
  cargo?: string;
}

interface ApuracaoPageProps {
  searchParams: Promise<ApuracaoSearchParams>;
}

async function ApuracaoConteudo({ searchParams }: ApuracaoPageProps) {
  await connection();

  const params = await searchParams;
  const ufParam = (params.uf ?? "SP").toUpperCase();
  const uf: UfSigla = ufValida(ufParam) ? ufParam : "SP";
  const cargo: CargoApuracaoId =
    cargoApuracao(params.cargo)?.id ?? "governador";

  return <ApuracaoDashboard ufInicial={uf} cargoInicial={cargo} />;
}

export default function ApuracaoPage({ searchParams }: ApuracaoPageProps) {
  return (
    <main className={styles.wrap}>
      <header className={styles.cabecalho}>
        <p className={styles.kicker}>TSE · Eleições 2026</p>
        <h1 className={styles.title}>Apuração em tempo real</h1>
        <p className={styles.subtitle}>
          Totalização oficial do TSE por estado e cargo. Os números são
          atualizados automaticamente a cada 30 segundos; não há projeções.
        </p>
      </header>
      <Suspense
        fallback={<p className="page-loading">Carregando apuração do TSE…</p>}
      >
        <ApuracaoConteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
