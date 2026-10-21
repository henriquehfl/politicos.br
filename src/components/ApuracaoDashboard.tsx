"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import {
  CARGOS_APURACAO,
  UFS,
  rotuloResultado,
  type ApuracaoSnapshot,
  type CargoApuracaoId,
  type UfSigla,
} from "@/lib/apuracao";
import styles from "@/app/apuracao/apuracao.module.css";

const POLL_MS = 30_000;
const LIMITE_INICIAL = 20;

const numero = new Intl.NumberFormat("pt-BR");
const percentual = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatarNumero(valor: number): string {
  return numero.format(valor);
}

function formatarPercentual(valor: number): string {
  return percentual.format(valor);
}

function horaLocal(data: Date | null): string {
  return data
    ? data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "â€”";
}

function sincronizarUrl(uf: UfSigla, cargo: CargoApuracaoId) {
  const params = new URLSearchParams(window.location.search);
  params.set("uf", uf);
  params.set("cargo", cargo);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${params.toString()}`,
  );
}

interface ApuracaoDashboardProps {
  ufInicial?: UfSigla;
  cargoInicial?: CargoApuracaoId;
}

interface RespostaApuracao {
  dados?: ApuracaoSnapshot;
  erro?: string;
}

async function buscarApuracao(
  uf: UfSigla,
  cargo: CargoApuracaoId,
  signal: AbortSignal,
): Promise<RespostaApuracao> {
  try {
    const res = await fetch(`/api/apuracao?uf=${uf}&cargo=${cargo}`, {
      cache: "no-store",
      signal,
    });

    if (!res.ok) throw new Error("Falha ao consultar a apuraÃ§Ã£o.");
    return { dados: (await res.json()) as ApuracaoSnapshot };
  } catch {
    return {
      erro: signal.aborted
        ? "O TSE demorou para responder. Tentando novamenteâ€¦"
        : "NÃ£o foi possÃ­vel consultar o TSE agora. Tentando novamenteâ€¦",
    };
  }
}

export function ApuracaoDashboard({
  ufInicial = "SP",
  cargoInicial = "governador",
}: ApuracaoDashboardProps) {
  const [uf, setUf] = useState<UfSigla>(ufInicial);
  const [cargo, setCargo] = useState<CargoApuracaoId>(cargoInicial);
  const [snapshot, setSnapshot] = useState<ApuracaoSnapshot | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [consultadoEm, setConsultadoEm] = useState<Date | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const requisicao = useRef<AbortController | null>(null);

  const atualizar = useCallback(
    (alvoUf: UfSigla, alvoCargo: CargoApuracaoId) => {
      requisicao.current?.abort();
      const controller = new AbortController();
      requisicao.current = controller;
      const timer = setTimeout(() => controller.abort(), 15_000);

      void buscarApuracao(alvoUf, alvoCargo, controller.signal)
        .then((resultado) => {
          // Uma requisiÃ§Ã£o mais nova substituiu esta: nÃ£o sobrescreve o estado.
          if (requisicao.current !== controller) return;

          if (resultado.dados) {
            setSnapshot(resultado.dados);
            setErro(null);
            setConsultadoEm(new Date());
          } else {
            setErro(resultado.erro ?? "NÃ£o foi possÃ­vel consultar o TSE agora.");
          }
        })
        .finally(() => {
          clearTimeout(timer);
          if (requisicao.current === controller) {
            requisicao.current = null;
            setCarregando(false);
          }
        });
    },
    [],
  );

  useEffect(() => {
    atualizar(uf, cargo);
  }, [uf, cargo, atualizar]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") atualizar(uf, cargo);
    }, POLL_MS);

    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") atualizar(uf, cargo);
    };

    document.addEventListener("visibilitychange", aoFicarVisivel);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoFicarVisivel);
      requisicao.current?.abort();
    };
  }, [uf, cargo, atualizar]);

  function alterarUf(novaUf: UfSigla) {
    setCarregando(true);
    setErro(null);
    setSnapshot(null);
    setUf(novaUf);
    setMostrarTodos(false);
    sincronizarUrl(novaUf, cargo);
  }

  function alterarCargo(novoCargo: CargoApuracaoId) {
    setCarregando(true);
    setErro(null);
    setSnapshot(null);
    setCargo(novoCargo);
    setMostrarTodos(false);
    sincronizarUrl(uf, novoCargo);
  }
  function tentarNovamente() {
    setCarregando(true);
    setErro(null);
    atualizar(uf, cargo);
  }

  const candidatos = snapshot?.candidatos ?? [];
  const visiveis = mostrarTodos
    ? candidatos
    : candidatos.slice(0, LIMITE_INICIAL);
  const barra = Math.min(100, Math.max(0, snapshot?.percentualApurado ?? 0));

  return (
    <section className={styles.dashboard}>
      <div className={styles.controles}>
        <label className={styles.campo}>
          <span>Estado</span>
          <select
            value={uf}
            onChange={(event) => alterarUf(event.target.value as UfSigla)}
          >
            {UFS.map((item) => (
              <option key={item.sigla} value={item.sigla}>
                {item.sigla} â€” {item.nome}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.campo}>
          <span>Cargo</span>
          <select
            value={cargo}
            onChange={(event) =>
              alterarCargo(event.target.value as CargoApuracaoId)
            }
          >
            {CARGOS_APURACAO.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.botaoAtualizar}
          onClick={() => atualizar(uf, cargo)}
        >
          <RefreshCw size={14} aria-hidden />
          Atualizar agora
        </button>
      </div>

      {erro && snapshot && (
        <p className={styles.aviso} role="status">
          {erro}
        </p>
      )}

      {carregando && !snapshot && (
        <p className={styles.loading}>Carregando apuraÃ§Ã£o do TSEâ€¦</p>
      )}

      {!carregando && !snapshot && (
        <div className={styles.erro} role="alert">
          <p>{erro ?? "Nenhum dado de apuraÃ§Ã£o foi encontrado."}</p>
          <button type="button" className={styles.botaoAtualizar} onClick={tentarNovamente}>
            <RefreshCw size={14} aria-hidden />
            Tentar novamente
          </button>
        </div>
      )}

      {snapshot && (
        <>
          <div className={styles.statusLinha} role="status">
            <span
              className={
                snapshot.finalizada ? styles.statusFinal : styles.statusAoVivo
              }
            >
              <Activity size={12} aria-hidden />
              {snapshot.finalizada ? "ApuraÃ§Ã£o concluÃ­da" : "Em apuraÃ§Ã£o"}
            </span>
            <span className={styles.statusTexto}>
              {snapshot.uf} Â· {snapshot.cargoNome} Â· {snapshot.turno}Âº turno
            </span>
            <span className={styles.statusTexto}>
              Gerado pelo TSE: {snapshot.atualizadoEm ?? "â€”"}
            </span>
            <span className={styles.statusTexto}>
              Consulta: {horaLocal(consultadoEm)}
            </span>
          </div>

          <div className={styles.progressoCartao}>
            <div className={styles.progressoCabecalho}>
              <div>
                <span className={styles.rotulo}>SeÃ§Ãµes apuradas</span>
                <strong>{formatarPercentual(snapshot.percentualApurado)}%</strong>
              </div>
              <span className={styles.progressoDetalhe}>
                {formatarNumero(snapshot.secoesApuradas)} de{" "}
                {formatarNumero(snapshot.secoesTotal)} seÃ§Ãµes
              </span>
            </div>
            <div
              className={styles.barra}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={snapshot.percentualApurado}
              aria-label="Percentual de seÃ§Ãµes apuradas"
            >
              <span style={{ width: `${barra}%` }} />
            </div>
          </div>

          <dl className={styles.estatisticas}>
            <div>
              <dt>Comparecimento</dt>
              <dd>{formatarNumero(snapshot.comparecimento)}</dd>
            </div>
            <div>
              <dt>AbstenÃ§Ãµes</dt>
              <dd>{formatarNumero(snapshot.abstencoes)}</dd>
            </div>
            <div>
              <dt>Votos vÃ¡lidos</dt>
              <dd>{formatarNumero(snapshot.votosValidos)}</dd>
            </div>
            <div>
              <dt>Votos totais</dt>
              <dd>{formatarNumero(snapshot.votosTotais)}</dd>
            </div>
          </dl>

          <div className={styles.secaoCabecalho}>
            <div>
              <h2>Candidatos</h2>
              <p>
                {formatarNumero(snapshot.totalCandidatos)}{" "}
                {snapshot.totalCandidatos === 1 ? "candidato" : "candidatos"}{" "}
                Â· ordenados por votos Â· % dos vÃ¡lidos
              </p>
            </div>
            <span className={styles.secaoFonte}>
              {snapshot.finalizada ? "Resultado final" : "Parcial"}
            </span>
          </div>

          {candidatos.length === 0 ? (
            <p className={styles.vazio}>
              Nenhum candidato publicado para este cargo atÃ© agora.
            </p>
          ) : (
            <ol className={styles.lista}>
              {visiveis.map((candidato, indice) => (
                <li
                  key={candidato.id}
                  className={styles.candidato}
                  data-resultado={candidato.resultado}
                >
                  <span className={styles.posicao}>{indice + 1}</span>
                  <div className={styles.candidatoInfo}>
                    <strong>{candidato.nome}</strong>
                    <span className={styles.candidatoMeta}>
                      {candidato.partido}
                      {candidato.coligacao
                        ? ` Â· ${candidato.coligacao}`
                        : ""} Â· nÂº {candidato.numero}
                    </span>
                    {candidato.nomeCompleto !== candidato.nome && (
                      <span className={styles.nomeCompleto}>
                        {candidato.nomeCompleto}
                      </span>
                    )}
                  </div>
                  <div className={styles.candidatoVotos}>
                    <strong>{formatarNumero(candidato.votos)}</strong>
                    <span>{formatarPercentual(candidato.percentual)}%</span>
                  </div>
                  <span
                    className={styles.situacao}
                    data-resultado={candidato.resultado}
                  >
                    {candidato.situacao ??
                      rotuloResultado(candidato.resultado)}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {snapshot.totalCandidatos > LIMITE_INICIAL && (
            <button
              type="button"
              className={styles.verTodos}
              onClick={() => setMostrarTodos((valor) => !valor)}
            >
              {mostrarTodos
                ? "Mostrar menos"
                : `Mostrar todos os ${formatarNumero(snapshot.totalCandidatos)} candidatos`}
            </button>
          )}

          <div className={styles.rodape}>
            <p className={styles.disclaimer}>
              Dados oficiais do TSE, sem projeÃ§Ãµes. A atualizaÃ§Ã£o pode levar
              atÃ© cerca de um minuto, conforme a publicaÃ§Ã£o do tribunal.
              {snapshot.cargo === "senador" &&
                " No Senado, cada eleitor vota em dois candidatos; por isso os votos totais podem superar o comparecimento."}
            </p>
            <a
              className={styles.fonte}
              href={snapshot.fonte.href}
              target="_blank"
              rel="noreferrer"
            >
              Fonte: {snapshot.fonte.label} â†—
            </a>
          </div>
        </>
      )}
    </section>
  );
}
