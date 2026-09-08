import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, LineChart, PenLine } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button, Card } from "@/components/ui";
import { oturum } from "@/lib/db";

const OZELLIKLER = [
  {
    Icon: PenLine,
    baslik: "Günlük soru girişi",
    metin: "Tarih, ders ve çözdüğün soru sayısını gir; net ve verim otomatik hesaplansın.",
  },
  {
    Icon: ClipboardList,
    baslik: "Deneme sonuçları",
    metin: "Sadece doğru ve yanlışı yaz. Net = Doğru − Yanlış/4 formülü senin yerine çalışsın.",
  },
  {
    Icon: LineChart,
    baslik: "Gelişim takibi",
    metin: "Haftalık soru grafiğin ve net trendin, hedef netlerinle karşılaştırmalı olarak.",
  },
];

export default async function AnaSayfa() {
  const { user, profil } = await oturum();

  // Eğitmen ve öğrenci farklı yerlere düşer; iki panel birbirinden ayrı.
  if (user) redirect(profil?.is_admin ? "/admin" : "/panel");

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Link href="/giris">
              <Button variant="ghost" size="sm">
                Giriş yap
              </Button>
            </Link>
            <Link href="/kayit">
              <Button size="sm">Kayıt ol</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl leading-tight font-semibold text-heading sm:text-4xl">
            Çözdüğün soruyu ve deneme netlerini tek yerden kaydet.
          </h1>
          <p className="mt-4 text-lg text-muted-ink">
            Kaydol, alanını ve net hedeflerini belirle. Sonrası iki tıklama: her gün çözdüğün
            soruyu ve girdiğin denemenin sonucunu yaz — netleri sistem hesaplasın, koçun takip
            etsin.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/kayit">
              <Button size="lg">Ücretsiz başla</Button>
            </Link>
            <Link href="/giris">
              <Button variant="outline" size="lg">
                Hesabım var
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {OZELLIKLER.map(({ Icon, baslik, metin }) => (
            <Card key={baslik} className="p-5">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-heading">{baslik}</h2>
              <p className="mt-1.5 text-sm text-muted-ink">{metin}</p>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-sm text-muted-ink">
        YKS Takip — Sayısal, Sözel ve Eşit Ağırlık için net takip sistemi.
      </footer>
    </>
  );
}
