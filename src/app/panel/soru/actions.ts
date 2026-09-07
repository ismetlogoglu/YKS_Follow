"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dersler, type Alan } from "@/lib/yks";
import { enGecTarih } from "@/lib/tarih";

/** `token` her başarılı kayıtta değişir; form alanları bu değere göre sıfırlanır. */
export type KayitState = { error?: string; ok?: string; token?: string };

const sayi = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), {
      message: `Değer ${min} ile ${max} arasında bir tam sayı olmalı.`,
    });

const semasi = z.object({
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç."),
  sinav: z.enum(["TYT", "AYT"]),
  ders: z.string().min(1, "Ders seç."),
  konu: z.string().trim().max(160).optional(),
  soru: z
    .string()
    .trim()
    .transform(Number)
    .refine((v) => Number.isInteger(v) && v > 0 && v <= 2000, "Çözülen soru 1–2000 arasında olmalı."),
  dogru: sayi(0, 2000),
  yanlis: sayi(0, 2000),
  sure_dk: sayi(0, 1440),
  not_metni: z.string().trim().max(500).optional(),
});

function metin(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function calismaEkle(_prev: KayitState, formData: FormData): Promise<KayitState> {
  const parsed = semasi.safeParse({
    tarih: metin(formData.get("tarih")),
    sinav: metin(formData.get("sinav")),
    ders: metin(formData.get("ders")),
    konu: metin(formData.get("konu")) || undefined,
    soru: metin(formData.get("soru")),
    dogru: metin(formData.get("dogru")),
    yanlis: metin(formData.get("yanlis")),
    sure_dk: metin(formData.get("sure_dk")),
    not_metni: metin(formData.get("not_metni")) || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if ((d.dogru ?? 0) + (d.yanlis ?? 0) > d.soru) {
    return { error: "Doğru + yanlış sayısı, çözülen soru sayısını aşamaz." };
  }
  if (d.tarih > enGecTarih()) {
    return { error: "İleri bir tarihe kayıt giremezsin." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturumun düşmüş görünüyor. Tekrar giriş yap." };

  const { data: profil } = await supabase
    .from("profiles")
    .select("alan")
    .eq("id", user.id)
    .maybeSingle<{ alan: Alan | null }>();

  if (!profil?.alan) return { error: "Önce profil kurulumunu tamamla." };

  // Ders anahtarı kullanıcının alanına ait olmalı — istemciden gelen değere güvenme.
  const gecerli = dersler(profil.alan, d.sinav).some((x) => x.key === d.ders);
  if (!gecerli) return { error: "Bu ders alanına ait değil." };

  const bos = d.dogru === null && d.yanlis === null ? null : d.soru - (d.dogru ?? 0) - (d.yanlis ?? 0);

  const { error } = await supabase.from("study_logs").insert({
    user_id: user.id,
    tarih: d.tarih,
    sinav: d.sinav,
    ders: d.ders,
    konu: d.konu ?? null,
    soru: d.soru,
    dogru: d.dogru,
    yanlis: d.yanlis,
    bos,
    sure_dk: d.sure_dk,
    not_metni: d.not_metni ?? null,
  });

  if (error) return { error: "Kayıt eklenemedi. Lütfen tekrar dene." };

  revalidatePath("/panel", "layout");
  return { ok: `${d.soru} soru kaydedildi.`, token: crypto.randomUUID() };
}

export async function calismaSil(formData: FormData) {
  const id = metin(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS zaten sahipliği zorunlu kılıyor; user_id filtresi ikinci bir emniyet.
  await supabase.from("study_logs").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/panel", "layout");
}
