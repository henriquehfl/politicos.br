import { getPoliticosIndex } from "@/lib/api/search";
import { encodeIndex, INDICE_VERSAO } from "@/lib/politicos-index";

/**
 * Índice compacto usado pela busca instantânea no navegador.
 * A resposta é cacheável e o cliente guarda em sessionStorage.
 */
export async function GET() {
  const index = await getPoliticosIndex();
  const items = encodeIndex(index);

  return Response.json(
    { versao: INDICE_VERSAO, total: items.length, items },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
