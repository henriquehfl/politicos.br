"use client";

import { useState } from "react";
import { FileText, Mic, Vote } from "lucide-react";
import type { Politico } from "@/lib/types";
import { CentralTimeline } from "./CentralTimeline";
import { PoliticoSearch } from "./PoliticoSearch";
import { PoliticoSidePanel } from "./PoliticoSidePanel";
import styles from "./profile-view.module.css";

interface PoliticoProfileViewProps {
  politico: Politico;
}

export function PoliticoProfileView({ politico }: PoliticoProfileViewProps) {
  const [modo, setModo] = useState<"auto" | "aberto" | "fechado">("auto");
  const atividade = politico.atividade;

  const alternarPainel = () => {
    const desktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1101px)").matches;
    setModo((atual) => {
      if (atual === "auto") return desktop ? "fechado" : "aberto";
      return atual === "aberto" ? "fechado" : "aberto";
    });
  };

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.main} ${
          modo === "aberto"
            ? styles.mainPanelOpen
            : modo === "auto"
              ? styles.mainPanelAuto
              : ""
        }`}
      >
        <div className={styles.hero}>
          <PoliticoSearch compact />

          <div className={styles.identidade}>
            {politico.fotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.foto}
                src={politico.fotoUrl}
                alt={`Foto de ${politico.nome}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className={styles.identidadeTexto}>
              <p className={styles.kicker}>
                {politico.cargo === "deputado"
                  ? "Câmara dos Deputados"
                  : "Senado Federal"}{" "}
                · {politico.partido}/{politico.uf}
              </p>
              <h1 className={styles.title}>{politico.nome}</h1>
              <p className={styles.subtitle}>
                {politico.vigente ? "Em exercício" : "Histórico"} ·{" "}
                {politico.legislatura} legislatura · mais recente primeiro
              </p>
            </div>
          </div>

          {atividade && (
            <ul className={styles.stats}>
              <li>
                <Vote size={13} aria-hidden />
                <strong>{atividade.votacoes.toLocaleString("pt-BR")}</strong>
                <span>votações</span>
              </li>
              <li>
                <Mic size={13} aria-hidden />
                <strong>{atividade.discursos.toLocaleString("pt-BR")}</strong>
                <span>discursos</span>
              </li>
              <li>
                <FileText size={13} aria-hidden />
                <strong>{atividade.proposicoes.toLocaleString("pt-BR")}</strong>
                <span>proposições</span>
              </li>
            </ul>
          )}
        </div>
        <CentralTimeline events={politico.events} showFilters />
      </div>
      <PoliticoSidePanel
        politico={politico}
        modo={modo}
        onToggle={alternarPainel}
      />
    </div>
  );
}

