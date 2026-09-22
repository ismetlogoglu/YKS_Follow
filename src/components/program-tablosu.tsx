"use client";

import { useState, useTransition } from "react";
import { Download, Pencil, RotateCcw, Target, type LucideIcon } from "lucide-react";
import { programKaydet } from "@/app/panel/program/actions";
import { programGorseliCiz, programGorseliniKaydet } from "@/lib/program-gorsel";
import { GUN_RENGI, hucreRengi, type HucreRengi } from "@/lib/program-renk";
import {
  GUNLER,
  PROGRAM_DERSLERI,
  PROGRAM_SATIR,
  hucreAnahtari,
  programDersAdi,
  type Alan,
} from "@/lib/yks";
import { Alert, Button, Card, CardHeader, Spinner, cn } from "./ui";

/**
 * Gün sütunu — hem düzenleme hem görüntüleme modunda aynı ızgara.
 *
 * Gün adı dolu, koyu bir bantta ve 18px kalın: ders hücreleri yarı saydam
 * tonlarda olduğu için başlık onlarla karışmıyor. "Bugün" etiketi bandın üst
 * kenarına taşıyor; bant içine koysaydık o sütun uzar, 7 sütunlu düzende
 * satırlar hizasını kaybederdi.
 */
function GunSutunu({
  gun,
  bugun,
  children,
}: {
  gun: number;
  bugun: boolean;
  children: React.ReactNode;
}) {
  const zemin = bugun ? GUN_RENGI.bugun : gun >= 5 ? GUN_RENGI.haftaSonu : GUN_RENGI.hafta;
  return (
    <section
      aria-label={GUNLER[gun]}
      className={cn(
        "flex flex-col gap-2 rounded-xl p-1.5 lg:p-1",
        // Sütuna zemin rengi verilmiyor: hücreler yarı saydam, altlarındaki mavi ton
        // sarıyı bej-kahverengiye çeviriyordu. Bugünü başlık rengi ve çerçeve gösteriyor.
        bugun && "ring-2 ring-[rgba(37,99,235,0.35)]",
      )}
    >
      <h3
        style={{ backgroundColor: zemin, color: GUN_RENGI.yazi }}
        className="relative flex min-h-12 items-center justify-center rounded-lg px-2 text-lg font-bold tracking-tight shadow-sm"
      >
        {GUNLER[gun]}
        {bugun && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-px text-[11px] font-semibold tracking-wide text-[#1d4ed8] uppercase shadow-sm ring-1 ring-[rgba(37,99,235,0.35)]">
            Bugün
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

const IZGARA = "grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-7 lg:gap-1.5 lg:p-3";

/**
 * Ders hücresinin rengi: yarı saydam zemin + çerçeve, solda dolu şerit.
 * Kenarlar tek tek yazılıyor: borderStyle kısayolu ile borderLeftStyle birlikte
 * verilince React, hücre kesikliden düze geçerken şeridi bozabiliyor.
 */
function hucreStili(renk: HucreRengi): React.CSSProperties {
  const cizgiStili = renk.kesikli ? "dashed" : "solid";
  return {
    backgroundColor: renk.zemin,
    color: renk.yazi,
    borderTopColor: renk.cizgi,
    borderRightColor: renk.cizgi,
    borderBottomColor: renk.cizgi,
    borderLeftColor: renk.serit,
    borderTopStyle: cizgiStili,
    borderRightStyle: cizgiStili,
    borderBottomStyle: cizgiStili,
    borderLeftStyle: "solid",
    fontWeight: renk.kalin ? 700 : 600,
  };
}

/** Ders olmayan iki blok simgeyle de ayrışsın; anlam yalnızca renge kalmasın. */
const OZEL_IKON: Record<string, LucideIcon> = { p_deneme: Target, p_tekrar: RotateCcw };

/** Pazartesi = 0. `gunIso` Türkiye takvimindeki gün (YYYY-AA-GG). */
function haftaninGunu(gunIso: string): number {
  return (new Date(`${gunIso}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Select'in kendi oku; rengi hücrenin yazı rengini takip eder. */
const OK_SVG = (renk: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 6" fill="none" stroke="${renk}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l4 4 4-4"/></svg>`,
  )}")`;

export function ProgramTablosu({
  alan,
  baslangic,
  ogrenciAdi,
  sonKayit,
  tabloYok,
  bugun,
}: {
  alan: Alan;
  baslangic: Record<string, string>;
  ogrenciAdi: string;
  sonKayit: string | null;
  tabloYok: boolean;
  /** Türkiye takviminde bugün — sunucuda hesaplanıyor, telefonla aynı günü göstersin diye. */
  bugun: string;
}) {
  const [kayitli, setKayitli] = useState(baslangic);
  const [taslak, setTaslak] = useState(baslangic);
  const [kayitZamani, setKayitZamani] = useState(sonKayit);
  // Hiç kayıt yoksa doğrudan düzenleme modunda aç; boş bir görünüm gösterip
  // kullanıcıyı fazladan bir tıklamaya zorlamanın anlamı yok.
  const [duzenle, setDuzenle] = useState(Object.keys(baslangic).length === 0);

  const [kaydediliyor, kaydetmeyiBaslat] = useTransition();
  const [hata, setHata] = useState<string | null>(tabloYok ? TABLO_UYARISI : null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [indiriliyor, setIndiriliyor] = useState(false);

  const dersler = PROGRAM_DERSLERI[alan];
  const bugunkuGun = haftaninGunu(bugun);
  const gosterilen = duzenle ? taslak : kayitli;
  const doluHucre = Object.values(gosterilen).filter(Boolean).length;
  const toplamHucre = GUNLER.length * PROGRAM_SATIR;

  function kaydet() {
    setHata(null);
    setBilgi(null);
    kaydetmeyiBaslat(async () => {
      const sonuc = await programKaydet(taslak);
      if (sonuc.durum === "hata") {
        setHata(sonuc.mesaj);
        return;
      }
      setKayitli(taslak);
      setKayitZamani(sonuc.kayitZamani);
      setDuzenle(false);
      setBilgi("Programın kaydedildi. Her girişinde burada seni bekler.");
    });
  }

  async function gorseliIndir() {
    setIndiriliyor(true);
    setHata(null);
    setBilgi(null);
    try {
      const canvas = programGorseliCiz(gosterilen, ogrenciAdi);
      const sonuc = await programGorseliniKaydet(canvas, "haftalik-program.png");
      if (sonuc === "paylasildi") {
        setBilgi("Paylaşım penceresi açıldı — “Fotoğraflara Kaydet” ile galerine ekleyebilirsin.");
      } else if (sonuc === "indirildi") {
        setBilgi("Program görseli indirildi (haftalik-program.png).");
      }
      // "iptal": kullanıcı paylaşımdan vazgeçti, mesaj gösterme.
    } catch {
      setHata("Görsel oluşturulamadı. Sayfayı yenileyip tekrar dene.");
    } finally {
      setIndiriliyor(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {hata && <Alert tone="danger">{hata}</Alert>}
      {bilgi && <Alert tone="success">{bilgi}</Alert>}

      <Card>
        <CardHeader
          title={duzenle ? "Programı düzenle" : "Kayıtlı programım"}
          description={
            duzenle
              ? `Her hücreye bir ders seç · ${doluHucre}/${toplamHucre} dolu`
              : kayitZamani
                ? `Son kayıt: ${new Date(kayitZamani).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} · ${doluHucre}/${toplamHucre} dolu`
                : `${doluHucre}/${toplamHucre} dolu`
          }
        />

        <div className={IZGARA}>
          {GUNLER.map((_, gun) => (
            <GunSutunu key={gun} gun={gun} bugun={gun === bugunkuGun}>
              {Array.from({ length: PROGRAM_SATIR }, (_, satir) => {
                const anahtar = hucreAnahtari(gun, satir);
                const deger = gosterilen[anahtar] ?? "";
                const renk = hucreRengi(deger || undefined);
                const stil = hucreStili(renk);

                if (!duzenle) {
                  const Ikon = OZEL_IKON[deger];
                  return (
                    <p
                      key={anahtar}
                      style={stil}
                      className="flex min-h-12 items-center gap-1.5 rounded-lg border border-l-4 px-3 py-1.5 text-sm leading-tight"
                    >
                      {Ikon && <Ikon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      {deger ? programDersAdi(deger) : "Boş"}
                    </p>
                  );
                }

                return (
                  <select
                    key={anahtar}
                    value={deger}
                    aria-label={`${GUNLER[gun]} ${satir + 1}. blok`}
                    onChange={(e) => setTaslak((h) => ({ ...h, [anahtar]: e.target.value }))}
                    style={{ ...stil, backgroundImage: OK_SVG(renk.yazi) }}
                    /* appearance-none: yerel açılır ok her platformda farklı yer
                       kaplıyor ve ortalanmış metni kırpabiliyordu. Oku kendimiz
                       çizip sağda sabit 18px ayırıyoruz. */
                    /* text-base (16px) mobilde şart: iOS Safari 16px'ten küçük bir
                       alana odaklanınca sayfayı otomatik yakınlaştırıyor ve geri
                       döndürmüyor. lg'de yer dar olduğu için 13px'e iniyoruz. */
                    className="min-h-12 w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg border border-l-4 bg-[length:10px] bg-[right_8px_center] bg-no-repeat py-2 pr-[22px] pl-2.5 text-left text-base transition-colors duration-200 hover:brightness-[0.97] lg:pr-[18px] lg:pl-2 lg:text-[13px]"
                  >
                    <option value="">Ders seç</option>
                    {dersler.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.ad}
                      </option>
                    ))}
                  </select>
                );
              })}
            </GunSutunu>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={gorseliIndir}
          disabled={indiriliyor}
          aria-busy={indiriliyor}
        >
          {indiriliyor ? <Spinner /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {indiriliyor ? "Hazırlanıyor…" : "Cihaza kaydet"}
        </Button>

        {duzenle ? (
          <>
            {Object.keys(kayitli).length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={kaydediliyor}
                onClick={() => {
                  setTaslak(kayitli);
                  setDuzenle(false);
                  setHata(null);
                  setBilgi(null);
                }}
              >
                Vazgeç
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              onClick={kaydet}
              disabled={kaydediliyor}
              aria-busy={kaydediliyor}
            >
              {kaydediliyor && <Spinner />}
              {kaydediliyor ? "Kaydediliyor…" : "Programı kaydet"}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={() => {
              setTaslak(kayitli);
              setDuzenle(true);
              setBilgi(null);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Programı düzenle
          </Button>
        )}
      </div>
    </div>
  );
}

const TABLO_UYARISI =
  "Program tablosu veritabanında yok, bu yüzden kaydetme çalışmaz. Supabase panelinde " +
  "SQL Editor'ı açıp supabase/migrations/001_haftalik_program.sql dosyasını çalıştır.";
