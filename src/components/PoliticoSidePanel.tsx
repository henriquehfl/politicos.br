"use client";

import { ExternalLink, Landmark, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { Politico } from "@/lib/types";
import { PoliticoNoticias } from "./PoliticoNoticias";
import styles from "./side-panel.module.css";

interface PoliticoSidePanelProps {
  politico: Politico | null;
  modo: "auto" | "aberto" | "fechado";
  onToggle: () => void;
  /** Blocos pesados transmitidos pelo servidor depois da ficha básica. */
  dossie?: ReactNode;
}

/** "48" ou "57ª" -> "48ª legislatura" */
function legislaturaLabel(valor: string): string {
  if (!/^\d+/.test(valor)) return "Legislatura não informada";
  return `${valor.replace(/[ªa]$/i, "")}ª legislatura`;
}

/** Ano inicial e final da legislatura (48ª = 1987–1991; 57ª = 2023–2027). */
function periodoLegislatura(valor: string): string | null {
  const numeroLeg = Number(valor.replace(/\D/g, ""));
  if (!Number.isInteger(numeroLeg) || numeroLeg < 48 || numeroLeg > 57) return null;
  const inicio = 2023 - (57 - numeroLeg) * 4;
  return `${inicio}–${inicio + 4}`;
}

export function PoliticoSidePanel({
  politico,
  modo,
  onToggle,
  dossie,
}: PoliticoSidePanelProps) {
  if (!politico) return null;

  const classePainel =
    modo === "auto"
      ? styles.panelAuto
      : modo === "aberto"
        ? styles.panelOpen
        : styles.panelFechado;
  const classeToggle =
    modo === "auto"
      ? styles.toggleAuto
      : modo === "aberto"
        ? styles.toggleAberto
        : styles.toggleFechado;

  const { bio } = politico;
  const cargos = politico.cargos ?? [];
  const situacaoAtual =
    politico.situacaoAtual ?? cargos.find((cargo) => cargo.atual) ?? null;
  const periodo = periodoLegislatura(politico.legislatura);
  const perfilOficial =
    politico.cargo === "deputado"
      ? `https://www.camara.leg.br/deputados/${politico.id}`
      : `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${politico.id}`;

  return (
    <>
      <button
        type="button"
        className={`${styles.toggle} ${classeToggle}`}
        onClick={onToggle}
        aria-expanded={modo === "auto" ? undefined : modo === "aberto"}
        aria-label="Alternar painel do parlamentar"
      >
        <span className={styles.setaAberta} aria-hidden>
          ‹
        </span>
        <span className={styles.setaFechada} aria-hidden>
          ›
        </span>
      </button>

      <aside
        className={`${styles.panel} ${classePainel}`}
        aria-label="Ficha do parlamentar"
      >
        <header className={styles.panelHeader}>
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
          <h2 className={styles.nome}>{politico.nome}</h2>
          <p className={styles.cargo}>
            {situacaoAtual
              ? `${situacaoAtual.cargo} · em exercício`
              : `${politico.cargo === "deputado" ? "Deputado Federal" : "Senador"} · ${
                  politico.vigente ? "Em exercício" : "Histórico"
                }`}
          </p>
          {situacaoAtual && (
            <p className={styles.cargoSecundario}>
              {politico.cargo === "deputado" ? "Deputado Federal" : "Senador"} ·{" "}
              {politico.vigente ? "em exercício" : "histórico"}
            </p>
          )}
          <div className={styles.chips}>
            <span className={styles.chip}>
              {politico.partido}/{politico.uf}
            </span>
            <span className={styles.chip}>
              {legislaturaLabel(politico.legislatura)}
            </span>
            {periodo && <span className={styles.chip}>{periodo}</span>}
            {bio?.idade !== undefined && (
              <span className={styles.chip}>{bio.idade} anos</span>
            )}
          </div>
        </header>

        <PoliticoNoticias nome={politico.nome} cargo={politico.cargo} />

        {dossie}

        <section className={styles.block}>
          <h3>
            <Landmark size={12} aria-hidden /> Dados do mandato
          </h3>
          <dl className={styles.dl}>
            <div>
              <dt>Partido</dt>
              <dd>{politico.partido}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{politico.uf}</dd>
            </div>
            <div>
              <dt>Legislatura</dt>
              <dd>
                {legislaturaLabel(politico.legislatura)}
                {periodo ? ` (${periodo})` : ""}
              </dd>
            </div>
            <div>
              <dt>Sexo</dt>
              <dd>{politico.sexo}</dd>
            </div>
            <div>
              <dt>Condição</dt>
              <dd>{politico.condicao}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.block}>
          <h3>
            <MapPin size={12} aria-hidden /> Gabinete
            {politico.vigente ? "" : " (último registro)"}
          </h3>
          <dl className={styles.dl}>
            <div>
              <dt>Prédio</dt>
              <dd>{politico.gabinete.predio}</dd>
            </div>
            <div>
              <dt>Sala</dt>
              <dd>{politico.gabinete.sala}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{politico.gabinete.telefone}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {politico.gabinete.email !== "—" ? (
                  <a href={`mailto:${politico.gabinete.email}`}>
                    {politico.gabinete.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.block}>
          <h3>
            <ExternalLink size={12} aria-hidden /> Fontes oficiais
          </h3>
          <ul className={styles.comissoes}>
            <li>
              <a
                className={styles.linkFonte}
                href={perfilOficial}
                target="_blank"
                rel="noreferrer"
              >
                Perfil oficial ↗
              </a>
              <span className={styles.comissaoNome}>
                {politico.cargo === "deputado"
                  ? "Câmara dos Deputados"
                  : "Senado Federal"}
              </span>
            </li>
            <li>
              <a
                className={styles.linkFonte}
                href={
                  politico.cargo === "deputado"
                    ? `https://dadosabertos.camara.leg.br/api/v2/deputados/${politico.id}`
                    : `https://legis.senado.leg.br/dadosabertos/senador/${politico.id}.json`
                }
                target="_blank"
                rel="noreferrer"
              >
                API de Dados Abertos ↗
              </a>
              <span className={styles.comissaoNome}>
                JSON com os dados brutos deste parlamentar
              </span>
            </li>
            <li>
              <a
                className={styles.linkFonte}
                href="https://divulgacandcontas.tse.jus.br/divulga/#/"
                target="_blank"
                rel="noreferrer"
              >
                Divulgação de candidaturas (TSE) ↗
              </a>
              <span className={styles.comissaoNome}>
                Prestações de contas e resultados eleitorais
              </span>
            </li>
            <li>
              <a
                className={styles.linkFonte}
                href="https://transparencia.portal.gov.br/"
                target="_blank"
                rel="noreferrer"
              >
                Portal da Transparência ↗
              </a>
              <span className={styles.comissaoNome}>
                Servidores, benefícios e gastos públicos
              </span>
            </li>
          </ul>
        </section>
      </aside>
    </>
  );
}
