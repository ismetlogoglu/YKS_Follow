"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { oturum } from "@/lib/db";
import { GUNLER, PROGRAM_DERSLERI, PROGRAM_SATIR, hucreAnahtari } from "@/lib/yks";

export type ProgramSonucu =
  | { durum: "ok"; kayitZamani: string }
  | { durum: "hata"; mesaj: string; tabloYok?: boolean };

/**
 * Hücreleri doğrudan nesne olarak alır — veri zaten istemci state'inde tutuluyor,
 * FormData'ya çevirip geri okumak gereksiz bir tur olurdu.
 */
export async function programKaydet(
  gelen: Record<string, string>,
): Promise<ProgramSonucu> {
  const { user, profil } = await oturum();
  if (!user) return { durum: "hata", mesaj: "Oturumun düşmüş görünüyor. Tekrar giriş yap." };
  if (!profil?.alan) return { durum: "hata", mesaj: "Önce profil kurulumunu tamamla." };

  // Geçerli anahtarlar sunucuda alandan türetilir; istemciden gelen değerlere güvenilmez.
  const gecerliDersler = new Set(PROGRAM_DERSLERI[profil.alan].map((d) => d.key));
  const hucreler: Record<string, string> = {};

  for (let gun = 0; gun < GUNLER.length; gun++) {
    for (let satir = 0; satir < PROGRAM_SATIR; satir++) {
      const anahtar = hucreAnahtari(gun, satir);
      const deger = gelen[anahtar];
      if (typeof deger !== "string" || deger === "") continue;
      if (!gecerliDersler.has(deger)) {
        return {
          durum: "hata",
          mesaj: "Programda tanımlı olmayan bir ders var. Sayfayı yenileyip tekrar dene.",
        };
      }
      hucreler[anahtar] = deger;
    }
  }

  const kayitZamani = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("weekly_schedule")
    .upsert({ user_id: user.id, hucreler, updated_at: kayitZamani }, { onConflict: "user_id" });

  if (error) {
    // PGRST205 = PostgREST tabloyu bulamadı. Genel bir "tekrar dene" mesajı burada
    // yanıltıcı olurdu; tekrar denemek işe yaramaz, veritabanı kurulumu eksiktir.
    if (error.code === "PGRST205") {
      return {
        durum: "hata",
        tabloYok: true,
        mesaj:
          "Program tablosu veritabanında yok. Supabase panelinde SQL Editor'ı açıp " +
          "supabase/migrations/001_haftalik_program.sql dosyasını çalıştırman gerekiyor.",
      };
    }
    return { durum: "hata", mesaj: "Program kaydedilemedi. Lütfen tekrar dene." };
  }

  revalidatePath("/panel/program");
  return { durum: "ok", kayitZamani };
}
