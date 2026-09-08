import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui";
import { cikisYap } from "@/app/auth/actions";
import { gerekliProfil } from "@/lib/db";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  // Eğitmen buraya hiç düşmez; adminiYonlendir onu /admin'e geri yollar.
  const { profil } = await gerekliProfil({ adminiYonlendir: true });

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/panel" className="min-w-0">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-1">
            <span className="mr-2 hidden truncate text-sm font-medium text-heading sm:block">
              {profil.ad_soyad ?? profil.email}
            </span>

            <Link href="/panel/ayarlar">
              <Button variant="ghost" size="sm" title="Ayarlar">
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Ayarlar</span>
              </Button>
            </Link>

            <form action={cikisYap}>
              <Button type="submit" variant="ghost" size="sm" title="Çıkış yap">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Çıkış yap</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* 5xl: haftalık program 7 sütun olduğu için 3xl'de ders adları kesiliyordu. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
