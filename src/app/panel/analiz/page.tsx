import type { Metadata } from "next";
import { AnalizPaneli } from "@/components/analiz-paneli";
import { DenemeTablolari } from "@/components/deneme-tablolari";
import { GeriBaglantisi } from "@/components/ui";
import { analizVerisi } from "@/lib/analiz";
import { DENEME_SECIMI, denemeleriAc, profilVeVeri, type CalismaKaydi, type DenemeSatiri } from "@/lib/db";
import { turkiyeBugun } from "@/lib/yks";

export const metadata: Metadata = { title: "Analizlerim" };

export default async function AnalizSayfasi() {
  const {
    profil,
    veri: [{ data: kayitVerisi }, { data: denemeVerisi }],
  } = await profilVeVeri({ adminiYonlendir: true }, (kimlik, supabase) =>
    Promise.all([
      // Grafik yalnızca tarih/ders/soru kullanıyor; kalan sütunları taşımaya gerek yok.
      supabase.from("study_logs").select("tarih, ders, soru").eq("user_id", kimlik),
      // Aynı günün denemeleri girildiği sırada kalsın: tablo en son girileni üste koyuyor.
      supabase
        .from("mock_exams")
        .select(DENEME_SECIMI)
        .eq("user_id", kimlik)
        .order("tarih")
        .order("created_at"),
    ]),
  );

  const { denemeler, bolumler } = denemeleriAc((denemeVerisi ?? []) as unknown as DenemeSatiri[]);
  const veri = analizVerisi(
    (kayitVerisi ?? []) as unknown as Pick<CalismaKaydi, "tarih" | "ders" | "soru">[],
    denemeler,
    bolumler,
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <GeriBaglantisi href="/panel">Ana ekran</GeriBaglantisi>
        <h1 className="mt-1 text-2xl font-semibold text-heading">Analizlerim</h1>
        <p className="mt-1 text-sm text-muted-ink">
          Çözdüğün soruların dağılımı, deneme netlerinin seyri ve tüm denemelerinin tablosu.
        </p>
      </div>

      <AnalizPaneli
        alan={profil.alan!}
        bugun={turkiyeBugun()}
        kayitlar={veri.kayitlar}
        denemeler={veri.denemeler}
      />

      <DenemeTablolari alan={profil.alan!} denemeler={veri.denemeler} />
    </div>
  );
}
