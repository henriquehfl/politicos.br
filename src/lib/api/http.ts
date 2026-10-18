/**
 * Cliente HTTP base para as APIs públicas do Congresso Nacional.
 * - Cache em memória (processo) com TTL para evitar re-fetch em cada render.
 * - Deduplicação de requisições concorrentes para a mesma URL.
 * - Timeout e uma retentativa curta para não travar páginas.
 * - Retorna null em falha para que a UI degrade graciosamente.
 */

const DEFAULT_TTL = 1000 * 60 * 10; // 10 minutos
const memory = new Map<string, { at: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

interface FetchOpts {
  ttl?: number;
  timeoutMs?: number;
  accept?: string;
}

async function requestJson<T>(url: string, opts: FetchOpts): Promise<T | null> {
  const { timeoutMs = 8000, accept } = opts;

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: accept ?? "application/json",
          "User-Agent": "POLITICOS.BR/1.0 (+dados abertos)",
        },
        // Participa do cache de dados do Next quando aplicável.
        next: { revalidate: 600 },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as T;
      memory.set(url, { at: Date.now(), data });
      return data;
    } catch {
      // Falha de rede/timeout: tenta mais uma vez antes de desistir.
      if (tentativa === 1) return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

export async function fetchJson<T>(
  url: string,
  opts: FetchOpts = {},
): Promise<T | null> {
  const { ttl = DEFAULT_TTL } = opts;
  const cached = memory.get(url);
  if (cached && Date.now() - cached.at < ttl) {
    return cached.data as T;
  }

  const pending = inFlight.get(url);
  if (pending) return pending as Promise<T | null>;

  const promise = requestJson<T>(url, opts).finally(() => {
    inFlight.delete(url);
  });
  inFlight.set(url, promise);
  return promise;
}

/** fetch de texto (XML retornado como JSON em endpoints .json, mas alguns exigem texto) */
export async function fetchText(
  url: string,
  opts: FetchOpts = {},
): Promise<string | null> {
  const { ttl = DEFAULT_TTL, timeoutMs = 8000 } = opts;
  const cached = memory.get(url);
  if (cached && Date.now() - cached.at < ttl) return cached.data as string;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "POLITICOS.BR/1.0" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    memory.set(url, { at: Date.now(), data: text });
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
export const SENADO = "https://legis.senado.leg.br/dadosabertos";

