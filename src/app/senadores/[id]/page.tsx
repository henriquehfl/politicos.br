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
import { buildSenador, buildSenadorBase, getSenadorResumo } from "@/lib/api/senado";

// A ficha-base é resolvida antes do dossiê; o streaming fica restrito aos
// blocos pesados e não atrasa o HTML inicial.
export const instant = false;

type SenadorParams = PageProps<"/senadores/[id]">["params"];

export default async function SenadorPage({
  params,
}: PageProps<"/senadores/[id]">) {
  const { id } = await params;
  const politico = await buildSenadorBase(id);
  if (!politico) notFound();

  // Ficha básica primeiro; o dossiê completo (discursos, votações, autorias)
  // chega em blocos independentes para não bloquear a primeira pintura.
  const dossie = buildSenador(id);

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