"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { profilKaydet, type ProfilState } from "@/app/kurulum/actions";
import { ALANLAR, dersler, toplamSoru, varsayilanHedef, type Alan } from "@/lib/yks";
import { Alert, Button, Card, CardHeader, Field, Input, cn } from "./ui";

const BOS: ProfilState = {};

export type ProfilBaslangic = {
  adSoyad: string;
  alan: Alan | null;
  hedefUniversite: string;
  hedefBolum: string;
  hedefSiralama: string;
  sinavTarihi: string;
  hedefler: Record<string, number>;
};

function KaydetButonu({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending ? "Kaydediliyor…" : children}
    </Button>
  );
}

/** Alan seçim kartları — radyo grubu olarak erişilebilir. */
function AlanSecici({ deger, onChange }: { deger: Alan | null; onChange: (a: Alan) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-heading">
        Alanın
        <span className="text-danger" aria-hidden="true">
          {" *"}
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {ALANLAR.map((a) => {
          const secili = deger === a.value;
          return (
            <label
              key={a.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-md border-2 p-3 transition-colors duration-200",
                secili
                  ? "border-primary bg-muted"
                  : "border-line-strong bg-surface hover:border-secondary",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="alan"
                  value={a.value}
                  checked={secili}
                  onChange={() => onChange(a.value)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                  required
                />
                <span className="font-medium text-heading">{a.label}</span>
              </span>
              <span className="pl-6 text-xs text-muted-ink">{a.aciklama}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Bir sınavın ders bazlı hedef net girişleri. */
function HedefTablosu({
  alan,
  sinav,
  hedefler,
  setHedef,
}: {
  alan: Alan;
  sinav: "TYT" | "AYT";
  hedefler: Record<string, number>;
  setHedef: (key: string, v: number) => void;
}) {
  const liste = dersler(alan, sinav);
  const toplamHedef = liste.reduce(
    (t, d) => t + (hedefler[d.key] ?? varsayilanHedef(d.soru)),
    0,
  );

  return (
    <Card>
      <CardHeader
        title={`${sinav} hedef netleri`}
        description={`${liste.length} ders · toplam ${toplamSoru(alan, sinav)} soru`}
        action={
          <div className="text-right">
            <p className="text-xs text-muted-ink">Toplam hedef</p>
            <p className="tabular text-lg font-semibold text-accent">
              {Math.round(toplamHedef * 100) / 100}
            </p>
          </div>
        }
      />
      <div className="divide-y divide-line">
        {liste.map((d) => {
          const id = `hedef_${d.key}`;
          const deger = hedefler[d.key] ?? varsayilanHedef(d.soru);
          return (
            <div key={d.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <label htmlFor={id} className="min-w-0 text-sm text-ink">
                {d.ad}
                <span className="ml-1.5 text-xs text-muted-ink">({d.soru} soru)</span>
              </label>
              <Input
                id={id}
                name={id}
                type="number"
                inputMode="decimal"
                min={0}
                max={d.soru}
                step={0.25}
                value={deger}
                onChange={(e) => setHedef(d.key, Number(e.target.value))}
                className="w-24 text-right"
                aria-label={`${d.ad} hedef net`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ProfilFormu({
  baslangic,
  mod,
}: {
  baslangic: ProfilBaslangic;
  mod: "kurulum" | "ayarlar";
}) {
  const [state, formAction] = useActionState(profilKaydet, BOS);
  const [alan, setAlan] = useState<Alan | null>(baslangic.alan);
  const [hedefler, setHedefler] = useState<Record<string, number>>(baslangic.hedefler);
  const [adim, setAdim] = useState<1 | 2>(1);

  const setHedef = (key: string, v: number) =>
    setHedefler((h) => ({ ...h, [key]: Number.isFinite(v) ? v : 0 }));

  const kurulum = mod === "kurulum";
  // 2. adımda görünmeyen 1. adım alanları da forma dahil kalsın diye
  // adım geçişini gizleyerek yapıyoruz, DOM'dan çıkararak değil.
  const adim1Gorunur = !kurulum || adim === 1;
  const adim2Gorunur = !kurulum || adim === 2;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="yon" value={kurulum ? "panel" : "kal"} />

      {kurulum && (
        <ol className="flex items-center gap-2 text-sm" aria-label="Kurulum adımları">
          {[
            { n: 1 as const, ad: "Hedefin" },
            { n: 2 as const, ad: "Net hedefleri" },
          ].map((s) => (
            <li key={s.n} className="flex items-center gap-2">
              <span
                aria-current={adim === s.n ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1 font-medium",
                  adim === s.n ? "bg-primary text-on-primary" : "bg-muted text-muted-ink",
                )}
              >
                <span className="tabular">{s.n}</span>
                {s.ad}
              </span>
              {s.n === 1 && <span className="h-px w-4 bg-line-strong" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      )}

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Değişiklikler kaydedildi.</Alert>}

      <div className={cn("flex flex-col gap-5", !adim1Gorunur && "hidden")}>
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <Field label="Ad Soyad" htmlFor="adSoyad" required>
            <Input
              id="adSoyad"
              name="adSoyad"
              defaultValue={baslangic.adSoyad}
              autoComplete="name"
              required
            />
          </Field>

          <AlanSecici deger={alan} onChange={setAlan} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hedef üniversite" htmlFor="hedefUniversite">
              <Input
                id="hedefUniversite"
                name="hedefUniversite"
                defaultValue={baslangic.hedefUniversite}
                placeholder="ODTÜ"
              />
            </Field>
            <Field label="Hedef bölüm" htmlFor="hedefBolum">
              <Input
                id="hedefBolum"
                name="hedefBolum"
                defaultValue={baslangic.hedefBolum}
                placeholder="Endüstri Mühendisliği"
              />
            </Field>
            <Field label="Hedef sıralama" htmlFor="hedefSiralama" hint="Örn. 8000">
              <Input
                id="hedefSiralama"
                name="hedefSiralama"
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={baslangic.hedefSiralama}
              />
            </Field>
            <Field
              label="Sınav tarihi"
              htmlFor="sinavTarihi"
              hint="Panelde kalan gün sayacı için."
            >
              <Input
                id="sinavTarihi"
                name="sinavTarihi"
                type="date"
                defaultValue={baslangic.sinavTarihi}
              />
            </Field>
          </div>
        </Card>

        {kurulum && (
          <div className="flex justify-end">
            <Button
              type="button"
              size="lg"
              disabled={!alan}
              onClick={() => setAdim(2)}
              title={alan ? undefined : "Önce alanını seç"}
            >
              Devam et
            </Button>
          </div>
        )}
      </div>

      <div className={cn("flex flex-col gap-5", !adim2Gorunur && "hidden")}>
        {alan ? (
          <>
            <p className="text-sm text-muted-ink">
              Her ders için hedeflediğin neti gir. Varsayılanlar soru sayısının %85&apos;i olarak
              dolduruldu; panelde bunları deneme ortalamanla karşılaştıracağız.
            </p>
            <HedefTablosu alan={alan} sinav="TYT" hedefler={hedefler} setHedef={setHedef} />
            <HedefTablosu alan={alan} sinav="AYT" hedefler={hedefler} setHedef={setHedef} />
          </>
        ) : (
          <Alert tone="warn">Net hedeflerini görmek için önce alanını seç.</Alert>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {kurulum && (
            <Button type="button" variant="outline" size="lg" onClick={() => setAdim(1)}>
              Geri
            </Button>
          )}
          <KaydetButonu>{kurulum ? "Kurulumu tamamla" : "Değişiklikleri kaydet"}</KaydetButonu>
        </div>
      </div>
    </form>
  );
}
