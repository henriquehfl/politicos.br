"use client";

import { historicoBrasilEvents } from "@/data/historico-brasil";
import { CentralTimeline } from "./CentralTimeline";
import { PoliticoSearch } from "./PoliticoSearch";
import styles from "./home.module.css";

export function HomeExperience() {
  return (
    <div className={styles.home}>
      <header className={styles.intro}>
        <p className={styles.kicker}>República · 1988 — 2026</p>
        <h1 className={styles.headline}>Política brasileira em linha do tempo</h1>
        <p className={styles.lead}>
          {historicoBrasilEvents.length} marcos da história recente e a carreira
          completa de políticos da Câmara e do Senado — ativos e históricos.
          Clique em qualquer evento para ver detalhes, protagonistas e fontes.
        </p>
        <PoliticoSearch />
        <p className={styles.fontes}>
          Fontes: Câmara dos Deputados · Senado Federal · TSE · STF · TCU ·
          Planalto
        </p>
      </header>
      <CentralTimeline events={historicoBrasilEvents} showFilters />
    </div>
  );
}

