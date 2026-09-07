import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CalismaKaydi, DenemeDers, DenemeToplam, HedefNet, Profil } from "@/lib/db";
import { yerelIso } from "@/lib/yks";

export type OgrenciOzeti = {
  profil: Profil;
  soru: number;
  sure: number;
  blok: number;
  denemeSayisi: number;
  tytOrt: number | null;
  aytOrt: number | null;
  sonAktivite: string | null;
};

export type AdminVerisi = {
  baslangic: string;
  bitis: string;
  profiller: Profil[];
  kayitlar: CalismaKaydi[];
  denemeler: DenemeToplam[];
  bolumler: DenemeDers[];
  ogrenciler: OgrenciOzeti[];
  toplam: {
    kullanici: number;
    aktifOgrenci: number;
    soru: number;
    sure: number;
    deneme: number;
    tytOrt: number | null;
    aytOrt: number | null;
  };
};

/** Varsayılan aralık: son 30 gün. */
export function varsayilanAralik(): { baslangic: string; bitis: string } {
  const bugun = new Date();
  const otuzGunOnce = new Date(bugun);
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 29);
  return { baslangic: yerelIso(otuzGunOnce), bitis: yerelIso(bugun) };
}

export function aralikDogrula(
  baslangic?: string | null,
  bitis?: string | null,
): { baslangic: string; bitis: string } {
  const v = varsayilanAralik();
  const gecerli = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);

  const bas = gecerli(baslangic) ?? v.baslangic;
  const bit = gecerli(bitis) ?? v.bitis;
  return bas <= bit ? { baslangic: bas, bitis: bit } : { baslangic: bit, bitis: bas };
}

function ortalama(sayilar: number[]): number | null {
  if (sayilar.length === 0) return null;
  return Math.round((sayilar.reduce((t, v) => t + v, 0) / sayilar.length) * 100) / 100;
}

/**
 * Yönetici bölümünün tek kapısı. RLS zaten yetkisiz okumayı engelliyor;
 * bu kontrol kullanıcıyı boş sayfa yerine kendi paneline yollamak için.
 */
async function adminKapisi() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  if (!data?.is_admin) redirect("/panel");

  return supabase;
}

export type OgrenciDetayi = {
  profil: Profil;
  kayitlar: CalismaKaydi[];
  denemeler: DenemeToplam[];
  bolumler: DenemeDers[];
  hedefler: HedefNet[];
};

/** Tek bir öğrencinin tüm verisi — eğitmenin detay sayfası için. */
export async function ogrenciVerisi(userId: string): Promise<OgrenciDetayi | null> {
  const supabase = await adminKapisi();

  const { data: profil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profil>();

  if (!profil) return null;

  const [calismaSonuc, denemeSonuc, hedefSonuc] = await Promise.all([
    supabase
      .from("study_logs")
      .select("*")
      .eq("user_id", userId)
      .order("tarih", { ascending: false }),
    supabase.from("mock_exam_totals").select("*").eq("user_id", userId).order("tarih"),
    supabase.from("net_targets").select("sinav, ders, hedef_net").eq("user_id", userId),
  ]);

  const denemeler = (denemeSonuc.data ?? []) as DenemeToplam[];

  const { data: bolumVerisi } = denemeler.length
    ? await supabase
        .from("mock_exam_sections")
        .select("*")
        .in(
          "mock_exam_id",
          denemeler.map((d) => d.id),
        )
    : { data: [] };

  return {
    profil,
    kayitlar: (calismaSonuc.data ?? []) as CalismaKaydi[],
    denemeler,
    bolumler: (bolumVerisi ?? []) as DenemeDers[],
    hedefler: (hedefSonuc.data ?? []) as HedefNet[],
  };
}

/**
 * Yönetici görünümü için tüm öğrencilerin verisini toplar.
 * Erişim RLS'teki is_admin() politikasıyla korunur; burada ayrıca bayrak kontrol edilir.
 */
export async function adminVerisi(baslangic: string, bitis: string): Promise<AdminVerisi> {
  const supabase = await adminKapisi();

  const [profilSonuc, calismaSonuc, denemeSonuc] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("study_logs")
      .select("*")
      .gte("tarih", baslangic)
      .lte("tarih", bitis)
      .order("tarih", { ascending: false }),
    supabase
      .from("mock_exam_totals")
      .select("*")
      .gte("tarih", baslangic)
      .lte("tarih", bitis)
      .order("tarih", { ascending: false }),
  ]);

  // Eğitmen hesapları öğrenci listesinde görünmemeli.
  const profiller = ((profilSonuc.data ?? []) as Profil[]).filter((p) => !p.is_admin);
  const kayitlar = (calismaSonuc.data ?? []) as CalismaKaydi[];
  const denemeler = (denemeSonuc.data ?? []) as DenemeToplam[];

  const { data: bolumVerisi } = denemeler.length
    ? await supabase
        .from("mock_exam_sections")
        .select("*")
        .in(
          "mock_exam_id",
          denemeler.map((d) => d.id),
        )
    : { data: [] };
  const bolumler = (bolumVerisi ?? []) as DenemeDers[];

  const ogrenciler: OgrenciOzeti[] = profiller.map((p) => {
    const kendiKayitlari = kayitlar.filter((k) => k.user_id === p.id);
    const kendiDenemeleri = denemeler.filter((d) => d.user_id === p.id);

    const tarihler = [
      ...kendiKayitlari.map((k) => k.tarih),
      ...kendiDenemeleri.map((d) => d.tarih),
    ].sort();

    return {
      profil: p,
      soru: kendiKayitlari.reduce((t, k) => t + k.soru, 0),
      sure: kendiKayitlari.reduce((t, k) => t + (k.sure_dk ?? 0), 0),
      blok: kendiKayitlari.length,
      denemeSayisi: kendiDenemeleri.length,
      tytOrt: ortalama(
        kendiDenemeleri.filter((d) => d.sinav === "TYT").map((d) => Number(d.toplam_net)),
      ),
      aytOrt: ortalama(
        kendiDenemeleri.filter((d) => d.sinav === "AYT").map((d) => Number(d.toplam_net)),
      ),
      sonAktivite: tarihler.length ? tarihler[tarihler.length - 1] : null,
    };
  });

  return {
    baslangic,
    bitis,
    profiller,
    kayitlar,
    denemeler,
    bolumler,
    ogrenciler,
    toplam: {
      kullanici: profiller.length, // eğitmenler hariç kayıtlı öğrenci sayısı
      aktifOgrenci: ogrenciler.filter((o) => o.soru > 0 || o.denemeSayisi > 0).length,
      soru: kayitlar.reduce((t, k) => t + k.soru, 0),
      sure: kayitlar.reduce((t, k) => t + (k.sure_dk ?? 0), 0),
      deneme: denemeler.length,
      tytOrt: ortalama(
        denemeler.filter((d) => d.sinav === "TYT").map((d) => Number(d.toplam_net)),
      ),
      aytOrt: ortalama(
        denemeler.filter((d) => d.sinav === "AYT").map((d) => Number(d.toplam_net)),
      ),
    },
  };
}
