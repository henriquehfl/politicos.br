"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Landmark } from "lucide-react";
import { REFRESH_PERFIL_MS } from "@/lib/atualizacao";
import type { Politico } from "@/lib/types";
import { AutoRefresh } from "./AutoRefresh";
import { CentralTimeline } from "./CentralTimeline";
import { PoliticoActivityStats } from "./PoliticoActivityStats";
import { PoliticoSearch } from "./PoliticoSearch";
import { PoliticoSidePanel } from "./PoliticoSidePanel";
import styles from "./profile-view.module.css";

interface PoliticoProfileViewProps {
  politico: Politico;
  /** Contadores completos; a ficha-base pode não tê-los ainda. */
  stats?: ReactNode;
  /** Linha do tempo transmitida pelo servidor. */
  timeline?: ReactNode;
  /** Blocos pesados do painel lateral transmitidos pelo servidor. */
  painel?: ReactNode;
}

/** "48" ou "57ª" -> "48ª legislatura" */
function legislaturaLabel(valor: string): string {
  if (!/^\d+/.test(valor)) return "Legislatura não informada";
  return `${valor.replace(/[ªa]$/i, "")}ª legislatura`;
}

/** Ano inicial e final da legislatura (48ª = 1987–1991; 57ª = 2023–2027). */
function periodoLegislatura(valor: string): string | null {
  const numero = Number(valor.replace(/\D/g, ""));
  if (!Number.isInteger(numero) || numero < 48 || numero > 57) return null;
  const inicio = 2023 - (57 - numero) * 4;
  return `${inicio}–${inicio + 4}`;
}

export function PoliticoProfileView({
  politico,
  stats,
  timeline,
  painel,
}: PoliticoProfileViewProps) {
  const [modo, setModo] = useState<"auto" | "aberto" | "fechado">("auto");
  const atividade = politico.atividade;
  const situacaoAtual =
    politico.situacaoAtual ?? politico.cargos?.find((cargo) => cargo.atual) ?? null;
  const periodo = periodoLegislatura(politico.legislatura);

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
      <AutoRefresh intervalMs={REFRESH_PERFIL_MS} />
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
              {situacaoAtual && (
                <a
                  className={styles.situacaoAtual}
                  href={situacaoAtual.fonte.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Landmark size={13} aria-hidden />
                  {situacaoAtual.cargo} · em exercício desde{" "}
                  {situacaoAtual.inicio.slice(0, 4)}
                  <ExternalLink size={11} aria-hidden />
                </a>
              )}
              <p className={styles.subtitle}>
                {politico.vigente ? "Em exercício" : "Histórico"} ·{" "}
                {legislaturaLabel(politico.legislatura)}
                {periodo ? ` (${periodo})` : ""}
              </p>
            </div>
          </div>

          {stats ?? (atividade && <PoliticoActivityStats atividade={atividade} />)}
        </div>
        {timeline ?? <CentralTimeline events={politico.events} showFilters />}
      </div>
      <PoliticoSidePanel
        politico={politico}
        modo={modo}
        onToggle={alternarPainel}
        dossie={painel}
      />
    </div>
  );
}

