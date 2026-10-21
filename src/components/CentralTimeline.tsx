"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import type {
  FonteTipo,
  TimelineCategory,
  TimelineEvent,
  VotePosition,
} from "@/lib/types";
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
  auditoria: { icon: Scale, label: "Justiça", color: "#e8837a" },
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

/**
 * Carreiras longas podem passar de 500 eventos. O HTML é transmitido inteiro,
 * mas só uma primeira página entra no DOM; o restante é revelado em lotes,
 * por rolagem ou pelo botão, reduzindo o custo de hidratação e pintura.
 */
const EVENTOS_INICIAIS = 30;
const EVENTOS_PASSO = 30;

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

function fonteTipoLabel(tipo?: FonteTipo): string {
  switch (tipo) {
    case "video":
      return "Vídeo";
    case "post":
      return "Post";
    case "noticia":
      return "Notícia";
    case "documento":
      return "Documento";
    case "oficial":
      return "Oficial";
    case "perfil":
      return "Perfil";
    default:
      return "Fonte";
  }
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
  const [limite, setLimite] = useState(EVENTOS_INICIAIS);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);

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

  const visiveis = sorted.slice(0, limite);
  const restantes = sorted.length - visiveis.length;

  // Trocou o filtro: volta ao primeiro lote, sem manter uma lista enorme.
  // O reset é feito no clique do filtro para não chamar setState em efeito.
  const trocarFiltro = useCallback((proximo: TimelineCategory | "all") => {
    setFilter(proximo);
    setLimite(EVENTOS_INICIAIS);
  }, []);

  // Carrega o próximo lote quando a sentinela entra na área visível.
  useEffect(() => {
    if (restantes <= 0 || !sentinelaRef.current) return;
    const sentinela = sentinelaRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimite((atual) =>
            Math.min(atual + EVENTOS_PASSO, sorted.length),
          );
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(sentinela);
    return () => observer.disconnect();
  }, [restantes, sorted.length]);

  const closeModal = useCallback(() => {
    setSelected(null);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);

  const abrirEvento = useCallback((event: TimelineEvent) => {
    setSelected(event);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${event.id}`);
    }
  }, []);

  useEffect(() => {
    const abrirPorHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      let id = hash;
      try {
        id = decodeURIComponent(hash);
      } catch {
        // hash inválido: mantém o texto original
      }
      const evento = events.find((item) => item.id === id);
      if (evento) setSelected(evento);
    };

    abrirPorHash();
    window.addEventListener("hashchange", abrirPorHash);
    return () => window.removeEventListener("hashchange", abrirPorHash);
  }, [events]);

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
                onClick={() => trocarFiltro(key)}
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
        {visiveis.map((event, index) => {
          const isLeft = index % 2 === 0;
          // O ano só é escrito no primeiro evento de cada ano; os demais
          // recebem um marcador discreto para não repetir o mesmo badge.
          const abreAno = index === 0 || visiveis[index - 1].year !== event.year;
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
                  <EventCard event={event} onSelect={abrirEvento} />
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
                  <EventCard event={event} onSelect={abrirEvento} />
                </div>
              ) : (
                <div className={styles.sideRight} aria-hidden />
              )}
            </li>
          );
        })}
      </ul>

      {restantes > 0 && (
        <div ref={sentinelaRef} className={styles.maisEventos}>
          <button
            type="button"
            className={styles.maisEventosBtn}
            onClick={() =>
              setLimite((atual) =>
                Math.min(atual + EVENTOS_PASSO, sorted.length),
              )
            }
          >
            Carregar mais {Math.min(restantes, EVENTOS_PASSO)}
          </button>
          <span>
            {restantes.toLocaleString("pt-BR")} evento(s) restante(s)
          </span>
        </div>
      )}

      <p className={styles.timelineNote}>
        Dados de mandato, votações e pronunciamentos vêm das APIs oficiais da
        Câmara e do Senado. Falas, vídeos e publicações de campanha passam por
        curadoria manual: abra o evento para conferir a citação e a fonte
        original.
      </p>

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
  const totalFontes = event.sources?.length ?? 0;
  const temVideo = event.sources?.some((fonte) => fonte.tipo === "video");

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
          {event.citacao?.texto && (
            <span className={`${styles.chip} ${styles.chipFonte}`}>fala</span>
          )}
          {temVideo && (
            <span className={`${styles.chip} ${styles.chipFonte}`}>vídeo</span>
          )}
          {totalFontes > 0 && (
            <span className={`${styles.chip} ${styles.chipFonte}`}>
              {totalFontes} {totalFontes === 1 ? "fonte" : "fontes"}
            </span>
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

        {event.citacao?.texto && (
          <figure className={styles.modalQuote}>
            <blockquote>“{event.citacao.texto}”</blockquote>
            <figcaption>
              {event.citacao.autor && <cite>{event.citacao.autor}</cite>}
              {event.citacao.contexto && (
                <span>
                  {event.citacao.autor ? " · " : ""}
                  {event.citacao.contexto}
                </span>
              )}
            </figcaption>
          </figure>
        )}

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
          <div className={styles.modalSources}>
            <h3>Fontes e mídia</h3>
            <ul>
              {event.sources.map((fonte) => {
                const meta = [fonte.veiculo, dataCurta(fonte.data)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={`${fonte.href}-${fonte.label}`}>
                    <a
                      href={fonte.href}
                      target="_blank"
                      rel="noreferrer"
                      title={`Abrir fonte: ${fonte.label}`}
                    >
                      <span className={styles.sourceBadge}>
                        {fonteTipoLabel(fonte.tipo)}
                      </span>
                      <span className={styles.sourceLabel}>{fonte.label}</span>
                      {meta && <span className={styles.sourceMeta}>{meta}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className={styles.modalSourceNote}>
              Abre o conteúdo original em nova aba. Links de vídeo e post levam
              à publicação, não a uma captura do site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

