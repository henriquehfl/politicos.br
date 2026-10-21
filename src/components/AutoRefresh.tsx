"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface AutoRefreshProps {
  /** Intervalo entre atualizações. Não atualiza com a aba em segundo plano. */
  intervalMs: number;
}

/**
 * Revalida os Server Components da rota atual sem recarregar a página.
 * O `router.refresh()` preserva o estado dos componentes cliente (painel,
 * filtros etc.) e busca uma nova payload do servidor.
 */
export function AutoRefresh({ intervalMs }: AutoRefreshProps) {
  const router = useRouter();
  const ultimaAtualizacao = useRef(0);

  useEffect(() => {
    ultimaAtualizacao.current = Date.now();

    const atualizar = () => {
      if (document.visibilityState !== "visible") return;
      ultimaAtualizacao.current = Date.now();
      router.refresh();
    };

    const intervalo = window.setInterval(atualizar, intervalMs);

    const aoVoltarParaAba = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - ultimaAtualizacao.current >= intervalMs
      ) {
        atualizar();
      }
    };

    document.addEventListener("visibilitychange", aoVoltarParaAba);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
    };
  }, [intervalMs, router]);

  return null;
}
