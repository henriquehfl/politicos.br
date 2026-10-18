import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoliticoProfileView } from "@/components/PoliticoProfileView";
import { buildSenador, getSenadorResumo } from "@/lib/api/senado";

type SenadorParams = PageProps<"/senadores/[id]">["params"];

async function SenadorContent({ params }: { params: SenadorParams }) {
  const { id } = await params;
  const politico = await buildSenador(id);
  if (!politico) notFound();
  return <PoliticoProfileView politico={politico} />;
}

export async function generateMetadata({
  params,
}: {
  params: SenadorParams;
}): Promise<Metadata> {
  const { id } = await params;
  const politico = await getSenadorResumo(id);

  if (!politico) {
    return {
      title: "Senador não encontrado — POLITICOS.BR",
      description:
        "Não localizamos este senador na API de Dados Abertos do Senado.",
    };
  }

  const { nome, partido, uf } = politico;
  return {
    title: `${nome} (${partido}/${uf}) — POLITICOS.BR`,
    description: `Linha do tempo de ${nome}, senador por ${uf} (${partido}): votações nominais, pronunciamentos, filiações partidárias e mandatos.`,
    openGraph: {
      title: `${nome} (${partido}/${uf})`,
      description: `Histórico parlamentar de ${nome} com dados oficiais do Senado Federal.`,
      type: "profile",
    },
  };
}

export default function SenadorPage({ params }: PageProps<"/senadores/[id]">) {
  return (
    <Suspense
      fallback={
        <p className="page-loading">Carregando dados do Senado Federal…</p>
      }
    >
      <SenadorContent params={params} />
    </Suspense>
  );
}
