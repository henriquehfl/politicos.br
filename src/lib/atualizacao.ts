/**
 * Intervalos de atualização automática usados pelo cliente e pelos caches
 * do servidor. Manter os dois lados alinhados evita polling que só recebe
 * a mesma resposta cacheada.
 */
export const REFRESH_VOTACOES_MS = 5 * 60_000;
export const REFRESH_PERFIL_MS = 15 * 60_000;
export const REFRESH_NOTICIAS_MS = 10 * 60_000;
export const REFRESH_INDICE_MS = 60 * 60_000;
