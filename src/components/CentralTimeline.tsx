"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Briefcase,
  CalendarCheck,
  FileText,
  Landmark,
  Mic,
  Repeat,
  Scale,
  ScrollText,
  Trophy,
  Vote,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { textoLimpo } from "@/lib/texto";
import type { TimelineCategory, TimelineEvent, VotePosition } from "@/lib/types";
import styles from "./timeline.module.css";

interface CategoryMeta {
  icon: LucideIcon;
  label: string;
  color: string;
}

const CATEGORY_META: Record<TimelineCategory, CategoryMeta> = {
  mandato: { icon: Landmark, label: "Mandatos", color: "#e0b07a" },
  partido: { icon: Repeat, label: "Partido", color: "#b9a2e8" },
  votacao: { icon: Vote, label: "Votações", color: "#7fb3e8" },
  eleicao: { icon: Trophy, label: "Eleições", color: "#e8c46a" },
  discurso: { icon: Mic, label: "Discursos", color: "#8fd6b4" },
  financas: { icon: Wallet, label: "Finanças", color: "#d8a1a1" },
  auditoria: { icon: Scale, label: "Escândalos", color: "#e8837a" },
  presenca: { icon: CalendarCheck, label: "Presença", color: "#9ecf8f" },
  proposicao: { icon: FileText, label: "Proposições", color: "#9db4e0" },
  carreira: { icon: Briefcase, label: "Carreira", color: "#c9b18f" },
  historico: { icon: ScrollText, label: "Histórico", color: "#c0b6aa" },
};

const FILTROS: Array<TimelineCategory | "all"> = [
  "all",
  "eleicao",
  "votacao",
  "proposicao",
  "discurso",
  "mandato",
  "partido",
  "presenca",
  "financas",
  "auditoria",
  "carreira",
  "historico",
];

function voteChipClass(vote: VotePosition): string {
  if (vote === "SIM") return styles.chipSim;
  if (vote === "NAO") return styles.chipNao;
  return styles.chipAbst;
}

function voteLabel(vote: VotePosition): string {
  if (vote === "SIM") return "SIM";
  if (vote === "NAO") return "NÃO";
  if (vote === "ABSTENCAO") return "ABSTENÇÃO";
  return "OBSTRUÇÃO";
}

function resultadoLabel(r: string): string {
  if (r === "eleito") return "Eleito(a)";
  if (r === "nao_eleito") return "Não eleito(a)";
  if (r === "suplente") return "Suplente";
  return "Candidato(a)";
}

function dataCurta(date?: string): string | null {
  if (!date) return null;
  const partes = date.slice(0, 10).split("-");
  if (partes.length !== 3) return null;
  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
}

interface CentralTimelineProps {
  events: TimelineEvent[];
  showFilters?: boolean;
}

export function CentralTimeline({
  events,
  showFilters = true,
}: CentralTimelineProps) {
  const [filter, setFilter] = useState<TimelineCategory | "all">("all");
  const [selected, setSelected] = useState<TimelineEvent | null>(null);

  const sorted = useMemo(() => {
    const list = [...events].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const da = a.date ?? `${a.year}-01-01`;
      const db = b.date ?? `${b.year}-01-01`;
      return db.localeCompare(da);
    });
    if (filter === "all") return list;
    return list.filter((e) => e.category === filter);
  }, [events, filter]);

  const contagem = useMemo(() => {
    const mapa = new Map<TimelineCategory, number>();
    for (const event of events) {
      mapa.set(event.category, (mapa.get(event.category) ?? 0) + 1);
    }
    return mapa;
  }, [events]);

  const closeModal = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, closeModal]);

  return (
    <div className={styles.timelineRoot}>
      {showFilters && (
        <div className={styles.filters} role="group" aria-label="Filtrar eventos">
          {FILTROS.map((key) => {
            const meta = key === "all" ? null : CATEGORY_META[key];
            const Icon = meta?.icon ?? ScrollText;
            const total =
              key === "all" ? events.length : (contagem.get(key) ?? 0);
            if (key !== "all" && total === 0) return null;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.filterBtn} ${filter === key ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                style={
                  meta
                    ? ({ ["--cat" as string]: meta.color } as CSSProperties)
                    : undefined
                }
              >
                <Icon size={12} aria-hidden />
                {key === "all" ? "Todos" : meta?.label}
                <span className={styles.filterCount}>{total}</span>
              </button>
            );
          })}
        </div>
      )}

      <ul className={styles.list}>
        {sorted.length === 0 && (
          <li className={styles.vazio}>
            Nenhum evento nesta categoria para este parlamentar.
          </li>
        )}
        {sorted.map((event, index) => {
          const isLeft = index % 2 === 0;
          // O ano só é escrito no primeiro evento de cada ano; os demais
          // recebem um marcador discreto para não repetir o mesmo badge.
          const abreAno = index === 0 || sorted[index - 1].year !== event.year;
          return (
            <li
              key={event.id}
              className={styles.row}
              style={
                { ["--i" as string]: Math.min(index, 12) } as CSSProperties
              }
            >
              {isLeft ? (
                <div className={styles.sideLeft}>
                  <EventCard event={event} onSelect={setSelected} />
                </div>
              ) : (
                <div className={styles.sideLeft} aria-hidden />
              )}

              <div className={styles.centerCol}>
                {abreAno ? (
                  <div className={styles.yearBadge}>{event.year}</div>
                ) : (
                  <span className={styles.dotNode}>
                    <span className={styles.srOnly}>{event.year}</span>
                  </span>
                )}
              </div>

              {!isLeft ? (
                <div className={styles.sideRight}>
                  <EventCard event={event} onSelect={setSelected} />
                </div>
              ) : (
                <div className={styles.sideRight} aria-hidden />
              )}
            </li>
          );
        })}
      </ul>

      {selected && <EventModal event={selected} onClose={closeModal} />}
    </div>
  );
}


function EventCard({
  event,
  onSelect,
}: {
  event: TimelineEvent;
  onSelect: (e: TimelineEvent) => void;
}) {
  const meta = CATEGORY_META[event.category];
  const Icon = meta.icon;
  const titulo = textoLimpo(event.title) ?? "Evento sem título";
  const resumo =
    textoLimpo(event.summary) ??
    "Sem descrição disponível na fonte oficial.";

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect(event)}
      style={{ ["--cat" as string]: meta.color } as CSSProperties}
      aria-label={`${event.year}: ${titulo}`}
    >
      <span className={styles.cardInner}>
        <span className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden>
            <Icon size={13} strokeWidth={1.8} />
          </span>
          <span className={styles.cardCat}>{meta.label}</span>
          {dataCurta(event.date) && (
            <span className={styles.cardDate}>{dataCurta(event.date)}</span>
          )}
        </span>
        <span className={styles.cardTitle}>{titulo}</span>
        <span className={styles.cardSummary}>{resumo}</span>
        <span className={styles.metaRow}>
          {event.vote && (
            <span className={`${styles.chip} ${voteChipClass(event.vote)}`}>
              {voteLabel(event.vote)}
            </span>
          )}
          {event.eleicao && (
            <span className={styles.chip}>
              {resultadoLabel(event.eleicao.resultado)}
              {typeof event.eleicao.votos === "number"
                ? ` · ${event.eleicao.votos.toLocaleString("pt-BR")}`
                : ""}
            </span>
          )}
          {event.discurso?.polemico && (
            <span className={styles.chip}>polêmico</span>
          )}
          {event.impact && (
            <span
              className={`${styles.chip} ${
                event.impact === "critico"
                  ? styles.chipCritico
                  : event.impact === "positivo"
                    ? styles.chipPositivo
                    : styles.chipAlerta
              }`}
            >
              {event.impact === "critico"
                ? "crítico"
                : event.impact === "positivo"
                  ? "positivo"
                  : "alerta"}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function EventModal({
  event,
  onClose,
}: {
  event: TimelineEvent;
  onClose: () => void;
}) {
  const meta = CATEGORY_META[event.category];
  const Icon = meta.icon;
  const titulo = textoLimpo(event.title) ?? "Evento sem título";
  const corpo =
    textoLimpo(event.detail) ??
    textoLimpo(event.summary) ??
    "Sem descrição disponível na fonte oficial.";

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ ["--cat" as string]: meta.color } as CSSProperties}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={16} aria-hidden />
        </button>

        <p className={styles.modalKicker}>
          <Icon size={13} aria-hidden />
          {meta.label}
          {dataCurta(event.date) ? ` · ${dataCurta(event.date)}` : ""}
        </p>

        <h2 id="timeline-modal-title" className={styles.modalTitle}>
          {titulo}
        </h2>
        <p className={styles.modalBody}>{corpo}</p>

        {event.vote && (
          <p className={styles.modalBody}>
            Voto: <strong>{voteLabel(event.vote)}</strong>
            {event.voteProposicao ? ` — ${event.voteProposicao}` : ""}
          </p>
        )}

        {event.eleicao && (
          <div className={styles.modalBody}>
            <p>
              <strong>Eleição {event.eleicao.ano}</strong> —{" "}
              {event.eleicao.cargo}
            </p>
            <p>
              Resultado:{" "}
              <strong>{resultadoLabel(event.eleicao.resultado)}</strong>
              {typeof event.eleicao.votos === "number"
                ? ` · ${event.eleicao.votos.toLocaleString("pt-BR")} votos`
                : ""}
              {typeof event.eleicao.percentual === "number"
                ? ` (${event.eleicao.percentual.toFixed(2)}%)`
                : ""}
            </p>
            {event.eleicao.partido && (
              <p>Partido/coligação: {event.eleicao.partido}</p>
            )}
          </div>
        )}

        {event.discurso && (
          <div className={styles.modalBody}>
            {textoLimpo(event.discurso.tipo) && (
              <p>
                <strong>{textoLimpo(event.discurso.tipo)}</strong>
              </p>
            )}
            <p>
              {textoLimpo(event.discurso.resumo) ??
                textoLimpo(event.summary) ??
                corpo}
            </p>
            {textoLimpo(event.discurso.tema) && (
              <p className={styles.modalTags}>
                Temas: {textoLimpo(event.discurso.tema)}
              </p>
            )}
          </div>
        )}

        {event.presenca && (
          <ul className={styles.modalBody}>
            <li>Sessões convocadas: {event.presenca.sessoes}</li>
            <li>Dias de presença: {event.presenca.diasPresente}</li>
            <li>Faltas justificadas: {event.presenca.faltasJustificadas}</li>
            <li>
              Faltas não justificadas: {event.presenca.faltasNaoJustificadas}
            </li>
          </ul>
        )}

        {event.protagonists && event.protagonists.length > 0 && (
          <p className={styles.modalBody}>
            Protagonistas: {event.protagonists.join(", ")}
          </p>
        )}

        {event.sources && event.sources.length > 0 && (
          <div className={styles.modalLinks}>
            {event.sources.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noreferrer">
                {s.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

