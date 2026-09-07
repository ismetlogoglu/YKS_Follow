import type { Metadata } from "next";
import { GirisFormu } from "@/components/auth-forms";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Giriş yap" };

const HATALAR: Record<string, string> = {
  google: "Google ile giriş başlatılamadı. Lütfen tekrar dene.",
  dogrulama: "Doğrulama bağlantısı geçersiz. Yeniden giriş yapmayı dene.",
  suresi_doldu: "Doğrulama bağlantısının süresi dolmuş. Yeni bir bağlantı iste.",
  oturum_devri:
    "E-postan doğrulandı. Bağlantıyı kaydolduğun tarayıcıdan farklı bir yerde açtığın için oturum otomatik açılamadı — aşağıdan e-posta ve şifrenle giriş yapabilirsin.",
};

export default async function GirisSayfasi({ searchParams }: PageProps<"/giris">) {
  const sp = await searchParams;
  const devam = typeof sp.devam === "string" ? sp.devam : undefined;
  const hataKodu = typeof sp.hata === "string" ? sp.hata : undefined;
  const hata = hataKodu ? HATALAR[hataKodu] : undefined;
  // Doğrulama başarılı, yalnızca oturum bu tarayıcıya taşınamadı — bu bir hata değil.
  const tonu = hataKodu === "oturum_devri" ? "success" : "danger";

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-heading">Tekrar hoş geldin</h1>
      <p className="mt-1 mb-6 text-sm text-muted-ink">
        Çalışmanı kaydetmek için hesabına giriş yap.
      </p>
      <GirisFormu devam={devam} uyari={hata} uyariTonu={tonu} />
    </Card>
  );
}
