import type { Metadata } from "next";
import { ProgramTablosu } from "@/components/program-tablosu";
import { GeriBaglantisi } from "@/components/ui";
import { gerekliProfil } from "@/lib/db";

export const metadata: Metadata = { title: "Haftalık programım" };

export default async function ProgramSayfasi() {
  const { supabase, user, profil } = await gerekliProfil({ adminiYonlendir: true });

  const { data, error } = await supabase
    .from("weekly_schedule")
    .select("hucreler, updated_at")
    .eq("user_id", user.id)
    .maybeSingle<{ hucreler: Record<string, string>; updated_at: string }>();

  // Tablo hiç kurulmamışsa sayfa yine açılsın ama kullanıcı sebebini görsün.
  const tabloYok = error?.code === "PGRST205";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <GeriBaglantisi href="/panel">Ana ekran</GeriBaglantisi>
        <h1 className="mt-1 text-2xl font-semibold text-heading">Haftalık programım</h1>
        <p className="mt-1 text-sm text-muted-ink">
          Her gün için üç çalışma bloğu seç ve kaydet. Kaydettiğin program her girişinde
          burada durur; dilediğinde düzenler, dilediğinde görsel olarak cihazına kaydedersin.
        </p>
      </div>

      <ProgramTablosu
        alan={profil.alan!}
        baslangic={data?.hucreler ?? {}}
        ogrenciAdi={profil.ad_soyad ?? ""}
        sonKayit={data?.updated_at ?? null}
        tabloYok={tabloYok}
      />
    </div>
  );
}
