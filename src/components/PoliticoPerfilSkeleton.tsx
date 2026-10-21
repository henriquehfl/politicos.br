import profileStyles from "./profile-view.module.css";
import sideStyles from "./side-panel.module.css";
import timelineStyles from "./timeline.module.css";

/** Placeholder dos três contadores do topo. */
export function PoliticoStatsSkeleton() {
  return (
    <ul className={profileStyles.stats} aria-hidden>
      {[0, 1, 2].map((item) => (
        <li key={item} className={profileStyles.skeletonChip}>
          <span />
        </li>
      ))}
    </ul>
  );
}

/** Placeholder da linha do tempo enquanto o dossiê é montado no servidor. */
export function PoliticoTimelineSkeleton() {
  return (
    <div
      className={timelineStyles.timelineRoot}
      aria-busy="true"
      aria-label="Carregando histórico completo"
    >
      <p className={timelineStyles.skeletonNote}>
        Carregando histórico completo…
      </p>
      <div className={timelineStyles.skeletonList} aria-hidden>
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={timelineStyles.skeletonRow}>
            <span className={timelineStyles.skeletonCard} />
            <span className={timelineStyles.skeletonNode} />
            <span className={timelineStyles.skeletonCard} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder dos blocos que entram no painel lateral. */
export function PoliticoPainelSkeleton() {
  return (
    <div
      className={sideStyles.dossieSkeleton}
      aria-busy="true"
      aria-label="Carregando detalhes do parlamentar"
    >
      {[0, 1, 2].map((item) => (
        <div key={item} className={sideStyles.skeletonBlock} aria-hidden />
      ))}
      <p className={sideStyles.skeletonNote}>Carregando detalhes…</p>
    </div>
  );
}
