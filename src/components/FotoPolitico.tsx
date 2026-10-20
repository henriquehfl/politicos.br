"use client";

import { useState } from "react";
import { iniciaisNome, urlFoto } from "@/lib/imagem";

/**
 * Foto oficial com fallback de iniciais. Precisa ser cliente por causa do
 * `onError`; o restante das páginas continua renderizando no servidor.
 */
export function FotoPolitico({
  nome,
  fotoUrl,
  className,
  iniciaisClassName,
  imagemClassName,
}: {
  nome: string;
  fotoUrl?: string;
  className: string;
  iniciaisClassName: string;
  imagemClassName: string;
}) {
  const foto = urlFoto(fotoUrl);
  const [falhou, setFalhou] = useState(false);

  return (
    <span className={className}>
      <span className={iniciaisClassName} aria-hidden>
        {iniciaisNome(nome)}
      </span>
      {foto && !falhou && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt={`Foto de ${nome}`}
          className={imagemClassName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFalhou(true)}
        />
      )}
    </span>
  );
}
