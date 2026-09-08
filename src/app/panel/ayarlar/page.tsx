import type { Metadata } from "next";
import { ProfilFormu, type ProfilBaslangic } from "@/components/profil-formu";
import { Alert, GeriBaglantisi } from "@/components/ui";
import { gerekliProfil, hedefNetler } from "@/lib/db";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function AyarlarSayfasi() {
  const { user, profil } = await gerekliProfil({ adminiYonlendir: true });
  const hedefler = await hedefNetler(user.id);

  const baslangic: ProfilBaslangic = {
    adSoyad: profil.ad_soyad ?? "",
    alan: profil.alan,
    hedefUniversite: profil.hedef_universite ?? "",
    hedefBolum: profil.hedef_bolum ?? "",
    hedefSiralama: profil.hedef_siralama?.toString() ?? "",
    hedefler: Object.fromEntries(hedefler.map((h) => [h.ders, Number(h.hedef_net)])),
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex flex-col gap-5">
      <div>
        <GeriBaglantisi href="/panel">Ana ekran</GeriBaglantisi>
        <h1 className="mt-1 text-2xl font-semibold text-heading">Ayarlar</h1>
        <p className="mt-1 text-sm text-muted-ink">
          Hesap: <span className="font-medium text-ink">{profil.email}</span>
        </p>
      </div>

      <Alert tone="warn">
        Alanını değiştirirsen o alana ait olmayan ders hedefleri silinir. Geçmiş soru ve deneme
        kayıtların olduğu gibi kalır.
      </Alert>

      <ProfilFormu baslangic={baslangic} mod="ayarlar" />
    </div>
  );
}
