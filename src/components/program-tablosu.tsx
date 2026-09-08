"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Download } from "lucide-react";
import { programKaydet, type ProgramState } from "@/app/panel/program/actions";
import { programGorseliCiz, programGorseliniKaydet } from "@/lib/program-gorsel";
import { hucreRengi } from "@/lib/program-renk";
import { GUNLER, PROGRAM_DERSLERI, PROGRAM_SATIR, hucreAnahtari, type Alan } from "@/lib/yks";
import { Alert, Button, Card, CardHeader, Spinner } from "./ui";

const BOS: ProgramState = {};

function KaydetButonu() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending && <Spinner />}
      {pending ? "Kaydediliyor…" : "Programı kaydet"}
    </Button>
  );
}

export function ProgramTablosu({
  alan,
  baslangic,
  ogrenciAdi,
}: {
  alan: Alan;
  baslangic: Record<string, string>;
  ogrenciAdi: string;
}) {
  const [state, formAction] = useActionState(programKaydet, BOS);
  const [hucreler, setHucreler] = useState<Record<string, string>>(baslangic);
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [indirmeNotu, setIndirmeNotu] = useState<string | null>(null);
  const [indirmeHatasi, setIndirmeHatasi] = useState<string | null>(null);

  const dersler = PROGRAM_DERSLERI[alan];
  const doluHucre = Object.values(hucreler).filter(Boolean).length;

  async function gorseliIndir() {
    setIndiriliyor(true);
    setIndirmeNotu(null);
    setIndirmeHatasi(null);
    try {
      const canvas = programGorseliCiz(hucreler, ogrenciAdi);
      const sonuc = await programGorseliniKaydet(canvas, "haftalik-program.png");
      setIndirmeNotu(
        sonuc === "paylasildi"
          ? "Paylaşım penceresi açıldı — “Fotoğraflara Kaydet” ile galerine ekleyebilirsin."
          : "Görsel indirildi.",
      );
    } catch {
      setIndirmeHatasi("Görsel oluşturulamadı. Sayfayı yenileyip tekrar dene.");
    } finally {
      setIndiriliyor(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Programın kaydedildi.</Alert>}
      {indirmeHatasi && <Alert tone="danger">{indirmeHatasi}</Alert>}
      {indirmeNotu && <Alert tone="success">{indirmeNotu}</Alert>}

      <Card>
        <CardHeader
          title="Haftalık programım"
          description={`Her gün için 3 blok · ${doluHucre}/${GUNLER.length * PROGRAM_SATIR} hücre dolu`}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2 lg:p-3">
          {GUNLER.map((gunAdi, gun) => (
            <div key={gunAdi} className="flex flex-col gap-2">
              <p
                className={`rounded-md px-2 py-1.5 text-center text-sm font-semibold ${
                  gun >= 5 ? "bg-muted text-muted-ink" : "bg-canvas text-heading"
                }`}
              >
                {gunAdi}
              </p>

              {Array.from({ length: PROGRAM_SATIR }, (_, satir) => {
                const anahtar = hucreAnahtari(gun, satir);
                const deger = hucreler[anahtar] ?? "";
                const renk = hucreRengi(deger || undefined);

                return (
                  <select
                    key={anahtar}
                    name={anahtar}
                    value={deger}
                    aria-label={`${gunAdi} ${satir + 1}. blok`}
                    onChange={(e) =>
                      setHucreler((h) => ({ ...h, [anahtar]: e.target.value }))
                    }
                    style={{
                      backgroundColor: renk.zemin,
                      color: renk.yazi,
                      borderColor: renk.cizgi,
                    }}
                    className="min-h-11 w-full cursor-pointer rounded-md border px-2 text-center text-sm font-medium transition-colors duration-200 focus:border-primary"
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
            </div>
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
          {indiriliyor ? "Hazırlanıyor…" : "Programı indir"}
        </Button>
        <KaydetButonu />
      </div>
    </form>
  );
}
