"use client";

import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowUpRight, LoaderCircle, Search, X } from "lucide-react";
import { getCargoAtualPorNome } from "@/lib/cargos";
import { loadPoliticosIndex, warmPoliticosIndex } from "@/lib/politicos-client";
import { highlightName, searchPoliticos } from "@/lib/search-index";
import type { PoliticoSummary } from "@/lib/types";
import styles from "./search.module.css";

interface PoliticoSearchProps {
  onSelectPolitico?: (politico: PoliticoSummary) => void;
  compact?: boolean;
}

const MAX_RESULTADOS = 8;

function periodo(p: PoliticoSummary): string {
  if (p.vigente) return "Em exercício";
  if (p.periodos) return p.periodos;
  if (!p.desde) return "Histórico";
  return p.ate ? `${p.desde}–${p.ate}` : String(p.desde);
}

export function PoliticoSearch({
  onSelectPolitico,
  compact = false,
}: PoliticoSearchProps) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [index, setIndex] = useState<PoliticoSummary[] | null>(null);
  const [remoto, setRemoto] = useState<{
    q: string;
    results: PoliticoSummary[];
    total: number;
  } | null>(null);

  const deferredQuery = useDeferredValue(query);
  const busca = query.trim();
  const buscaAdiada = deferredQuery.trim();

  // Índice completo em memória: a partir daí a busca é local (sem rede).
  useEffect(() => {
    warmPoliticosIndex();
    let vivo = true;
    void loadPoliticosIndex().then((items) => {
      if (vivo && items.length) setIndex(items);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Fallback: enquanto o índice não chegou, consulta a API.
  useEffect(() => {
    if (index || busca.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(busca)}&limit=${MAX_RESULTADOS}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          results?: PoliticoSummary[];
          total?: number;
        };
        setRemoto({
          q: busca,
          results: data.results ?? [],
          total: data.total ?? data.results?.length ?? 0,
        });
      } catch {
        /* requisição abortada */
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [busca, index]);

  const encontrados = useMemo(() => {
    if (!index) return null;
    return searchPoliticos(index, buscaAdiada, { limit: 4000 });
  }, [index, buscaAdiada]);

  const results = encontrados ? encontrados.slice(0, MAX_RESULTADOS) : (remoto?.q === busca ? remoto.results : []);
  const total = encontrados ? encontrados.length : (remoto?.q === busca ? remoto.total : 0);
  const aguardando = !index && busca.length >= 2 && remoto?.q !== busca;
  const ativoSeguro = Math.min(ativo, Math.max(0, results.length - 1));

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fechar = () => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const irPara = (p: PoliticoSummary) => {
    setOpen(false);
    setQuery("");
    if (onSelectPolitico) {
      onSelectPolitico(p);
      return;
    }
    const base = p.cargo === "deputado" ? "/deputados" : "/senadores";
    router.push(`${base}/${p.id}`);
  };

  const verTodos = () => {
    const cargo = results[0]?.cargo ?? "deputado";
    const base = cargo === "deputado" ? "/deputados" : "/senadores";
    setOpen(false);
    router.push(`${base}?busca=${encodeURIComponent(busca)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAtivo((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setAtivo((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
    } else if (event.key === "Enter") {
      const escolhido = results[ativoSeguro] ?? results[0];
      if (escolhido) {
        event.preventDefault();
        irPara(escolhido);
      }
    } else if (event.key === "Escape") {
      fechar();
    }
  };

  const mostrarLista = open && busca.length >= 2;

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${compact ? styles.wrapCompact : ""}`}
    >
      <label className={styles.label} htmlFor="politico-search">
        Buscar parlamentar
      </label>
      <div className={`${styles.field} ${open ? styles.fieldOpen : ""}`}>
        <Search className={styles.fieldIcon} size={16} aria-hidden />
        <input
          ref={inputRef}
          id="politico-search"
          type="search"
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            mostrarLista && results[ativoSeguro]
              ? `${listId}-${results[ativoSeguro].cargo}-${results[ativoSeguro].id}`
              : undefined
          }
          className={styles.input}
          placeholder="Nome, UF ou partido — ativos e históricos…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            warmPoliticosIndex();
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {aguardando ? (
          <LoaderCircle
            className={styles.fieldSpinner}
            size={16}
            aria-label="Carregando"
          />
        ) : query ? (
          <button
            type="button"
            className={styles.clear}
            onClick={fechar}
            aria-label="Limpar busca"
          >
            <X size={14} aria-hidden />
          </button>
        ) : null}
      </div>

      {mostrarLista && (
        <ul className={styles.dropdown} id={listId} role="listbox">
          {aguardando && results.length === 0 ? (
            <li className={styles.empty}>
              <LoaderCircle size={14} className={styles.spin} aria-hidden />{" "}
              Carregando o índice histórico…
            </li>
          ) : results.length === 0 ? (
            <li className={styles.empty}>
              Nenhum parlamentar encontrado para <strong>{busca}</strong>.
            </li>
          ) : (
            results.map((p, i) => {
              const atual = getCargoAtualPorNome(p.nome);
              return (
                <li
                  key={`${p.cargo}-${p.id}`}
                  role="option"
                  aria-selected={i === ativoSeguro}
                  id={`${listId}-${p.cargo}-${p.id}`}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`${styles.option} ${i === ativoSeguro ? styles.optionActive : ""}`}
                    onMouseEnter={() => setAtivo(i)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => irPara(p)}
                  >
                    <span className={styles.optionNome}>
                      {highlightName(p.nome, buscaAdiada).map((parte, idx) =>
                        parte.match ? (
                          <mark key={idx} className={styles.mark}>
                            {parte.text}
                          </mark>
                        ) : (
                          <span key={idx}>{parte.text}</span>
                        ),
                      )}
                    </span>
                    <span className={styles.optionMeta}>
                      <span>
                        {p.partido}/{p.uf} ·{" "}
                        {p.cargo === "deputado" ? "Deputado" : "Senador"}
                        {atual && (
                          <>
                            {" · "}
                            <em className={styles.presidente}>
                              {atual.cargo}
                            </em>
                          </>
                        )}
                      </span>
                      <span
                        className={`${styles.status} ${
                          p.vigente ? styles.statusAtivo : styles.statusHistorico
                        }`}
                      >
                        {periodo(p)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
          {results.length > 0 && (
            <li className={styles.footer}>
              <button
                type="button"
                className={styles.footerBtn}
                onClick={verTodos}
              >
                <span>
                  {total.toLocaleString("pt-BR")}{" "}
                  {total === 1 ? "resultado" : "resultados"}
                </span>
                <span className={styles.footerLink}>
                  Ver todos <ArrowUpRight size={13} aria-hidden />
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

