import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { cikisYap } from "@/app/auth/actions";
import { gerekliProfil } from "@/lib/db";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { profil } = await gerekliProfil({ kurulumZorunlu: false });

  // Yetkisiz kullanıcıya admin bölümünün varlığı sızdırılmaz: sessizce panele döner.
  if (!profil?.is_admin) redirect("/panel");

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-heading text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span className="font-semibold tracking-tight">Yönetici paneli</span>
          </span>

          <div className="flex items-center gap-2">
            <Link href="/panel">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/15 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Öğrenci paneli</span>
              </Button>
            </Link>
            <form action={cikisYap}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/15 hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Çıkış</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">{children}</main>
    </>
  );
}
