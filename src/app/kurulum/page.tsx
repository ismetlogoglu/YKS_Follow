import type { Metadata } from "next";
import { Wordmark } from "@/components/brand";
import { ProfilFormu, type ProfilBaslangic } from "@/components/profil-formu";
import { gerekliProfil, hedefNetler } from "@/lib/db";

export const metadata: Metadata = { title: "Profil kurulumu" };

export default async function KurulumSayfasi() {
  const { user, profil } = await gerekliProfil({ kurulumZorunlu: false });
  const hedefler = await hedefNetler(user.id);

  const baslangic: ProfilBaslangic = {
    adSoyad: profil?.ad_soyad ?? "",
    alan: profil?.alan ?? null,
    hedefUniversite: profil?.hedef_universite ?? "",
    hedefBolum: profil?.hedef_bolum ?? "",
    hedefSiralama: profil?.hedef_siralama?.toString() ?? "",
    sinavTarihi: profil?.sinav_tarihi ?? "",
    hedefler: Object.fromEntries(hedefler.map((h) => [h.ders, Number(h.hedef_net)])),
  };

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Wordmark className="mb-8" />
        <h1 className="text-2xl font-semibold text-heading">Profilini oluştur</h1>
        <p className="mt-1 mb-6 text-sm text-muted-ink">
          Alanına göre TYT ve AYT derslerini ayarlayacağız. Bunları sonradan
          Ayarlar&apos;dan değiştirebilirsin.
        </p>
        <ProfilFormu baslangic={baslangic} mod="kurulum" />
      </div>
    </main>
  );
}
