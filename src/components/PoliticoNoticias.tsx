"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  LoaderCircle,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { REFRESH_NOTICIAS_MS } from "@/lib/atualizacao";
import { newsAllSearchUrl } from "@/lib/media";
import type { Noticia } from "@/lib/noticias";
import styles from "./side-panel.module.css";

interface PoliticoNoticiasProps {
  nome: string;
  cargo: "deputado" | "senador";
}

interface RespostaNoticias {
  itens?: Noticia[];
  atualizadoEm?: string;
  erro?: string;
}

function tempoRelativo(iso?: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;

  const diferenca = Math.max(0, Date.now() - data.getTime());
  const minutos = Math.floor(diferenca / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} d`;

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function PoliticoNoticias({
  nome,
  cargo,
}: PoliticoNoticiasProps) {
  const [itens, setItens] = useState<Noticia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const requisicao = useRef<AbortController | null>(null);
  const ultimaCarga = useRef(0);

  const carregar = useCallback(
    async (silencioso = false) => {
      requisicao.current?.abort();
      const controller = new AbortController();
      requisicao.current = controller;

      if (!silencioso) setCarregando(true);

      try {
        const params = new URLSearchParams({ nome, cargo });
        const resposta = await fetch(`/api/noticias?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const dados = (await resposta.json()) as RespostaNoticias;
        if (requisicao.current !== controller) return;

        setItens(dados.itens ?? []);
        setAtualizadoEm(dados.atualizadoEm ?? new Date().toISOString());
        setErro(dados.erro ?? null);
      } catch {
        if (controller.signal.aborted || requisicao.current !== controller) {
          return;
        }
        setErro("Não foi possível consultar as notícias agora.");
      } finally {
        if (requisicao.current === controller) {
          ultimaCarga.current = Date.now();
          requisicao.current = null;
          setCarregando(false);
        }
      }
    },
    [cargo, nome],
  );

  useEffect(() => {
    ultimaCarga.current = Date.now();
    const timer = window.setTimeout(() => void carregar(true), 0);
    return () => {
      window.clearTimeout(timer);
      requisicao.current?.abort();
    };
  }, [carregar]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") void carregar(true);
    }, REFRESH_NOTICIAS_MS);

    const aoVoltarParaAba = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - ultimaCarga.current >= REFRESH_NOTICIAS_MS
      ) {
        void carregar(true);
      }
    };

    document.addEventListener("visibilitychange", aoVoltarParaAba);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
    };
  }, [carregar]);

  const visiveis = itens.slice(0, 6);

  return (
    <section className={styles.block} aria-busy={carregando}>
      <div className={styles.newsHeader}>
        <h3>
          <Newspaper size={12} aria-hidden /> Notícias recentes
        </h3>
        <button
          type="button"
          className={styles.newsRefresh}
          onClick={() => void carregar()}
          disabled={carregando}
          aria-label="Atualizar notícias"
          title="Atualizar notícias"
        >
          {carregando ? (
            <LoaderCircle size={12} aria-hidden />
          ) : (
            <RefreshCw size={12} aria-hidden />
          )}
        </button>
      </div>

      {visiveis.length > 0 ? (
        <ul className={styles.noticias}>
          {visiveis.map((noticia) => (
            <li key={noticia.id}>
              <a
                href={noticia.url}
                target="_blank"
                rel="noreferrer"
                title={`Abrir no veículo: ${noticia.titulo}`}
              >
                <span className={styles.noticiaTitulo}>
                  {noticia.titulo}
                </span>
                <span className={styles.noticiaMeta}>
                  {[noticia.veiculo, tempoRelativo(noticia.publicadoEm)]
                    .filter(Boolean)
                    .join(" · ")}
                  <ExternalLink size={10} aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : carregando ? (
        <p className={styles.nota}>Buscando notícias recentes…</p>
      ) : (
        <p className={styles.nota}>
          {erro
            ? "Não foi possível consultar as notícias agora."
            : "Nenhuma notícia recente encontrada para este parlamentar."}
        </p>
      )}

      {erro && visiveis.length > 0 && (
        <p className={styles.nota}>
          Não foi possível atualizar agora; exibindo a última lista.
        </p>
      )}

      <div className={styles.newsRodape}>
        <a
          className={styles.linkFonte}
          href={newsAllSearchUrl(nome)}
          target="_blank"
          rel="noreferrer"
        >
          Ver todas no Google Notícias ↗
        </a>
        {atualizadoEm && visiveis.length > 0 && (
          <span className={styles.nota}>
            Atualizado {tempoRelativo(atualizadoEm)}
          </span>
        )}
      </div>

      <p className={styles.nota}>
        Manchetes dos últimos 90 dias por busca automática de nome. Confira a
        fonte no veículo; atualização a cada 10 min.
      </p>
    </section>
  );
}
