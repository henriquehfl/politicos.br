import {
  Activity,
  AtSign,
  BadgeCheck,
  Briefcase,
  Cake,
  CalendarCheck,
  Camera,
  CirclePlay,
  Globe,
  Landmark,
  Link2,
  Newspaper,
  Scale,
  Users,
  Video,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { newsSearchUrl } from "@/lib/media";
import type { ElectionInfo, MediaKind, Politico } from "@/lib/types";
import styles from "./side-panel.module.css";

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

/**
 * Blocos do painel que dependem do dossiê completo (TSE, trajetória,
 * atividade, comissões, frentes e mídia). Fica num Server Component separado
 * para ser transmitido depois da ficha básica.
 */
export function PoliticoPainelDossie({ politico }: { politico: Politico }) {
  const { bio, atividade, midia, profissoes, frentes } = politico;
  const cargos = politico.cargos ?? [];
  const oficiais = (midia ?? []).filter((m) => m.oficial);
  const buscas = (midia ?? []).filter((m) => !m.oficial);
  const nascimento = formatarData(bio?.nascimento);

  return (
    <>
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
                  <strong data-resultado={politico.eleicao.resultado.resultado}>
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
    </>
  );
}
