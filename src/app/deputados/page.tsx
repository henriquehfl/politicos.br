import type { Metadata } from "next";
import { CasaNav } from "@/components/CasaNav";
import { PoliticoDirectory } from "@/components/PoliticoDirectory";
import styles from "../listagem.module.css";

export const metadata: Metadata = {
  title: "Deputados Federais — todos os mandatos | POLITICOS.BR",
  description:
    "Todos os deputados federais que exerceram mandato desde a Constituinte de 1988, em exercício e históricos, com linha do tempo completa de cada parlamentar.",
};

export default function DeputadosPage() {
  return (
    <main className={styles.wrap}>
      <header className={styles.cabecalho}>
        <p className={styles.kicker}>Câmara dos Deputados · 48ª a 57ª legislatura</p>
        <h1 className={styles.title}>Deputados Federais</h1>
        <p className={styles.subtitle}>
          Todos os que exerceram mandato desde a Constituinte — em exercício e
          históricos. Busque por nome, UF, partido ou cargo.
        </p>
      </header>
      <CasaNav ativo="deputado" />
      <PoliticoDirectory cargo="deputado" />
    </main>
  );
}
