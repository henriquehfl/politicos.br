import { connection } from "next/server";
import { getApuracao } from "@/lib/api/apuracao";
import { cargoApuracao, ufValida } from "@/lib/apuracao";

/**
 * Snapshot da apuração para o painel em tempo real.
 *
 * Fica em uma rota interna para o navegador não chamar o TSE diretamente
 * (CORS) e para centralizar o cache curto/deduplicação de requisições.
 */
export async function GET(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  const uf = (searchParams.get("uf") ?? "SP").trim().toUpperCase();
  const cargo = cargoApuracao(searchParams.get("cargo") ?? "governador");

  if (!ufValida(uf)) {
    return Response.json({ erro: "UF inválida." }, { status: 400 });
  }

  if (!cargo) {
    return Response.json({ erro: "Cargo inválido." }, { status: 400 });
  }

  const snapshot = await getApuracao(uf, cargo.id);
  if (!snapshot) {
    return Response.json(
      { erro: "Não foi possível consultar o TSE agora." },
      { status: 502 },
    );
  }

  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
