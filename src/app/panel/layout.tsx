import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { AltNav, UstNav } from "@/components/panel-nav";
import { Button } from "@/components/ui";
import { cikisYap } from "@/app/auth/actions";
import { gerekliProfil } from "@/lib/db";
import { ALAN_ADI } from "@/lib/yks";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const { profil } = await gerekliProfil();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/panel" className="min-w-0">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="truncate text-sm font-medium text-heading">
                {profil.ad_soyad ?? profil.email}
              </p>
              <p className="text-xs text-muted-ink">
                {profil.alan ? ALAN_ADI[profil.alan] : "Alan seçilmedi"}
              </p>
            </div>

            {profil.is_admin && (
              <Link href="/admin">
                <Button variant="outline" size="sm" title="Yönetici paneli">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}

            <form action={cikisYap}>
              <Button type="submit" variant="ghost" size="sm" title="Çıkış yap">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Çıkış</span>
              </Button>
            </form>
          </div>
        </div>
        <UstNav />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 md:pb-10">{children}</main>

      <AltNav />
    </>
  );
}
