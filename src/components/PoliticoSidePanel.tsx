"use client";

import {
  Activity,
  AtSign,
  BadgeCheck,
  Briefcase,
  Cake,
  CalendarCheck,
  Camera,
  CirclePlay,
  ExternalLink,
  Globe,
  Landmark,
  Link2,
  MapPin,
  Newspaper,
  Scale,
  Users,
  Video,
  Vote,
  type LucideIcon,
} from "lucide-react";
import type { ElectionInfo, MediaKind, Politico } from "@/lib/types";
import { newsSearchUrl } from "@/lib/media";
import styles from "./side-panel.module.css";

interface PoliticoSidePanelProps {
  politico: Politico | null;
  modo: "auto" | "aberto" | "fechado";
  onToggle: () => void;
}

const MEDIA_ICON: Record<MediaKind, LucideIcon> = {
  youtube: CirclePlay,
  instagram: Camera,
  tiktok: Video,
  x: AtSign,
  facebook: Users,
  site: Globe,
  noticias: Newspaper,
  outro: Link2,
};

function formatarData(iso?: string): string | null {
  if (!iso) return null;
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
}

function numero(valor?: number): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function rotuloResultado(resultado: ElectionInfo["resultado"]): string {
  if (resultado === "eleito") return "Eleito";
  if (resultado === "suplente") return "Suplente";
  if (resultado === "nao_eleito") return "Não eleito";
  return "Candidato";
}

/** "48" ou "57ª" -> "48ª legislatura" */
function legislaturaLabel(valor: string): string {
  if (!/^\d+/.test(valor)) return "Legislatura não informada";
  return `${valor.replace(/[ªa]$/i, "")}ª legislatura`;
}

/** Ano inicial e final da legislatura (48ª = 1987–1991; 57ª = 2023–2027). */
function periodoLegislatura(valor: string): string | null {
  const numeroLeg = Number(valor.replace(/\D/g, ""));
  if (!Number.isInteger(numeroLeg) || numeroLeg < 48 || numeroLeg > 57) return null;
  const inicio = 2023 - (57 - numeroLeg) * 4;
  return `${inicio}–${inicio + 4}`;
}

export function PoliticoSidePanel({
  politico,
  modo,
  onToggle,
}: PoliticoSidePanelProps) {
  if (!politico) return null;

  const classePainel =
    modo === "auto"
      ? styles.panelAuto
      : modo === "aberto"
        ? styles.panelOpen
        : styles.panelFechado;
  const classeToggle =
    modo === "auto"
      ? styles.toggleAuto
      : modo === "aberto"
        ? styles.toggleAberto
        : styles.toggleFechado;

  const { bio, atividade, midia, profissoes, frentes } = politico;
  const cargos = politico.cargos ?? [];
  const situacaoAtual =
    politico.situacaoAtual ?? cargos.find((cargo) => cargo.atual) ?? null;
  const periodo = periodoLegislatura(politico.legislatura);
  const oficiais = (midia ?? []).filter((m) => m.oficial);
  const buscas = (midia ?? []).filter((m) => !m.oficial);
  const nascimento = formatarData(bio?.nascimento);
  const perfilOficial =
    politico.cargo === "deputado"
      ? `https://www.camara.leg.br/deputados/${politico.id}`
      : `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${politico.id}`;

  return (
    <>
      <button
        type="button"
        className={`${styles.toggle} ${classeToggle}`}
        onClick={onToggle}
        aria-expanded={modo === "auto" ? undefined : modo === "aberto"}
        aria-label="Alternar painel do parlamentar"
      >
        <span className={styles.setaAberta} aria-hidden>
          ‹
        </span>
        <span className={styles.setaFechada} aria-hidden>
          ›
        </span>
      </button>

      <aside
        className={`${styles.panel} ${classePainel}`}
        aria-label="Ficha do parlamentar"
      >
        <header className={styles.panelHeader}>
          {politico.fotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.foto}
              src={politico.fotoUrl}
              alt={`Foto de ${politico.nome}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
          <h2 className={styles.nome}>{politico.nome}</h2>
          <p className={styles.cargo}>
            {situacaoAtual
              ? `${situacaoAtual.cargo} · em exercício`
              : `${politico.cargo === "deputado" ? "Deputado Federal" : "Senador"} · ${
                  politico.vigente ? "Em exercício" : "Histórico"
                }`}
          </p>
          {situacaoAtual && (
            <p className={styles.cargoSecundario}>
              {politico.cargo === "deputado" ? "Deputado Federal" : "Senador"} ·{" "}
              {politico.vigente ? "em exercício" : "histórico"}
            </p>
          )}
          <div className={styles.chips}>
            <span className={styles.chip}>
              {politico.partido}/{politico.uf}
            </span>
            <span className={styles.chip}>
              {legislaturaLabel(politico.legislatura)}
            </span>
            {periodo && <span className={styles.chip}>{periodo}</span>}
            {bio?.idade !== undefined && (
              <span className={styles.chip}>{bio.idade} anos</span>
            )}
          </div>
        </header>

        {politico.eleicao && (
          <section className={styles.block}>
            <h3>
              <Vote size={12} aria-hidden /> Eleições {politico.eleicao.ano}
            </h3>
            {politico.eleicao.disponivel ? (
              politico.eleicao.resultado ? (
                <>
                  <p className={styles.eleicaoVotos}>
                    {politico.eleicao.resultado.votos !== undefined
                      ? numero(politico.eleicao.resultado.votos)
                      : "—"}
                    <span> votos</span>
                  </p>
                  <p className={styles.eleicaoResultado}>
                    <strong
                      data-resultado={politico.eleicao.resultado.resultado}
                    >
                      {politico.eleicao.resultado.situacao ??
                        rotuloResultado(politico.eleicao.resultado.resultado)}
                    </strong>
                    {politico.eleicao.resultado.percentual !== undefined && (
                      <>
                        {" "}
                        ·{" "}
                        {politico.eleicao.resultado.percentual.toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                        % dos válidos
                      </>
                    )}
                  </p>
                  <p className={styles.muted}>
                    {politico.eleicao.resultado.cargo}
                    {politico.eleicao.resultado.partido
                      ? ` · ${politico.eleicao.resultado.partido}`
                      : ""}
                    {politico.eleicao.resultado.coligacao
                      ? ` · ${politico.eleicao.resultado.coligacao}`
                      : ""}
                    {politico.eleicao.resultado.turno
                      ? ` · ${politico.eleicao.resultado.turno}º turno`
                      : ""}
                  </p>
                  <a
                    className={styles.linkFonte}
                    href={
                      politico.eleicao.resultado.fonte?.href ??
                      politico.eleicao.consulta.href
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Resultado oficial no TSE ↗
                  </a>
                </>
              ) : (
                <>
                  <p className={styles.muted}>
                    Sem candidatura registrada nesta eleição.
                  </p>
                  <a
                    className={styles.linkFonte}
                    href={politico.eleicao.consulta.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar resultados no TSE ↗
                  </a>
                </>
              )
            ) : (
              <>
                <p className={styles.muted}>
                  Não foi possível consultar o TSE agora.
                </p>
                <a
                  className={styles.linkFonte}
                  href={politico.eleicao.consulta.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Consultar resultados no TSE ↗
                </a>
              </>
            )}
            <p className={styles.nota}>
              Dados oficiais do TSE. A plataforma não classifica nem emite juízo
              de valor.
            </p>
          </section>
        )}

        {cargos.length > 0 && (
          <section className={styles.block}>
            <h3>
              <Landmark size={12} aria-hidden /> Trajetória pública
            </h3>
            <ul className={styles.trajetoria}>
              {cargos.map((cargo) => (
                <li
                  key={`${cargo.cargo}-${cargo.inicio}`}
                  className={cargo.atual ? styles.trajetoriaAtual : undefined}
                >
                  <div>
                    <strong>{cargo.cargo}</strong>
                    {cargo.atual && <em className={styles.atual}>em exercício</em>}
                  </div>
                  <span>
                    {cargo.periodo} · {cargo.partido}
                  </span>
                  {cargo.vice && <span>Vice-presidente: {cargo.vice}</span>}
                </li>
              ))}
            </ul>
            <a
              className={styles.linkFonte}
              href={cargos[0].fonte.href}
              target="_blank"
              rel="noreferrer"
            >
              {cargos[0].fonte.label} ↗
            </a>
          </section>
        )}

        {bio && (bio.nascimento || bio.naturalidade || bio.nomeCivil) && (
          <section className={styles.block}>
            <h3>
              <Cake size={12} aria-hidden /> Perfil
            </h3>
            <dl className={styles.dl}>
              {bio.nomeCivil && (
                <div>
                  <dt>Nome civil</dt>
                  <dd>{bio.nomeCivil}</dd>
                </div>
              )}
              {nascimento && (
                <div>
                  <dt>Nascimento</dt>
                  <dd>
                    {nascimento}
                    {bio.idade !== undefined ? ` · ${bio.idade} anos` : ""}
                  </dd>
                </div>
              )}
              {bio.naturalidade && (
                <div>
                  <dt>Naturalidade</dt>
                  <dd>{bio.naturalidade}</dd>
                </div>
              )}
              {politico.escolaridade && politico.escolaridade !== "—" && (
                <div>
                  <dt>Escolaridade</dt>
                  <dd>{politico.escolaridade}</dd>
                </div>
              )}
              {bio.falecimento && (
                <div>
                  <dt>Falecimento</dt>
                  <dd>{formatarData(bio.falecimento)}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {atividade && (
          <section className={styles.block}>
            <h3>
              <Activity size={12} aria-hidden /> Atividade parlamentar
            </h3>
            <ul className={styles.numeros}>
              <li>
                <strong>{numero(atividade.votacoes)}</strong>
                <span>votos nominais</span>
              </li>
              <li>
                <strong>{numero(atividade.discursos)}</strong>
                <span>discursos</span>
              </li>
              <li>
                <strong>{numero(atividade.proposicoes)}</strong>
                <span>proposições</span>
              </li>
              {atividade.relatorias !== undefined && (
                <li>
                  <strong>{numero(atividade.relatorias)}</strong>
                  <span>relatorias</span>
                </li>
              )}
              {(atividade.frentes ?? 0) > 0 && (
                <li>
                  <strong>{numero(atividade.frentes)}</strong>
                  <span>frentes</span>
                </li>
              )}
              {(atividade.despesas ?? 0) > 0 && (
                <li>
                  <strong>{numero(atividade.despesas)}</strong>
                  <span>despesas</span>
                </li>
              )}
            </ul>
          </section>
        )}

        <section className={styles.block}>
          <h3>
            <Landmark size={12} aria-hidden /> Dados do mandato
          </h3>
          <dl className={styles.dl}>
            <div>
              <dt>Partido</dt>
              <dd>{politico.partido}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{politico.uf}</dd>
            </div>
            <div>
              <dt>Legislatura</dt>
              <dd>
                {legislaturaLabel(politico.legislatura)}
                {periodo ? ` (${periodo})` : ""}
              </dd>
            </div>
            <div>
              <dt>Sexo</dt>
              <dd>{politico.sexo}</dd>
            </div>
            <div>
              <dt>Condição</dt>
              <dd>{politico.condicao}</dd>
            </div>
          </dl>
        </section>

        {politico.stats && (
          <section className={styles.block}>
            <h3>
              <CalendarCheck size={12} aria-hidden /> Assiduidade & CEAP
            </h3>
            <dl className={styles.dl}>
              <div>
                <dt>Presença média</dt>
                <dd>
                  {politico.stats.presencaMedia === null
                    ? "—"
                    : `${politico.stats.presencaMedia}%`}
                </dd>
              </div>
              <div>
                <dt>Votos nominais analisados</dt>
                <dd>{politico.stats.diasTrabalhados}</dd>
              </div>
              <div>
                <dt>CEAP acumulado</dt>
                <dd>
                  {politico.stats.ceapTotal === null
                    ? "—"
                    : politico.stats.ceapTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                </dd>
              </div>
            </dl>
            {politico.stats.presencaMedia === null && (
              <p className={styles.nota}>
                {politico.cargo === "senador"
                  ? "O Senado não publica CEAP nesta base; a presença é calculada apenas para deputados em exercício."
                  : "A presença é calculada apenas para deputados em exercício, com base nas votações nominais dos últimos 12 meses. Mandatos encerrados ficam sem o indicador."}
              </p>
            )}
          </section>
        )}

        <section className={styles.block}>
          <h3>
            <MapPin size={12} aria-hidden /> Gabinete
            {politico.vigente ? "" : " (último registro)"}
          </h3>
          <dl className={styles.dl}>
            <div>
              <dt>Prédio</dt>
              <dd>{politico.gabinete.predio}</dd>
            </div>
            <div>
              <dt>Sala</dt>
              <dd>{politico.gabinete.sala}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{politico.gabinete.telefone}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {politico.gabinete.email !== "—" ? (
                  <a href={`mailto:${politico.gabinete.email}`}>
                    {politico.gabinete.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>


        {politico.comissoes.length > 0 && (
          <section className={styles.block}>
            <h3>
              <Landmark size={12} aria-hidden /> Órgãos e comissões
            </h3>
            <ul className={styles.comissoes}>
              {politico.comissoes.map((c) => (
                <li key={`${c.sigla}-${c.nome}`}>
                  <strong>{c.sigla}</strong> — {c.titularidade}
                  <span className={styles.comissaoNome}>{c.nome}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profissoes && profissoes.length > 0 && (
          <section className={styles.block}>
            <h3>
              <Briefcase size={12} aria-hidden /> Atuação profissional
            </h3>
            <ul className={styles.lista}>
              {profissoes.slice(0, 12).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        )}

        {frentes && frentes.length > 0 && (
          <section className={styles.block}>
            <h3>
              <Users size={12} aria-hidden /> Frentes parlamentares
            </h3>
            <ul className={styles.lista}>
              {frentes.slice(0, 10).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {(politico.polemicas ?? 0) > 0 && (
          <section className={styles.block}>
            <h3>
              <Scale size={12} aria-hidden /> Polêmicas e embates
            </h3>
            <p className={styles.muted}>
              {politico.polemicas} evento(s) sinalizado(s) por embate,
              investigação ou fala polêmica na linha do tempo.
            </p>
            <a
              className={styles.linkFonte}
              href={newsSearchUrl(politico.nome)}
              target="_blank"
              rel="noreferrer"
            >
              Ver notícias relacionadas ↗
            </a>
          </section>
        )}

        {midia && midia.length > 0 && (
          <section className={styles.block}>
            <h3>
              <Link2 size={12} aria-hidden /> Redes, vídeos e notícias
            </h3>
            <ul className={styles.midia}>
              {[...oficiais, ...buscas].map((m) => {
                const Icon = MEDIA_ICON[m.tipo] ?? Link2;
                return (
                  <li key={`${m.tipo}-${m.url}`}>
                    <a href={m.url} target="_blank" rel="noreferrer">
                      <Icon size={13} aria-hidden />
                      <span>{m.label}</span>
                      {m.oficial && (
                        <em className={styles.oficial}>
                          <BadgeCheck size={11} aria-hidden /> oficial
                        </em>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className={styles.nota}>
              Perfis oficiais vêm das bases da Câmara e do Senado. Os demais
              atalhos abrem busca pública na plataforma.
            </p>
          </section>
        )}

        <section className={styles.block}>
          <h3>
            <ExternalLink size={12} aria-hidden /> Fontes oficiais
          </h3>
          <ul className={styles.comissoes}>
            <li>
              <a
                className={styles.linkFonte}
                href={perfilOficial}
                target="_blank"
                rel="noreferrer"
              >
                Perfil oficial ↗
              </a>
              <span className={styles.comissaoNome}>
                {politico.cargo === "deputado"
                  ? "Câmara dos Deputados"
                  : "Senado Federal"}
              </span>
            </li>
            <li>
              <a
                className={styles.linkFonte}
                href={
                  politico.cargo === "deputado"
                    ? `https://dadosabertos.camara.leg.br/api/v2/deputados/${politico.id}`
                    : `https://legis.senado.leg.br/dadosabertos/senador/${politico.id}.json`
                }
                target="_blank"
                rel="noreferrer"
              >
                API de Dados Abertos ↗
              </a>
              <span className={styles.comissaoNome}>
                JSON com os dados brutos deste parlamentar
              </span>
            </li>
            <li>
              <a
                className={styles.linkFonte}
                href="https://divulgacandcontas.tse.jus.br/divulga/#/"
                target="_blank"
                rel="noreferrer"
              >
                Divulgação de candidaturas (TSE) ↗
              </a>
              <span className={styles.comissaoNome}>
                Prestações de contas e resultados eleitorais
              </span>
            </li>
            <li>
              <a
                className={styles.linkFonte}
                href="https://transparencia.portal.gov.br/"
                target="_blank"
                rel="noreferrer"
              >
                Portal da Transparência ↗
              </a>
              <span className={styles.comissaoNome}>
                Servidores, benefícios e gastos públicos
              </span>
            </li>
          </ul>
        </section>
      </aside>
    </>
  );
}

