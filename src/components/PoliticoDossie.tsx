import { CentralTimeline } from "./CentralTimeline";
import { PoliticoActivityStats } from "./PoliticoActivityStats";
import { PoliticoPainelDossie } from "./PoliticoPainelDossie";
import type { Politico } from "@/lib/types";
import profileStyles from "./profile-view.module.css";
import sideStyles from "./side-panel.module.css";

interface DossieProps {
  /** Promise compartilhada pela página: o dossiê é buscado uma única vez. */
  dossie: Promise<Politico | null>;
}

/** Contadores do topo, preenchidos quando o dossiê termina. */
export async function PoliticoDossieStats({ dossie }: DossieProps) {
  const politico = await dossie;
  if (!politico?.atividade) return null;
  return <PoliticoActivityStats atividade={politico.atividade} />;
}

/** Linha do tempo completa, transmitida em um boundary próprio. */
export async function PoliticoDossieTimeline({ dossie }: DossieProps) {
  const politico = await dossie;
  if (!politico) {
    return (
      <p className={profileStyles.dossieErro}>
        Não foi possível carregar o histórico completo agora. A ficha básica
        continua disponível; tente novamente em alguns minutos.
      </p>
    );
  }
  return <CentralTimeline events={politico.events} showFilters />;
}

/** Blocos pesados do painel lateral (trajetória, TSE, comissões etc.). */
export async function PoliticoDossiePainel({ dossie }: DossieProps) {
  const politico = await dossie;
  if (!politico) {
    return (
      <p className={sideStyles.muted}>
        Não foi possível carregar os detalhes do dossiê agora.
      </p>
    );
  }
  return <PoliticoPainelDossie politico={politico} />;
}
