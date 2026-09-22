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
 * İsteği yapan kullanıcının kimliği — ağa çıkmadan.
 *
 * getClaims() JWT imzasını projenin ES256 açık anahtarıyla yerel doğrular (anahtar
 * modül düzeyinde 10 dk önbellekte). Bu sayede sayfalar veri sorgusunu profil
 * sorgusunu BEKLEMEDEN başlatabiliyor: ikisi paralel gidiyor, tek tur sürüyor.
 */
export const oturumKimligi = cache(async function oturumKimligi(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

/**
 * Oturum + profil, istek başına bir kez.
 *
 * cache(): layout ve page aynı isteği ayrı ayrı yapıyordu; artık ilk çağrı ağa
 * gidiyor, kalanlar aynı sonucu alıyor.
 */
export const oturum = cache(async function oturum() {
  const supabase = await createClient();
  const kullaniciId = await oturumKimligi();

  if (!kullaniciId) return { supabase, user: null, profil: null };

  const { data: profil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", kullaniciId)
    .maybeSingle<Profil>();

  return { supabase, user: { id: kullaniciId }, profil };
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

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Sayfanın profil kontrolünü ve kendi veri sorgusunu AYNI ANDA çalıştırır.
 *
 * Eskiden sayfa önce profili bekliyor, sonra verisini soruyordu: iki sıralı tur.
 * Kimlik yerel doğrulandığı için veri sorgusu profili beklemek zorunda değil.
 * Profil kontrolü yönlendirme yaparsa veri sonucu atılır; RLS zaten kullanıcının
 * görmemesi gereken hiçbir satırı döndürmez.
 */
export async function profilVeVeri<T>(
  opts: Parameters<typeof gerekliProfil>[0],
  veri: (kimlik: string, supabase: Supabase) => PromiseLike<T>,
) {
  const kimlik = await oturumKimligi();
  if (!kimlik) redirect("/giris");
  const supabase = await createClient();
  const [profilSonucu, veriSonucu] = await Promise.all([
    gerekliProfil(opts),
    veri(kimlik, supabase),
  ]);
  return { ...profilSonucu, veri: veriSonucu };
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

/** mock_exams satırı + gömülü mock_exam_sections. */
export type DenemeSatiri = Pick<
  DenemeToplam,
  "id" | "user_id" | "tarih" | "sinav" | "ad" | "yayin" | "not_metni"
> & { mock_exam_sections: DenemeDers[] | null };

/** PostgREST gömülü seçim: deneme ve bölümleri tek istekte. */
export const DENEME_SECIMI =
  "id, user_id, tarih, sinav, ad, yayin, not_metni, mock_exam_sections(*)";

/**
 * Gömülü sorgu sonucunu sayfaların kullandığı iki listeye açar ve toplamları
 * hesaplar (mock_exam_totals görünümüyle aynı formül).
 *
 * Eskiden önce görünüm, ardından bölümler `.in(ids)` ile ayrıca sorgulanıyordu:
 * ikinci sorgu birincinin sonucunu beklediği için iki sıralı tur. Veritabanı
 * uzaktayken her tur yüzlerce milisaniye demek.
 */
export function denemeleriAc(satirlar: DenemeSatiri[]): {
  denemeler: DenemeToplam[];
  bolumler: DenemeDers[];
} {
  const denemeler: DenemeToplam[] = [];
  const bolumler: DenemeDers[] = [];

  for (const { mock_exam_sections, ...d } of satirlar) {
    const b = mock_exam_sections ?? [];
    const dogru = b.reduce((t, x) => t + x.dogru, 0);
    const yanlis = b.reduce((t, x) => t + x.yanlis, 0);
    const soru = b.reduce((t, x) => t + x.soru_sayisi, 0);
    const net = b.reduce((t, x) => t + Number(x.net), 0);

    denemeler.push({
      ...d,
      toplam_dogru: dogru,
      toplam_yanlis: yanlis,
      toplam_soru: soru,
      toplam_bos: soru - dogru - yanlis,
      toplam_net: Math.round(net * 100) / 100,
    });
    bolumler.push(...b);
  }

  return { denemeler, bolumler };
}
