import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DENEME_SECIMI, denemeleriAc, oturum, type DenemeSatiri } from "@/lib/db";
import type { CalismaKaydi, DenemeDers, DenemeToplam, HedefNet, Profil } from "@/lib/db";
import { denemeOzeti, hedefKarsilastirma, type DenemeOzeti } from "@/lib/istatistik";
import { yerelIso } from "@/lib/yks";

export type OgrenciOzeti = {
  profil: Profil;
  /** Seçili tarih aralığındaki hareket. */
  soru: number;
  sure: number;
  blok: number;
  denemeSayisi: number;
  tytOrt: number | null;
  aytOrt: number | null;
  sonAktivite: string | null;
  /** Tüm zamanlar üzerinden hesaplanan net özetleri — tarih filtresinden etkilenmez. */
  tyt: DenemeOzeti;
  ayt: DenemeOzeti;
  /** Hedef netlere göre durum: kaç ders hedefte, kaç ders geride, ne kadar açık. */
  hedefte: number;
  geride: number;
  veriYok: number;
  toplamAcik: number;
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
  // oturum() cache'li: admin layout'u da aynı isteği yapıyor, ikinci kez ağa çıkılmaz.
  const { supabase, user, profil } = await oturum();
  if (!user) redirect("/giris");
  if (!profil?.is_admin) redirect("/panel");
  return supabase;
}

export type OgrenciDetayi = {
  profil: Profil;
  kayitlar: CalismaKaydi[];
  denemeler: DenemeToplam[];
  bolumler: DenemeDers[];
  hedefler: HedefNet[];
};

/**
 * Tek bir öğrencinin tüm verisi — eğitmenin detay sayfası için.
 *
 * Yetki kontrolü dahil her şey tek turda, paralel. Eskiden yetki → profil →
 * veriler → bölümler sırayla bekleniyordu (4 tur). adminKapisi yönlendirirse
 * diğer sonuçlar atılır; RLS zaten eğitmen olmayana başkasının verisini vermez.
 */
export async function ogrenciVerisi(userId: string): Promise<OgrenciDetayi | null> {
  const supabase = await createClient();

  const [, profilSonuc, calismaSonuc, denemeSonuc, hedefSonuc] = await Promise.all([
    adminKapisi(),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle<Profil>(),
    supabase
      .from("study_logs")
      .select("*")
      .eq("user_id", userId)
      .order("tarih", { ascending: false }),
    supabase.from("mock_exams").select(DENEME_SECIMI).eq("user_id", userId).order("tarih"),
    supabase.from("net_targets").select("sinav, ders, hedef_net").eq("user_id", userId),
  ]);

  const profil = profilSonuc.data;
  if (!profil) return null;

  const { denemeler, bolumler } = denemeleriAc(
    (denemeSonuc.data ?? []) as unknown as DenemeSatiri[],
  );

  return {
    profil,
    kayitlar: (calismaSonuc.data ?? []) as CalismaKaydi[],
    denemeler,
    bolumler,
    hedefler: (hedefSonuc.data ?? []) as HedefNet[],
  };
}

/**
 * Yönetici görünümü için tüm öğrencilerin verisini toplar.
 * Erişim RLS'teki is_admin() politikasıyla korunur; burada ayrıca bayrak kontrol edilir.
 */
export async function adminVerisi(baslangic: string, bitis: string): Promise<AdminVerisi> {
  const supabase = await createClient();

  // Her şey tek turda. Eskiden 5 sıralı tur vardı: yetki → (profiller, kayıtlar,
  // aralıktaki denemeler) → onların bölümleri → (tüm denemeler, hedefler) → tüm
  // bölümler. Denemeler artık bölümleriyle gömülü tek sorguda geliyor ve "tüm
  // denemeler" aralıktakileri zaten kapsadığı için aralık ayrıca sorgulanmıyor.
  const [, profilSonuc, calismaSonuc, denemeSonuc, hedefSonuc] = await Promise.all([
    adminKapisi(),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("study_logs")
      .select("*")
      .gte("tarih", baslangic)
      .lte("tarih", bitis)
      .order("tarih", { ascending: false }),
    supabase.from("mock_exams").select(DENEME_SECIMI).order("tarih"),
    supabase.from("net_targets").select("user_id, sinav, ders, hedef_net"),
  ]);

  // Eğitmen hesapları öğrenci listesinde görünmemeli.
  const profiller = ((profilSonuc.data ?? []) as Profil[]).filter((p) => !p.is_admin);
  const kayitlar = (calismaSonuc.data ?? []) as CalismaKaydi[];

  // Net ortalamaları tarih filtresinden bağımsız olmalı: "son 10 deneme"
  // seçili aralıkta 2 deneme varsa 2 denemenin ortalaması olmamalı.
  const { denemeler: tumDenemeler, bolumler: tumBolumler } = denemeleriAc(
    (denemeSonuc.data ?? []) as unknown as DenemeSatiri[],
  );
  const tumHedefler = (hedefSonuc.data ?? []) as (HedefNet & { user_id: string })[];

  // Aralıktaki denemeler (en yeniden eskiye) — aralık sayıları ve Excel çıktısı için.
  const denemeler = tumDenemeler
    .filter((d) => d.tarih >= baslangic && d.tarih <= bitis)
    .reverse();
  const aralikIdleri = new Set(denemeler.map((d) => d.id));
  const bolumler = tumBolumler.filter((b) => aralikIdleri.has(b.mock_exam_id));

  const ogrenciler: OgrenciOzeti[] = profiller.map((p) => {
    const kendiKayitlari = kayitlar.filter((k) => k.user_id === p.id);
    const kendiDenemeleri = denemeler.filter((d) => d.user_id === p.id);

    const tumKendiDenemeleri = tumDenemeler.filter((d) => d.user_id === p.id);
    const kendiDenemeIdleri = new Set(tumKendiDenemeleri.map((d) => d.id));
    const kendiBolumleri = tumBolumler.filter((b) => kendiDenemeIdleri.has(b.mock_exam_id));
    const kendiHedefleri = tumHedefler.filter((h) => h.user_id === p.id);

    const karsilastirma = hedefKarsilastirma(
      kendiHedefleri,
      tumKendiDenemeleri,
      kendiBolumleri,
    );

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
      tyt: denemeOzeti(tumKendiDenemeleri, "TYT"),
      ayt: denemeOzeti(tumKendiDenemeleri, "AYT"),
      hedefte: karsilastirma.filter((s) => s.fark !== null && s.fark >= 0).length,
      geride: karsilastirma.filter((s) => s.fark !== null && s.fark < 0).length,
      veriYok: karsilastirma.filter((s) => s.fark === null).length,
      toplamAcik:
        Math.round(
          karsilastirma
            .filter((s) => s.fark !== null && s.fark < 0)
            .reduce((t, s) => t + Math.abs(s.fark!), 0) * 100,
        ) / 100,
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
