"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dersler, type Alan } from "@/lib/yks";

export type ProfilState = { error?: string; ok?: boolean };

const semasi = z.object({
  adSoyad: z.string().trim().min(2, "Adını ve soyadını yaz."),
  alan: z.enum(["SAY", "EA", "SOZ"], { message: "Bir alan seç." }),
  hedefUniversite: z.string().trim().max(120).optional(),
  hedefBolum: z.string().trim().max(120).optional(),
  hedefSiralama: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), "Hedef sıralama pozitif olmalı."),
  sinavTarihi: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Geçerli bir sınav tarihi seç."),
});

function metin(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? undefined : s;
}

export async function profilKaydet(
  _prev: ProfilState,
  formData: FormData,
): Promise<ProfilState> {
  const parsed = semasi.safeParse({
    adSoyad: formData.get("adSoyad"),
    alan: formData.get("alan"),
    hedefUniversite: metin(formData.get("hedefUniversite")),
    hedefBolum: metin(formData.get("hedefBolum")),
    hedefSiralama: metin(formData.get("hedefSiralama")),
    sinavTarihi: metin(formData.get("sinavTarihi")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const alan = parsed.data.alan as Alan;

  const { error: profilHatasi } = await supabase
    .from("profiles")
    .update({
      ad_soyad: parsed.data.adSoyad,
      alan,
      hedef_universite: parsed.data.hedefUniversite ?? null,
      hedef_bolum: parsed.data.hedefBolum ?? null,
      hedef_siralama: parsed.data.hedefSiralama,
      sinav_tarihi: parsed.data.sinavTarihi,
      kurulum_tamam: true,
    })
    .eq("id", user.id);

  if (profilHatasi) {
    return { error: "Profil kaydedilemedi. Lütfen tekrar dene." };
  }

  // Hedef netler: alan değişmişse artık geçerli olmayan dersleri temizle.
  const gecerliDersler = [...dersler(alan, "TYT"), ...dersler(alan, "AYT")];
  const satirlar = gecerliDersler.map((d) => {
    const sinav = d.key.startsWith("tyt_") ? "TYT" : "AYT";
    const ham = Number(formData.get(`hedef_${d.key}`));
    const hedef = Number.isFinite(ham) ? Math.min(Math.max(ham, 0), d.soru) : 0;
    return { user_id: user.id, sinav, ders: d.key, hedef_net: hedef };
  });

  const { error: hedefHatasi } = await supabase
    .from("net_targets")
    .upsert(satirlar, { onConflict: "user_id,sinav,ders" });

  if (hedefHatasi) {
    return { error: "Net hedefleri kaydedilemedi. Lütfen tekrar dene." };
  }

  await supabase
    .from("net_targets")
    .delete()
    .eq("user_id", user.id)
    .not("ders", "in", `(${gecerliDersler.map((d) => d.key).join(",")})`);

  revalidatePath("/panel", "layout");

  if (formData.get("yon") === "panel") redirect("/panel");
  return { ok: true };
}
