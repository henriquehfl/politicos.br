import Link from "next/link";
import styles from "@/app/listagem.module.css";

const ITENS = [
  { id: "todos", href: "/politicos", label: "Todos" },
  { id: "deputado", href: "/deputados", label: "Câmara" },
  { id: "senador", href: "/senadores", label: "Senado" },
] as const;

/** Alterna entre a listagem unificada e os recortes de cada Casa. */
export function CasaNav({
  ativo,
}: {
  ativo: "todos" | "deputado" | "senador";
}) {
  return (
    <nav className={styles.casaNav} aria-label="Navegar por Casa">
      {ITENS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`${styles.casaLink} ${
            ativo === item.id ? styles.casaAtivo : ""
          }`}
          aria-current={ativo === item.id ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
