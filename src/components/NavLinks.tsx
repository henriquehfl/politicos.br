"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, navItemAtivo } from "./nav-items";
import styles from "./navbar.module.css";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Principal">
      {NAV_ITEMS.map((item) => {
        const { href, label, icon: Icon } = item;
        const ativo = navItemAtivo(pathname, item);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${ativo ? styles.linkAtivo : ""}`}
            aria-current={ativo ? "page" : undefined}
            aria-label={label}
            title={label}
          >
            <Icon size={14} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
