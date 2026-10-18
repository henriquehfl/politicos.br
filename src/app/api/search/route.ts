import { NextResponse } from "next/server";
import { searchPoliticosApi } from "@/lib/api/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 80);
  const limite = Number(searchParams.get("limit") ?? 12);
  const limit = Number.isFinite(limite)
    ? Math.min(Math.max(Math.trunc(limite), 1), 60)
    : 12;
  const cargoParam = searchParams.get("cargo");
  const cargo =
    cargoParam === "deputado" || cargoParam === "senador"
      ? cargoParam
      : undefined;
  const somenteVigentes = searchParams.get("vigente") === "1";
  const inicio = Date.now();

  try {
    const encontrados = await searchPoliticosApi(q, {
      limit: 4000,
      cargo,
      somenteVigentes,
    });
    const results = encontrados.slice(0, limit);

    return NextResponse.json(
      {
        query: q,
        total: encontrados.length,
        ms: Date.now() - inicio,
        results,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { query: q, total: 0, ms: Date.now() - inicio, results: [] },
      { status: 200 },
    );
  }
}

