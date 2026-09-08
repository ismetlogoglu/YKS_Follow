"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Spinner, cn } from "./ui";

/**
 * useLinkStatus yalnızca bir <Link> içinden okunabildiği için ayrı bileşen.
 * Hedef sayfanın loading.tsx'i devreye girene kadar geçen boşlukta
 * kullanıcı tıklamasının işlendiğini görür.
 */
function Gosterge({ etiket }: { etiket: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="flex items-center gap-1.5" role="status">
      <Spinner />
      <span className="sr-only">{etiket}</span>
    </span>
  );
}

export function YuklenenBaglanti({
  children,
  className,
  gostergeEtiketi = "Yükleniyor…",
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode; gostergeEtiketi?: string }) {
  return (
    <Link className={cn("group", className)} {...props}>
      {children}
      <Gosterge etiket={gostergeEtiketi} />
    </Link>
  );
}
