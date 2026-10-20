import type { Metadata } from "next";
import { PoliticoDirectory } from "@/components/PoliticoDirectory";
import styles from "../listagem.module.css";

export const metadata: Metadata = {
  title: "Políticos — Câmara e Senado | POLITICOS.BR",
  description:
    "Todos os deputados federais e senadores que exerceram mandato desde a Constituinte de 1988, em um só índice, com busca por nome, UF, partido ou cargo.",
};

export default function PoliticosPage() {
  return (
    <main className={styles.wrap}>
      <header className={styles.cabecalho}>
        <p className={styles.kicker}>
          Congresso Nacional · 48ª a 57ª legislatura
        </p>
        <h1 className={styles.title}>Todos os políticos</h1>
        <p className={styles.subtitle}>
          Deputados federais e senadores reunidos no mesmo índice — em exercício
          e históricos. Busque por nome, UF, partido ou cargo.
        </p>
      </header>
      <PoliticoDirectory />
    </main>
  );
}
