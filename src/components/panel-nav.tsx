"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  PenLine,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./ui";

type Girdi = { href: string; ad: string; kisa: string; Icon: LucideIcon };

const GIRDILER: Girdi[] = [
  { href: "/panel", ad: "Panel", kisa: "Panel", Icon: LayoutDashboard },
  { href: "/panel/soru", ad: "Soru girişi", kisa: "Soru", Icon: PenLine },
  { href: "/panel/deneme", ad: "Denemeler", kisa: "Deneme", Icon: ClipboardList },
  { href: "/panel/gelisim", ad: "Gelişim", kisa: "Gelişim", Icon: TrendingUp },
  { href: "/panel/ayarlar", ad: "Ayarlar", kisa: "Ayarlar", Icon: Settings },
];

function aktifMi(pathname: string, href: string) {
  return href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);
}

/** Geniş ekran: başlık altındaki yatay sekmeler. */
export function UstNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana menü" className="hidden border-t border-line md:block">
      <ul className="mx-auto flex max-w-6xl gap-1 px-4">
        {GIRDILER.map(({ href, ad, Icon }) => {
          const aktif = aktifMi(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors duration-200",
                  aktif
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-ink hover:border-line-strong hover:text-heading",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {ad}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Dar ekran: sabit alt menü (5 girdi sınırında). */
export function AltNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {GIRDILER.map(({ href, kisa, Icon }) => {
          const aktif = aktifMi(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-200",
                  aktif ? "text-primary" : "text-muted-ink",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {kisa}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
