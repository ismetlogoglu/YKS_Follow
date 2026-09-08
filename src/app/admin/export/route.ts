import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { adminVerisi, aralikDogrula } from "@/lib/admin";
import { haftalikOzet } from "@/lib/istatistik";
import { ALAN_ADI, AYT_DERSLER, SINAV_TARIHI, TYT_DERSLER, dersAdi } from "@/lib/yks";
import type { Profil } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Sutun = { header: string; key: string; width: number };

const BASLIK_DOLGU = "FF1E40AF";

function sayfaKur(ws: ExcelJS.Worksheet, sutunlar: Sutun[]) {
  ws.columns = sutunlar;
  const baslik = ws.getRow(1);
  baslik.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  baslik.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BASLIK_DOLGU } };
  baslik.alignment = { vertical: "middle", horizontal: "left" };
  baslik.height = 20;
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sutunlar.length } };
}

/** AYT ders sütunları alana göre değiştiği için yalnızca veride geçenler yazılır. */
const AYT_SIRA = [
  ...new Map(
    [...AYT_DERSLER.SAY, ...AYT_DERSLER.EA, ...AYT_DERSLER.SOZ].map((d) => [d.key, d]),
  ).values(),
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { baslangic, bitis } = aralikDogrula(
    searchParams.get("baslangic"),
    searchParams.get("bitis"),
  );

  // adminVerisi yetkisiz çağrıda /panel'e yönlendirir.
  const veri = await adminVerisi(baslangic, bitis);

  const profilAdi = new Map<string, Profil>(veri.profiller.map((p) => [p.id, p]));
  const ad = (id: string) => profilAdi.get(id)?.ad_soyad ?? profilAdi.get(id)?.email ?? id;
  const eposta = (id: string) => profilAdi.get(id)?.email ?? "";

  const wb = new ExcelJS.Workbook();
  wb.creator = "YKS Takip";
  wb.created = new Date();

  /* ---------------------------------------------------------------- Özet */
  const ozet = wb.addWorksheet("Özet");
  ozet.columns = [
    { header: "", key: "a", width: 28 },
    { header: "", key: "b", width: 24 },
  ];
  ozet.addRows([
    { a: "YKS TAKİP — VERİ DIŞA AKTARIMI" },
    { a: "Tarih aralığı", b: `${baslangic} — ${bitis}` },
    { a: "Oluşturulma", b: new Date().toLocaleString("tr-TR") },
    {},
    { a: "Kayıtlı kullanıcı", b: veri.toplam.kullanici },
    { a: "Aktif öğrenci", b: veri.toplam.aktifOgrenci },
    { a: "Toplam çözülen soru", b: veri.toplam.soru },
    { a: "Toplam süre (dk)", b: veri.toplam.sure },
    { a: "Toplam deneme", b: veri.toplam.deneme },
    { a: "TYT ortalama net", b: veri.toplam.tytOrt ?? "—" },
    { a: "AYT ortalama net", b: veri.toplam.aytOrt ?? "—" },
    {},
    { a: "Not", b: "Net = Doğru − Yanlış / 4" },
  ]);
  ozet.getRow(1).font = { bold: true, size: 14, color: { argb: BASLIK_DOLGU } };
  ozet.getColumn("a").font = { bold: true };
  ozet.getRow(1).getCell("a").font = { bold: true, size: 14, color: { argb: BASLIK_DOLGU } };

  /* ----------------------------------------------------------- Öğrenciler */
  const ogrenciler = wb.addWorksheet("Öğrenciler");
  sayfaKur(ogrenciler, [
    { header: "Ad Soyad", key: "ad", width: 24 },
    { header: "E-posta", key: "email", width: 28 },
    { header: "Alan", key: "alan", width: 14 },
    { header: "Hedef Üniversite", key: "uni", width: 22 },
    { header: "Hedef Bölüm", key: "bolum", width: 24 },
    { header: "Hedef Sıralama", key: "siralama", width: 15 },
    { header: "Sınav Tarihi", key: "sinavTarihi", width: 13 },
    { header: "Çözülen Soru", key: "soru", width: 13 },
    { header: "Süre (dk)", key: "sure", width: 11 },
    { header: "Çalışma Bloğu", key: "blok", width: 14 },
    { header: "Deneme Sayısı", key: "deneme", width: 14 },
    { header: "TYT Ort. Net", key: "tyt", width: 13 },
    { header: "AYT Ort. Net", key: "ayt", width: 13 },
    { header: "Son Aktivite", key: "sonAktivite", width: 13 },
    { header: "Kayıt Tarihi", key: "kayit", width: 13 },
  ]);
  for (const o of veri.ogrenciler) {
    ogrenciler.addRow({
      ad: o.profil.ad_soyad ?? "",
      email: o.profil.email ?? "",
      alan: o.profil.alan ? ALAN_ADI[o.profil.alan] : "",
      uni: o.profil.hedef_universite ?? "",
      bolum: o.profil.hedef_bolum ?? "",
      siralama: o.profil.hedef_siralama ?? "",
      sinavTarihi: SINAV_TARIHI,
      soru: o.soru,
      sure: o.sure,
      blok: o.blok,
      deneme: o.denemeSayisi,
      tyt: o.tytOrt ?? "",
      ayt: o.aytOrt ?? "",
      sonAktivite: o.sonAktivite ?? "",
      kayit: o.profil.created_at?.slice(0, 10) ?? "",
    });
  }

  /* -------------------------------------------------------- Günlük Takip */
  const gunluk = wb.addWorksheet("Günlük Takip");
  sayfaKur(gunluk, [
    { header: "Öğrenci", key: "ogrenci", width: 22 },
    { header: "E-posta", key: "email", width: 26 },
    { header: "Tarih", key: "tarih", width: 12 },
    { header: "Sınav", key: "sinav", width: 8 },
    { header: "Ders", key: "ders", width: 22 },
    { header: "Konu", key: "konu", width: 30 },
    { header: "Çözülen Soru", key: "soru", width: 13 },
    { header: "D", key: "dogru", width: 7 },
    { header: "Y", key: "yanlis", width: 7 },
    { header: "B", key: "bos", width: 7 },
    { header: "Net", key: "net", width: 9 },
    { header: "Süre (dk)", key: "sure", width: 11 },
    { header: "Verim (soru/sa)", key: "verim", width: 15 },
    { header: "Not", key: "not", width: 40 },
  ]);
  for (const k of veri.kayitlar) {
    gunluk.addRow({
      ogrenci: ad(k.user_id),
      email: eposta(k.user_id),
      tarih: k.tarih,
      sinav: k.sinav,
      ders: dersAdi(k.ders),
      konu: k.konu ?? "",
      soru: k.soru,
      dogru: k.dogru ?? "",
      yanlis: k.yanlis ?? "",
      bos: k.bos ?? "",
      net: k.net === null ? "" : Number(k.net),
      sure: k.sure_dk ?? "",
      verim: k.sure_dk ? Math.round((k.soru / (k.sure_dk / 60)) * 10) / 10 : "",
      not: k.not_metni ?? "",
    });
  }

  /* ------------------------------------------------- Deneme TYT / AYT */
  const bolumHaritasi = new Map<string, Map<string, { dogru: number; yanlis: number; net: number }>>();
  for (const b of veri.bolumler) {
    const mevcut = bolumHaritasi.get(b.mock_exam_id) ?? new Map();
    mevcut.set(b.ders, { dogru: b.dogru, yanlis: b.yanlis, net: Number(b.net) });
    bolumHaritasi.set(b.mock_exam_id, mevcut);
  }

  function denemeSayfasi(sinav: "TYT" | "AYT", dersListesi: { key: string; ad: string; soru: number }[]) {
    const denemeler = veri.denemeler.filter((d) => d.sinav === sinav);
    const ws = wb.addWorksheet(`Deneme ${sinav}`);

    const dersSutunlari: Sutun[] = dersListesi.flatMap((d) => [
      { header: `${d.ad} D`, key: `d_${d.key}`, width: 10 },
      { header: `${d.ad} Y`, key: `y_${d.key}`, width: 10 },
      { header: `${d.ad} Net`, key: `n_${d.key}`, width: 11 },
    ]);

    sayfaKur(ws, [
      { header: "Öğrenci", key: "ogrenci", width: 22 },
      { header: "E-posta", key: "email", width: 26 },
      { header: "Tarih", key: "tarih", width: 12 },
      { header: "Deneme Adı", key: "ad", width: 24 },
      ...dersSutunlari,
      { header: "Toplam Net", key: "toplamNet", width: 12 },
      { header: "Boş", key: "bos", width: 8 },
      { header: "Değerlendirme", key: "not", width: 40 },
    ]);

    for (const d of denemeler) {
      const bolum = bolumHaritasi.get(d.id);
      const satir: Record<string, string | number> = {
        ogrenci: ad(d.user_id),
        email: eposta(d.user_id),
        tarih: d.tarih,
        ad: d.ad,
        toplamNet: Number(d.toplam_net),
        bos: d.toplam_bos,
        not: d.not_metni ?? "",
      };
      for (const ders of dersListesi) {
        const b = bolum?.get(ders.key);
        satir[`d_${ders.key}`] = b?.dogru ?? "";
        satir[`y_${ders.key}`] = b?.yanlis ?? "";
        satir[`n_${ders.key}`] = b?.net ?? "";
      }
      ws.addRow(satir);
    }
  }

  denemeSayfasi("TYT", TYT_DERSLER);

  const aytDenemeIdleri = new Set(
    veri.denemeler.filter((d) => d.sinav === "AYT").map((d) => d.id),
  );
  const kullanilanAyt = new Set(
    veri.bolumler.filter((b) => aytDenemeIdleri.has(b.mock_exam_id)).map((b) => b.ders),
  );
  const aytDersleri = AYT_SIRA.filter((d) => kullanilanAyt.has(d.key));
  denemeSayfasi("AYT", aytDersleri.length > 0 ? aytDersleri : AYT_DERSLER.SAY);

  /* -------------------------------------------------------- Haftalık Özet */
  const haftalik = wb.addWorksheet("Haftalık Özet");
  sayfaKur(haftalik, [
    { header: "Öğrenci", key: "ogrenci", width: 22 },
    { header: "E-posta", key: "email", width: 26 },
    { header: "Başlangıç", key: "bas", width: 12 },
    { header: "Bitiş", key: "bit", width: 12 },
    { header: "Toplam Soru", key: "soru", width: 13 },
    { header: "Toplam Süre (dk)", key: "sure", width: 16 },
    { header: "Çalışma Bloğu", key: "blok", width: 14 },
    { header: "Deneme Sayısı", key: "deneme", width: 14 },
    { header: "TYT Ort. Net", key: "tyt", width: 13 },
    { header: "AYT Ort. Net", key: "ayt", width: 13 },
  ]);
  for (const o of veri.ogrenciler) {
    if (o.soru === 0 && o.denemeSayisi === 0) continue;
    const haftalar = haftalikOzet(
      veri.kayitlar.filter((k) => k.user_id === o.profil.id),
      veri.denemeler.filter((d) => d.user_id === o.profil.id),
      12,
    );
    for (const h of haftalar) {
      if (h.soru === 0 && h.denemeSayisi === 0) continue;
      haftalik.addRow({
        ogrenci: o.profil.ad_soyad ?? o.profil.email,
        email: o.profil.email ?? "",
        bas: h.baslangic,
        bit: h.bitis,
        soru: h.soru,
        sure: h.sure,
        blok: h.blok,
        deneme: h.denemeSayisi,
        tyt: h.tytNet ?? "",
        ayt: h.aytNet ?? "",
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const dosyaAdi = `yks-takip_${baslangic}_${bitis}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
      "Cache-Control": "no-store",
    },
  });
}
