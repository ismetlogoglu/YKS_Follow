import type { Metadata } from "next";
import { GirisFormu } from "@/components/auth-forms";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Giriş yap" };

const HATALAR: Record<string, string> = {
  google: "Google ile giriş başlatılamadı. Lütfen tekrar dene.",
  dogrulama: "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeniden giriş yapmayı dene.",
};

export default async function GirisSayfasi({ searchParams }: PageProps<"/giris">) {
  const sp = await searchParams;
  const devam = typeof sp.devam === "string" ? sp.devam : undefined;
  const hata = typeof sp.hata === "string" ? HATALAR[sp.hata] : undefined;

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-heading">Tekrar hoş geldin</h1>
      <p className="mt-1 mb-6 text-sm text-muted-ink">
        Çalışmanı kaydetmek için hesabına giriş yap.
      </p>
      <GirisFormu devam={devam} uyari={hata} />
    </Card>
  );
}
