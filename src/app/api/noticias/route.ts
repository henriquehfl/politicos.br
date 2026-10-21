import {
  buscarNoticias,
  type NoticiaCargo,
} from "@/lib/noticias";

const CARGOS = new Set<NoticiaCargo>(["deputado", "senador"]);

/**
 * Notícias recentes de um parlamentar.
 * A consulta é feita por nome + cargo para reduzir homônimos e o resultado
 * fica cacheado por 5 minutos na borda.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nome = (searchParams.get("nome") ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const cargoParam = searchParams.get("cargo");

  if (
    nome.length < 2 ||
    nome.length > 90 ||
    !/^[\p{L}\s.'-]+$/u.test(nome)
  ) {
    return Response.json(
      { erro: "Informe um nome válido para buscar notícias." },
      { status: 400 },
    );
  }

  if (!cargoParam || !CARGOS.has(cargoParam as NoticiaCargo)) {
    return Response.json(
      { erro: "Cargo inválido. Use deputado ou senador." },
      { status: 400 },
    );
  }

  const resultado = await buscarNoticias({
    nome,
    cargo: cargoParam as NoticiaCargo,
  });

  return Response.json(resultado, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
