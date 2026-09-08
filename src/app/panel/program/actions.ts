"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { oturum } from "@/lib/db";
import { GUNLER, PROGRAM_DERSLERI, PROGRAM_SATIR, hucreAnahtari } from "@/lib/yks";

export type ProgramState = { error?: string; ok?: boolean; kayitZamani?: string };

export async function programKaydet(
  _prev: ProgramState,
  formData: FormData,
): Promise<ProgramState> {
  const { user, profil } = await oturum();
  if (!user) return { error: "Oturumun düşmüş görünüyor. Tekrar giriş yap." };
  if (!profil?.alan) return { error: "Önce profil kurulumunu tamamla." };

  // Geçerli ders anahtarları sunucuda alandan türetilir; istemciden gelen
  // değerlere güvenilmez.
  const gecerliDersler = new Set(PROGRAM_DERSLERI[profil.alan].map((d) => d.key));
  const hucreler: Record<string, string> = {};

  for (let gun = 0; gun < GUNLER.length; gun++) {
    for (let satir = 0; satir < PROGRAM_SATIR; satir++) {
      const anahtar = hucreAnahtari(gun, satir);
      const deger = formData.get(anahtar);
      if (typeof deger !== "string" || deger === "") continue;
      if (!gecerliDersler.has(deger)) {
        return { error: "Programda tanımlı olmayan bir ders var. Sayfayı yenileyip tekrar dene." };
      }
      hucreler[anahtar] = deger;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("weekly_schedule")
    .upsert(
      { user_id: user.id, hucreler, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { error: "Program kaydedilemedi. Lütfen tekrar dene." };

  revalidatePath("/panel/program");
  return { ok: true, kayitZamani: new Date().toISOString() };
}
