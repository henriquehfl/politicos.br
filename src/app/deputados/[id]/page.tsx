import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoliticoProfileView } from "@/components/PoliticoProfileView";
import {
  PoliticoDossiePainel,
  PoliticoDossieStats,
  PoliticoDossieTimeline,
} from "@/components/PoliticoDossie";
import {
  PoliticoPainelSkeleton,
  PoliticoStatsSkeleton,
  PoliticoTimelineSkeleton,
} from "@/components/PoliticoPerfilSkeleton";
import { buildDeputado, buildDeputadoBase, getDeputadoResumo } from "@/lib/api/camara";

// A ficha-base é resolvida antes do dossiê; o streaming fica restrito aos
// blocos pesados e não atrasa o HTML inicial.
export const instant = false;

type DeputadoParams = PageProps<"/deputados/[id]">["params"];

export default async function DeputadoPage({
  params,
}: PageProps<"/deputados/[id]">) {
  const { id } = await params;
  const politico = await buildDeputadoBase(id);
  if (!politico) notFound();

  // A ficha básica já está pronta. O dossiê pesado começa agora e cada bloco
  // abaixo resolve no seu próprio boundary, sem bloquear o HTML inicial.
  const dossie = buildDeputado(id);

  return (
    <PoliticoProfileView
      politico={politico}
      stats={
        <Suspense fallback={<PoliticoStatsSkeleton />}>
          <PoliticoDossieStats dossie={dossie} />
        </Suspense>
      }
      timeline={
        <Suspense fallback={<PoliticoTimelineSkeleton />}>
          <PoliticoDossieTimeline dossie={dossie} />
        </Suspense>
      }
      painel={
        <Suspense fallback={<PoliticoPainelSkeleton />}>
          <PoliticoDossiePainel dossie={dossie} />
        </Suspense>
      }
    />
  );
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