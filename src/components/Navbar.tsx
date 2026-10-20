import { Suspense } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { NavLinks } from "./NavLinks";
import styles from "./navbar.module.css";

function NavFallback() {
  return (
    <nav className={styles.nav} aria-label="Principal">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={styles.link}
          aria-label={label}
          title={label}
        >
          <Icon size={14} aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Navbar() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="POLITICOS.BR — início">
        <span className={styles.brandMark} aria-hidden>
          <Landmark size={16} />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>
            POLITICOS<span>.BR</span>
          </span>
          <span className={styles.brandTagline}>Congresso Nacional em dados</span>
        </span>
      </Link>

      <Suspense fallback={<NavFallback />}>
        <NavLinks />
      </Suspense>

      <span
        className={styles.status}
        title="Índice unificado com Câmara dos Deputados e Senado Federal"
      >
        <span className={styles.statusDot} aria-hidden />
        Câmara + Senado
      </span>
    </header>
  );
}
