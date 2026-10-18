"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Trophy, Users, Vote } from "lucide-react";
import styles from "./navbar.module.css";

const LINKS = [
  { href: "/deputados", label: "Deputados", icon: Users },
  { href: "/senadores", label: "Senadores", icon: Landmark },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/votacoes", label: "Votações", icon: Vote },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Principal">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${ativo ? styles.linkAtivo : ""}`}
            aria-current={ativo ? "page" : undefined}
          >
            <Icon size={13} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
