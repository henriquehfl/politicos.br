import { History, Trophy, Users, Vote, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Prefixos adicionais que também ativam este item. */
  match?: string[];
  /** Só fica ativo na rota exata (ex.: home). */
  exact?: boolean;
}

/**
 * Fonte única da navegação principal. A listagem é uma só (`/politicos`),
 * mas continua ativa também nos recortes por Casa.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Linha do tempo", icon: History, exact: true },
  {
    href: "/politicos",
    label: "Políticos",
    icon: Users,
    match: ["/deputados", "/senadores"],
  },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/votacoes", label: "Votações", icon: Vote },
];

export function navItemAtivo(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  if (item.match?.some((base) => pathname === base || pathname.startsWith(`${base}/`))) {
    return true;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
