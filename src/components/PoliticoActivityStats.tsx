import { FileText, Mic, Vote } from "lucide-react";
import type { PoliticoAtividade } from "@/lib/types";
import styles from "./profile-view.module.css";

/**
 * Contadores do cabeçalho. Componente sem estado, usado tanto na ficha-base
 * (quando os números já existem) quanto no bloco transmitido em segundo plano.
 */
export function PoliticoActivityStats({
  atividade,
}: {
  atividade: PoliticoAtividade;
}) {
  return (
    <ul className={styles.stats}>
      <li>
        <Vote size={13} aria-hidden />
        <strong>{atividade.votacoes.toLocaleString("pt-BR")}</strong>
        <span>votos em plenário</span>
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
  );
}
