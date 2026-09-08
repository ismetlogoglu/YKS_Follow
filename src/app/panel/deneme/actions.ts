"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dersler, type Alan } from "@/lib/yks";
import { enGecTarih } from "@/lib/tarih";

/** `token` her başarılı kayıtta değişir; form alanları bu değere göre sıfırlanır. */
export type DenemeState = { error?: string; ok?: string; token?: string };

const semasi = z.object({
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç."),
  sinav: z.enum(["TYT", "AYT"]),
  ad: z.string().trim().min(1, "Deneme adını yaz.").max(120),
  not_metni: z.string().trim().max(500).optional(),
});

function metin(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function tamSayi(v: FormDataEntryValue | null): number {
  const s = metin(v);
  if (s === "") return 0;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : -1;
}

export async function denemeEkle(_prev: DenemeState, formData: FormData): Promise<DenemeState> {
  const parsed = semasi.safeParse({
    tarih: metin(formData.get("tarih")),
    sinav: metin(formData.get("sinav")),
    ad: metin(formData.get("ad")),
    not_metni: metin(formData.get("not_metni")) || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.tarih > enGecTarih()) {
    return { error: "İleri bir tarihe deneme giremezsin." };
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

  // Ders listesi sunucuda alandan türetilir; istemciden ders anahtarı kabul edilmez.
  const liste = dersler(profil.alan, d.sinav);
  const bolumler = [];

  for (const ders of liste) {
    const dogru = tamSayi(formData.get(`dogru_${ders.key}`));
    const yanlis = tamSayi(formData.get(`yanlis_${ders.key}`));

    if (dogru < 0 || yanlis < 0) {
      return { error: `${ders.ad}: doğru ve yanlış negatif olmayan tam sayı olmalı.` };
    }
    if (dogru + yanlis > ders.soru) {
      return {
        error: `${ders.ad}: doğru + yanlış (${dogru + yanlis}) toplam soru sayısını (${ders.soru}) aşıyor.`,
      };
    }
    bolumler.push({ ders: ders.key, soru_sayisi: ders.soru, dogru, yanlis });
  }

  if (bolumler.every((b) => b.dogru === 0 && b.yanlis === 0)) {
    return { error: "En az bir ders için doğru veya yanlış sayısı gir." };
  }

  const { data: deneme, error: denemeHatasi } = await supabase
    .from("mock_exams")
    .insert({
      user_id: user.id,
      tarih: d.tarih,
      sinav: d.sinav,
      ad: d.ad,
      not_metni: d.not_metni ?? null,
    })
    .select("id")
    .single();

  if (denemeHatasi || !deneme) return { error: "Deneme kaydedilemedi. Lütfen tekrar dene." };

  const { error: bolumHatasi } = await supabase
    .from("mock_exam_sections")
    .insert(bolumler.map((b) => ({ ...b, mock_exam_id: deneme.id })));

  if (bolumHatasi) {
    // Ders satırları yazılamadıysa başlıksız deneme kaydı ortada kalmasın.
    await supabase.from("mock_exams").delete().eq("id", deneme.id);
    return { error: "Deneme dersleri kaydedilemedi. Lütfen tekrar dene." };
  }

  revalidatePath("/panel", "layout");
  return { ok: `"${d.ad}" kaydedildi.`, token: crypto.randomUUID() };
}

export async function denemeSil(formData: FormData) {
  const id = metin(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // mock_exam_sections satırları ON DELETE CASCADE ile birlikte silinir.
  await supabase.from("mock_exams").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/panel", "layout");
}
