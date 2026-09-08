import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Alan, SinavTuru } from "@/lib/yks";

export type Profil = {
  id: string;
  email: string | null;
  ad_soyad: string | null;
  alan: Alan | null;
  hedef_universite: string | null;
  hedef_bolum: string | null;
  hedef_siralama: number | null;
  sinav_tarihi: string | null;
  is_admin: boolean;
  kurulum_tamam: boolean;
  created_at: string;
};

export type HedefNet = {
  sinav: SinavTuru;
  ders: string;
  hedef_net: number;
};

export type CalismaKaydi = {
  id: string;
  user_id: string;
  tarih: string;
  sinav: SinavTuru;
  ders: string;
  konu: string | null;
  soru: number;
  dogru: number | null;
  yanlis: number | null;
  bos: number | null;
  sure_dk: number | null;
  not_metni: string | null;
  net: number | null;
};

export type DenemeToplam = {
  id: string;
  user_id: string;
  tarih: string;
  sinav: SinavTuru;
  ad: string;
  yayin: string | null;
  not_metni: string | null;
  toplam_dogru: number;
  toplam_yanlis: number;
  toplam_soru: number;
  toplam_bos: number;
  toplam_net: number;
};

export type DenemeDers = {
  id: string;
  mock_exam_id: string;
  ders: string;
  soru_sayisi: number;
  dogru: number;
  yanlis: number;
  net: number;
};

/**
 * Oturumu doğrular ve profili getirir.
 * Kurulumu tamamlamamış kullanıcıyı /kurulum'a yollar (kurulum sayfasının kendisi hariç).
 */
/**
 * Oturum + profil, istek başına bir kez.
 *
 * cache() burada kritik: layout ve page aynı isteği ayrı ayrı yapıyordu, yani
 * her sayfa görüntülemesi 4 ayrı Supabase gidiş-dönüşü demekti (2 getUser +
 * 2 profil sorgusu). Şimdi ilk çağrı ağa gidiyor, kalanlar aynı sonucu alıyor.
 */
export const oturum = cache(async function oturum() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profil: null };

  const { data: profil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profil>();

  return { supabase, user, profil };
});

/**
 * Oturumu doğrular ve profili getirir.
 *
 * `adminiYonlendir`: eğitmen öğrenci ekranlarına düşmesin diye /admin'e yollar.
 * İki panel bilerek ayrı tutuluyor — eğitmen yalnızca yönetici panelini,
 * öğrenci yalnızca veri giriş ekranlarını görür.
 */
export async function gerekliProfil(
  opts: { kurulumZorunlu?: boolean; adminiYonlendir?: boolean } = {},
) {
  const { kurulumZorunlu = true, adminiYonlendir = false } = opts;
  const { supabase, user, profil } = await oturum();

  if (!user) redirect("/giris");

  if (adminiYonlendir && profil?.is_admin) {
    redirect("/admin");
  }

  if (kurulumZorunlu && (!profil?.kurulum_tamam || !profil.alan)) {
    redirect("/kurulum");
  }

  return { supabase, user, profil: profil as Profil };
}

export const hedefNetler = cache(async function hedefNetler(
  userId: string,
): Promise<HedefNet[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("net_targets")
    .select("sinav, ders, hedef_net")
    .eq("user_id", userId);
  return (data ?? []) as HedefNet[];
});
