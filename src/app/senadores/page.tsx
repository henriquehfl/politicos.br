import type { Metadata } from "next";
import { PoliticoDirectory } from "@/components/PoliticoDirectory";
import styles from "../listagem.module.css";

export const metadata: Metadata = {
  title: "Senadores — todos os mandatos | POLITICOS.BR",
  description:
    "Todos os senadores que exerceram mandato desde a Constituinte de 1988, em exercício e históricos, com linha do tempo completa de cada parlamentar.",
};

export default function SenadoresPage() {
  return (
    <main className={styles.wrap}>
      <header className={styles.cabecalho}>
        <p className={styles.kicker}>Senado Federal · 48ª a 57ª legislatura</p>
        <h1 className={styles.title}>Senadores</h1>
        <p className={styles.subtitle}>
          Todos os que exerceram mandato desde a Constituinte — em exercício e
          históricos. Busque por nome, UF ou partido.
        </p>
      </header>
      <PoliticoDirectory cargo="senador" />
    </main>
  );
}
