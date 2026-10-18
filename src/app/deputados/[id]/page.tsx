import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoliticoProfileView } from "@/components/PoliticoProfileView";
import { buildDeputado, getDeputadoResumo } from "@/lib/api/camara";

type DeputadoParams = PageProps<"/deputados/[id]">["params"];

async function DeputadoContent({ params }: { params: DeputadoParams }) {
  const { id } = await params;
  const politico = await buildDeputado(id);
  if (!politico) notFound();
  return <PoliticoProfileView politico={politico} />;
}

export async function generateMetadata({
  params,
}: {
  params: DeputadoParams;
}): Promise<Metadata> {
  const { id } = await params;
  const politico = await getDeputadoResumo(id);

  if (!politico) {
    return {
      title: "Deputado não encontrado — POLITICOS.BR",
      description:
        "Não localizamos este deputado na API de Dados Abertos da Câmara.",
    };
  }

  const { nome, partido, uf } = politico;
  return {
    title: `${nome} (${partido}/${uf}) — POLITICOS.BR`,
    description: `Linha do tempo de ${nome}, deputado federal por ${uf} (${partido}): votações nominais, discursos, despesas da cota parlamentar e filiações partidárias.`,
    openGraph: {
      title: `${nome} (${partido}/${uf})`,
      description: `Histórico parlamentar de ${nome} com dados oficiais da Câmara dos Deputados.`,
      type: "profile",
    },
  };
}

export default function DeputadoPage({ params }: PageProps<"/deputados/[id]">) {
  return (
    <Suspense
      fallback={
        <p className="page-loading">Carregando dados da Câmara dos Deputados…</p>
      }
    >
      <DeputadoContent params={params} />
    </Suspense>
  );
}
