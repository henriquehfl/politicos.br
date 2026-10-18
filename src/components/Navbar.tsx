import { Suspense } from "react";
import Link from "next/link";
import { Landmark, Trophy, Users, Vote } from "lucide-react";
import { NavLinks } from "./NavLinks";
import styles from "./navbar.module.css";

const LINKS = [
  { href: "/deputados", label: "Deputados", icon: Users },
  { href: "/senadores", label: "Senadores", icon: Landmark },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/votacoes", label: "Votações", icon: Vote },
];

function NavFallback() {
  return (
    <nav className={styles.nav} aria-label="Principal">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={styles.link}>
          <Icon size={13} aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Navbar() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        POLITICOS<span>.BR</span>
      </Link>
      <Suspense fallback={<NavFallback />}>
        <NavLinks />
      </Suspense>
    </header>
  );
}
