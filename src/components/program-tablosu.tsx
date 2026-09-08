"use client";

import { useState, useTransition } from "react";
import { Download, Pencil } from "lucide-react";
import { programKaydet } from "@/app/panel/program/actions";
import { programGorseliCiz, programGorseliniKaydet } from "@/lib/program-gorsel";
import { hucreRengi } from "@/lib/program-renk";
import {
  GUNLER,
  PROGRAM_DERSLERI,
  PROGRAM_SATIR,
  hucreAnahtari,
  programDersAdi,
  type Alan,
} from "@/lib/yks";
import { Alert, Button, Card, CardHeader, Spinner } from "./ui";

/** Gün sütunu — hem düzenleme hem görüntüleme modunda aynı ızgara. */
function GunSutunu({ gun, children }: { gun: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className={`rounded-md px-2 py-1.5 text-center text-sm font-semibold ${
          gun >= 5 ? "bg-muted text-muted-ink" : "bg-canvas text-heading"
        }`}
      >
        {GUNLER[gun]}
      </p>
      {children}
    </div>
  );
}

const IZGARA = "grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2 lg:p-3";

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
}: {
  alan: Alan;
  baslangic: Record<string, string>;
  ogrenciAdi: string;
  sonKayit: string | null;
  tabloYok: boolean;
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
            <GunSutunu key={gun} gun={gun}>
              {Array.from({ length: PROGRAM_SATIR }, (_, satir) => {
                const anahtar = hucreAnahtari(gun, satir);
                const deger = gosterilen[anahtar] ?? "";
                const renk = hucreRengi(deger || undefined);
                const stil = {
                  backgroundColor: renk.zemin,
                  color: renk.yazi,
                  borderColor: renk.cizgi,
                };

                if (!duzenle) {
                  return (
                    <p
                      key={anahtar}
                      style={stil}
                      className="flex min-h-11 items-center justify-center rounded-md border px-2 text-center text-sm font-medium"
                    >
                      {deger ? programDersAdi(deger) : "—"}
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
                    className="min-h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-md border bg-[length:10px] bg-[right_6px_center] bg-no-repeat py-2 pr-[18px] pl-[6px] text-center text-[13px] font-medium transition-colors duration-200 focus:border-primary"
                  >
                    <option value="">—</option>
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
