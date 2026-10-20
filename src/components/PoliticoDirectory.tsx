"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { getCargoAtualPorNome } from "@/lib/cargos";
import { fotoOficial } from "@/lib/imagem";
import { loadPoliticosIndex } from "@/lib/politicos-client";
import { searchPoliticos } from "@/lib/search-index";
import type { PoliticoSummary } from "@/lib/types";
import { FotoPolitico } from "./FotoPolitico";
import styles from "./directory.module.css";

type Filtro = "todos" | "ativos" | "historicos";
type Casa = "todos" | "deputado" | "senador";

const PAGINA = 60;

const ROTULO_BASE = {
  deputado: {
    singular: "deputado",
    plural: "Deputados",
  },
  senador: {
    singular: "senador",
    plural: "Senadores",
  },
  todos: {
    singular: "político",
    plural: "Políticos",
  },
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
  /** Sem `cargo`, a listagem reúne Câmara e Senado. */
  cargo?: "deputado" | "senador";
}) {
  const rotulo = ROTULO_BASE[cargo ?? "todos"];
  const [items, setItems] = useState<PoliticoSummary[] | null>(null);
  const [erro, setErro] = useState(false);
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("busca") ?? params.get("q") ?? "";
  });
  const [casa, setCasa] = useState<Casa>("todos");
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

  const casaAtiva: Casa = cargo ?? casa;
  const chave = `${casaAtiva}|${filtro}|${query}`;
  const visiveis = paginacao.chave === chave ? paginacao.n : PAGINA;

  const naCasa = useMemo(
    () =>
      (items ?? []).filter(
        (p) => casaAtiva === "todos" || p.cargo === casaAtiva,
      ),
    [items, casaAtiva],
  );
  const ativos = useMemo(
    () => naCasa.filter((p) => p.vigente).length,
    [naCasa],
  );
  const historicos = naCasa.length - ativos;

  const resultados = useMemo(() => {
    const base = naCasa.filter((p) =>
      filtro === "todos" ? true : filtro === "ativos" ? p.vigente : !p.vigente,
    );
    if (query.trim().length >= 2) {
      return searchPoliticos(base, query, { limit: 10000 });
    }
    return base;
  }, [naCasa, filtro, query]);

  const mostrados = resultados.slice(0, visiveis);
  const restantes = resultados.length - mostrados.length;

  const casas = useMemo(
    () => [
      {
        valor: "todos" as const,
        label: "Todos",
        total: items?.length ?? 0,
      },
      {
        valor: "deputado" as const,
        label: "Câmara",
        total: items?.filter((p) => p.cargo === "deputado").length ?? 0,
      },
      {
        valor: "senador" as const,
        label: "Senado",
        total: items?.filter((p) => p.cargo === "senador").length ?? 0,
      },
    ],
    [items],
  );

  const situacoes = [
    { valor: "todos" as const, label: "Todos", total: naCasa.length },
    { valor: "ativos" as const, label: "Em exercício", total: ativos },
    { valor: "historicos" as const, label: "Histórico", total: historicos },
  ];

  return (
    <div className={styles.directory}>
      <div className={styles.controles}>
        <div className={styles.busca}>
          <Search size={15} className={styles.buscaIcone} aria-hidden />
          <input
            type="search"
            className={styles.buscaInput}
            placeholder="Nome, UF, partido ou cargo…"
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

        <div className={styles.filtros}>
          {!cargo && (
            <div
              className={styles.grupoFiltros}
              role="group"
              aria-label="Filtrar por Casa"
            >
              <span className={styles.grupoRotulo}>Casa</span>
              <div className={styles.chips}>
                {casas.map(({ valor, label, total }) => (
                  <button
                    key={valor}
                    type="button"
                    className={`${styles.filtroBtn} ${
                      casa === valor ? styles.filtroAtivo : ""
                    }`}
                    onClick={() => setCasa(valor)}
                    aria-pressed={casa === valor}
                  >
                    {label}
                    <span className={styles.filtroTotal}>
                      {items ? total.toLocaleString("pt-BR") : "…"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className={styles.grupoFiltros}
            role="group"
            aria-label="Filtrar por situação"
          >
            <span className={styles.grupoRotulo}>Situação</span>
            <div className={styles.chips}>
              {situacoes.map(({ valor, label, total }) => (
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
          {query ? (
            <>
              Nenhum resultado para <strong>{query}</strong>.
            </>
          ) : (
            "Nenhum político com esses filtros."
          )}
        </div>
      ) : (
        <>
          <p className={styles.contagem} aria-live="polite">
            {resultados.length.toLocaleString("pt-BR")}{" "}
            {resultados.length === 1
              ? rotulo.singular
              : rotulo.plural.toLowerCase()}
            {query ? ` para “${query}”` : ""}
          </p>

          <ul className={styles.grid}>
            {mostrados.map((p, i) => {
              const atual = getCargoAtualPorNome(p.nome);
              return (
                <li
                  key={p.id}
                  className={styles.item}
                  style={{ ["--i" as string]: i % 12 }}
                >
                  <Link
                    href={`${
                      p.cargo === "deputado" ? "/deputados" : "/senadores"
                    }/${p.id}`}
                    className={styles.card}
                  >
                    <FotoPolitico
                      nome={p.nome}
                      fotoUrl={p.fotoUrl ?? fotoOficial(p.cargo, p.id)}
                      className={styles.avatar}
                      iniciaisClassName={styles.avatarIniciais}
                      imagemClassName={styles.avatarImg}
                    />

                    <span className={styles.cardConteudo}>
                      <span className={styles.cardTopo}>
                        <span className={styles.identidade}>
                          <span className={styles.nome}>{p.nome}</span>
                          <span className={styles.cargoTag}>
                            {p.cargo === "deputado"
                              ? "Deputado federal"
                              : "Senador"}
                          </span>
                        </span>
                        <span
                          className={`${styles.selo} ${
                            atual
                              ? styles.seloPresidente
                              : p.vigente
                                ? styles.seloAtivo
                                : styles.seloHistorico
                          }`}
                          title={atual?.cargo}
                        >
                          {atual
                            ? "Presidente"
                            : p.vigente
                              ? "Em exercício"
                              : "Histórico"}
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
                    </span>
                  </Link>
                </li>
              );
            })}
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

