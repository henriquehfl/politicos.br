"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { loadPoliticosIndex } from "@/lib/politicos-client";
import { searchPoliticos } from "@/lib/search-index";
import type { PoliticoSummary } from "@/lib/types";
import styles from "./directory.module.css";

type Filtro = "todos" | "ativos" | "historicos";

const PAGINA = 60;

const ROTULO_CARGO = {
  deputado: { plural: "Deputados", base: "/deputados" },
  senador: { plural: "Senadores", base: "/senadores" },
} as const;

function anos(p: PoliticoSummary): string {
  if (p.periodos) return p.periodos;
  if (!p.desde) return "—";
  const fim = p.vigente ? "hoje" : (p.ate ?? "");
  return fim ? `${p.desde}–${fim}` : String(p.desde);
}

export function PoliticoDirectory({
  cargo,
}: {
  cargo: "deputado" | "senador";
}) {
  const rotulo = ROTULO_CARGO[cargo];
  const [items, setItems] = useState<PoliticoSummary[] | null>(null);
  const [erro, setErro] = useState(false);
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("busca") ?? params.get("q") ?? "";
  });
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [paginacao, setPaginacao] = useState<{ chave: string; n: number }>({
    chave: "",
    n: PAGINA,
  });

  useEffect(() => {
    let vivo = true;
    void loadPoliticosIndex().then((todos) => {
      if (!vivo) return;
      if (!todos.length) setErro(true);
      setItems(todos);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const chave = `${filtro}|${query}`;
  const visiveis = paginacao.chave === chave ? paginacao.n : PAGINA;

  const doCargo = useMemo(
    () => (items ?? []).filter((p) => p.cargo === cargo),
    [items, cargo],
  );
  const ativos = useMemo(
    () => doCargo.filter((p) => p.vigente).length,
    [doCargo],
  );
  const historicos = doCargo.length - ativos;

  const resultados = useMemo(() => {
    const base = doCargo.filter((p) =>
      filtro === "todos" ? true : filtro === "ativos" ? p.vigente : !p.vigente,
    );
    if (query.trim().length >= 2) {
      return searchPoliticos(base, query, { limit: 10000 });
    }
    return base;
  }, [doCargo, filtro, query]);

  const mostrados = resultados.slice(0, visiveis);
  const restantes = resultados.length - mostrados.length;

  return (
    <div className={styles.directory}>
      <div className={styles.controles}>
        <div className={styles.busca}>
          <Search size={15} className={styles.buscaIcone} aria-hidden />
          <input
            type="search"
            className={styles.buscaInput}
            placeholder={`Buscar ${rotulo.plural.toLowerCase()} por nome, UF ou partido…`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={`Buscar ${rotulo.plural.toLowerCase()}`}
            suppressHydrationWarning
          />
          {query && (
            <button
              type="button"
              className={styles.limpar}
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>

        <div
          className={styles.filtros}
          role="group"
          aria-label="Filtrar por situação"
        >
          {(
            [
              ["todos", "Todos", doCargo.length],
              ["ativos", "Em exercício", ativos],
              ["historicos", "Histórico", historicos],
            ] as const
          ).map(([valor, label, total]) => (
            <button
              key={valor}
              type="button"
              className={`${styles.filtroBtn} ${
                filtro === valor ? styles.filtroAtivo : ""
              }`}
              onClick={() => setFiltro(valor)}
              aria-pressed={filtro === valor}
            >
              {label}
              <span className={styles.filtroTotal}>
                {items ? total.toLocaleString("pt-BR") : "…"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <div className={styles.estado}>
          <LoaderCircle size={16} className={styles.girando} aria-hidden />
          Carregando {rotulo.plural.toLowerCase()} de todas as legislaturas…
        </div>
      ) : erro ? (
        <div className={styles.estado}>
          Não foi possível carregar o índice agora. Recarregue a página.
        </div>
      ) : resultados.length === 0 ? (
        <div className={styles.estado}>
          Nenhum resultado para <strong>{query}</strong>.
        </div>
      ) : (
        <>
          <p className={styles.contagem} aria-live="polite">
            {resultados.length.toLocaleString("pt-BR")}{" "}
            {resultados.length === 1 ? "parlamentar" : "parlamentares"}
            {query ? ` para “${query}”` : ""}
          </p>

          <ul className={styles.grid}>
            {mostrados.map((p, i) => (
              <li
                key={p.id}
                className={styles.item}
                style={{ ["--i" as string]: i % 12 }}
              >
                <Link href={`${rotulo.base}/${p.id}`} className={styles.card}>
                  <span className={styles.cardTopo}>
                    <span className={styles.nome}>{p.nome}</span>
                    <span
                      className={`${styles.selo} ${
                        p.vigente ? styles.seloAtivo : styles.seloHistorico
                      }`}
                    >
                      {p.vigente ? "Em exercício" : "Histórico"}
                    </span>
                  </span>
                  <span className={styles.meta}>
                    <span>
                      {p.partido}/{p.uf}
                    </span>
                    <span>{anos(p)}</span>
                  </span>
                  <span className={styles.verPerfil}>
                    Ver linha do tempo <ArrowRight size={13} aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {restantes > 0 && (
            <div className={styles.mais}>
              <button
                type="button"
                className={styles.maisBtn}
                onClick={() =>
                  setPaginacao({ chave, n: visiveis + PAGINA })
                }
              >
                Mostrar mais {Math.min(restantes, PAGINA)}
                <span>faltam {restantes.toLocaleString("pt-BR")}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

