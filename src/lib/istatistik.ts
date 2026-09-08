import type { CalismaKaydi, DenemeDers, DenemeToplam, HedefNet } from "./db";
import {
  SINAV_TARIHI,
  bugun,
  dersAdi,
  dersSirasi,
  haftaBasi,
  isoTarih,
  kisaTarih,
  type SinavTuru,
} from "./yks";

export type HaftaSatiri = {
  hafta: string;
  baslangic: string;
  bitis: string;
  soru: number;
  sure: number;
  blok: number;
  denemeSayisi: number;
  tytNet: number | null;
  aytNet: number | null;
};

/**
 * Excel'deki "Haftalık Özet" sayfasının karşılığı: son N haftanın
 * soru/süre toplamları ve deneme net ortalamaları.
 */
export function haftalikOzet(
  kayitlar: CalismaKaydi[],
  denemeler: DenemeToplam[],
  haftaSayisi = 8,
): HaftaSatiri[] {
  const buHafta = haftaBasi(new Date());
  const haftalar: HaftaSatiri[] = [];

  for (let i = haftaSayisi - 1; i >= 0; i--) {
    const bas = new Date(buHafta);
    bas.setUTCDate(bas.getUTCDate() - i * 7);
    const bit = new Date(bas);
    bit.setUTCDate(bit.getUTCDate() + 6);

    const basIso = isoTarih(bas);
    const bitIso = isoTarih(bit);

    const haftaKayitlari = kayitlar.filter((k) => k.tarih >= basIso && k.tarih <= bitIso);
    const haftaDenemeleri = denemeler.filter((d) => d.tarih >= basIso && d.tarih <= bitIso);

    const ortalama = (sinav: SinavTuru) => {
      const liste = haftaDenemeleri.filter((d) => d.sinav === sinav);
      if (liste.length === 0) return null;
      const toplam = liste.reduce((t, d) => t + Number(d.toplam_net), 0);
      return Math.round((toplam / liste.length) * 100) / 100;
    };

    haftalar.push({
      hafta: kisaTarih(basIso),
      baslangic: basIso,
      bitis: bitIso,
      soru: haftaKayitlari.reduce((t, k) => t + k.soru, 0),
      sure: haftaKayitlari.reduce((t, k) => t + (k.sure_dk ?? 0), 0),
      blok: haftaKayitlari.length,
      denemeSayisi: haftaDenemeleri.length,
      tytNet: ortalama("TYT"),
      aytNet: ortalama("AYT"),
    });
  }

  return haftalar;
}

export type NetNoktasi = { tarih: string; etiket: string; TYT: number | null; AYT: number | null };

/** Deneme netlerinin zaman içindeki seyri; aynı güne düşen denemelerin ortalaması alınır. */
export function netTrendi(denemeler: DenemeToplam[]): NetNoktasi[] {
  const gunler = new Map<string, { tyt: number[]; ayt: number[] }>();

  for (const d of denemeler) {
    const kayit = gunler.get(d.tarih) ?? { tyt: [], ayt: [] };
    (d.sinav === "TYT" ? kayit.tyt : kayit.ayt).push(Number(d.toplam_net));
    gunler.set(d.tarih, kayit);
  }

  const ort = (a: number[]) =>
    a.length === 0 ? null : Math.round((a.reduce((t, v) => t + v, 0) / a.length) * 100) / 100;

  return [...gunler.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tarih, v]) => ({
      tarih,
      etiket: kisaTarih(tarih),
      TYT: ort(v.tyt),
      AYT: ort(v.ayt),
    }));
}

export type DenemeOzeti = {
  sinav: SinavTuru;
  adet: number;
  sonNOrtalama: number | null;
  genelOrtalama: number | null;
  enIyi: number | null;
  ilkNOrtalama: number | null;
  /** Son N ortalaması ile ilk N ortalaması arasındaki fark — gidişat. */
  degisim: number | null;
};

/**
 * Bir sınav türü için deneme net özeti: son N ortalaması, tüm zamanlar
 * ortalaması, en iyi net ve baştan sona değişim.
 */
export function denemeOzeti(
  denemeler: DenemeToplam[],
  sinav: SinavTuru,
  sonN = 10,
): DenemeOzeti {
  const netler = denemeler
    .filter((d) => d.sinav === sinav)
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
    .map((d) => Number(d.toplam_net));

  const ort = (a: number[]) =>
    a.length === 0 ? null : Math.round((a.reduce((t, v) => t + v, 0) / a.length) * 100) / 100;

  const son = netler.slice(-sonN);
  const sonOrt = ort(son);
  // Karşılaştırma için aynı büyüklükte bir ilk dilim al; tek deneme varsa anlamsız.
  const ilk = netler.length > son.length ? netler.slice(0, Math.min(sonN, netler.length - son.length)) : [];
  const ilkOrt = ort(ilk);

  return {
    sinav,
    adet: netler.length,
    sonNOrtalama: sonOrt,
    genelOrtalama: ort(netler),
    enIyi: netler.length === 0 ? null : Math.max(...netler),
    ilkNOrtalama: ilkOrt,
    degisim:
      sonOrt === null || ilkOrt === null ? null : Math.round((sonOrt - ilkOrt) * 100) / 100,
  };
}

export type HedefSatiri = {
  ders: string;
  sinav: SinavTuru;
  hedef: number;
  mevcut: number | null;
  fark: number | null;
};

/**
 * Excel'deki "Hedef" sayfasının Mevcut Ort. / Fark sütunları.
 * Mevcut = son `sonN` denemedeki ders netlerinin ortalaması.
 * Varsayılan 10: tek bir kötü deneme tabloyu yanıltmasın.
 */
export function hedefKarsilastirma(
  hedefler: HedefNet[],
  denemeler: DenemeToplam[],
  bolumler: DenemeDers[],
  sonN = 10,
): HedefSatiri[] {
  const sonDenemeler = new Set<string>();
  for (const sinav of ["TYT", "AYT"] as const) {
    denemeler
      .filter((d) => d.sinav === sinav)
      .sort((a, b) => b.tarih.localeCompare(a.tarih))
      .slice(0, sonN)
      .forEach((d) => sonDenemeler.add(d.id));
  }

  const dersNetleri = new Map<string, number[]>();
  for (const b of bolumler) {
    if (!sonDenemeler.has(b.mock_exam_id)) continue;
    const liste = dersNetleri.get(b.ders) ?? [];
    liste.push(Number(b.net));
    dersNetleri.set(b.ders, liste);
  }

  return hedefler
    .map((h) => {
      const netler = dersNetleri.get(h.ders) ?? [];
      const mevcut =
        netler.length === 0
          ? null
          : Math.round((netler.reduce((t, v) => t + v, 0) / netler.length) * 100) / 100;
      const hedef = Number(h.hedef_net);
      return {
        ders: h.ders,
        sinav: h.sinav,
        hedef,
        mevcut,
        fark: mevcut === null ? null : Math.round((mevcut - hedef) * 100) / 100,
      };
    })
    // Veritabanı satır sırası garanti değil; tabloyu sınav kağıdı sırasına sok.
    .sort((a, b) => dersSirasi(a.ders) - dersSirasi(b.ders));
}

/** YKS gününe kalan gün sayısı. Sınav geçmişse null. */
export function kalanGun(sinavTarihi: string = SINAV_TARIHI): number | null {
  const bugunIso = bugun();
  if (sinavTarihi < bugunIso) return null;
  const fark = Date.parse(`${sinavTarihi}T00:00:00Z`) - Date.parse(`${bugunIso}T00:00:00Z`);
  return Math.round(fark / 86_400_000);
}

export type DersHaftaSatiri = Record<string, string | number>;

/**
 * Ders bazlı haftalık soru grafiği için yığılmış veri.
 * En çok çalışılan `maxDers` ders ayrı ayrı, kalanlar "Diğer" altında toplanır —
 * 11 ayrı renk okunamaz hale gelirdi.
 */
export function dersBazliHaftalik(
  kayitlar: CalismaKaydi[],
  haftaSayisi = 8,
  maxDers = 6,
): { veri: DersHaftaSatiri[]; dersAdlari: string[] } {
  const enCok = dersDagilimi(kayitlar).slice(0, maxDers).map((d) => d.ders);
  const enCokKume = new Set(enCok);
  const digerVar = dersDagilimi(kayitlar).length > enCok.length;

  const dersAdlari = [...enCok.map(dersAdi), ...(digerVar ? ["Diğer"] : [])];

  const buHafta = haftaBasi(new Date());
  const veri: DersHaftaSatiri[] = [];

  for (let i = haftaSayisi - 1; i >= 0; i--) {
    const bas = new Date(buHafta);
    bas.setUTCDate(bas.getUTCDate() - i * 7);
    const bit = new Date(bas);
    bit.setUTCDate(bit.getUTCDate() + 6);

    const basIso = isoTarih(bas);
    const bitIso = isoTarih(bit);

    const satir: DersHaftaSatiri = { hafta: kisaTarih(basIso) };
    for (const ad of dersAdlari) satir[ad] = 0;

    for (const k of kayitlar) {
      if (k.tarih < basIso || k.tarih > bitIso) continue;
      const ad = enCokKume.has(k.ders) ? dersAdi(k.ders) : "Diğer";
      if (ad in satir) satir[ad] = (satir[ad] as number) + k.soru;
    }
    veri.push(satir);
  }

  return { veri, dersAdlari };
}

/** Ders bazlı toplam çözülen soru — dağılım grafiği için. */
export function dersDagilimi(kayitlar: CalismaKaydi[]): { ders: string; soru: number }[] {
  const toplam = new Map<string, number>();
  for (const k of kayitlar) {
    toplam.set(k.ders, (toplam.get(k.ders) ?? 0) + k.soru);
  }
  return [...toplam.entries()]
    .map(([ders, soru]) => ({ ders, soru }))
    .sort((a, b) => b.soru - a.soru);
}
