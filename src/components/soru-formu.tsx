"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { calismaEkle, type KayitState } from "@/app/panel/soru/actions";
import { bugun, calismaDersleri, net, netYaz, verim, type Alan, type SinavTuru } from "@/lib/yks";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Spinner, Textarea, cn } from "./ui";

const BOS: KayitState = {};

/**
 * TYT / AYT seçimi.
 *
 * Gizli radyo + label yerine gerçek buton kullanılıyor: iOS Safari'de sr-only
 * (mutlak konumlu, kırpılmış) bir input'u saran label'a dokunmak her zaman
 * güvenilir şekilde tetiklenmiyordu. Form gönderimi için değeri gizli input taşır.
 */
export function SinavSecici({
  deger,
  onChange,
  ad = "sinav",
}: {
  deger: SinavTuru;
  onChange: (s: SinavTuru) => void;
  ad?: string;
}) {
  return (
    <div>
      <p id={`${ad}-etiket`} className="mb-1.5 text-sm font-medium text-heading">
        Sınav
      </p>
      <input type="hidden" name={ad} value={deger} />
      <div
        role="radiogroup"
        aria-labelledby={`${ad}-etiket`}
        className="inline-flex rounded-md border border-line-strong bg-muted p-0.5"
      >
        {(["TYT", "AYT"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={deger === s}
            onClick={() => onChange(s)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded px-6 font-medium transition-colors duration-200",
              deger === s
                ? "bg-surface text-primary shadow-[0_0_0_1px_var(--color-line-strong)]"
                : "text-muted-ink hover:text-heading",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function KaydetButonu() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending && <Spinner />}
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </Button>
  );
}

function OzetKutusu({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-md border border-line bg-canvas px-3 py-2 text-center">
      <p className="text-[11px] tracking-wide text-muted-ink uppercase">{etiket}</p>
      <p className="tabular text-lg font-semibold text-heading">{deger}</p>
    </div>
  );
}

/**
 * Form alanları ayrı bir bileşende: başarılı kayıttan sonra dışarıdaki `key`
 * değişince bileşen yeniden kurulur ve tüm alanlar boşalır.
 */
function SoruAlanlari({ alan }: { alan: Alan }) {
  const [sinav, setSinav] = useState<SinavTuru>("TYT");
  const [soru, setSoru] = useState("");
  const [dogru, setDogru] = useState("");
  const [yanlis, setYanlis] = useState("");
  const [sure, setSure] = useState("");

  const nSoru = Number(soru) || 0;
  const nDogru = dogru === "" ? null : Number(dogru) || 0;
  const nYanlis = yanlis === "" ? null : Number(yanlis) || 0;
  const girildi = nDogru !== null || nYanlis !== null;

  const bos = girildi ? nSoru - (nDogru ?? 0) - (nYanlis ?? 0) : null;
  const netDeger = girildi ? net(nDogru ?? 0, nYanlis ?? 0) : null;
  const verimDeger = verim(nSoru, Number(sure) || null);
  // Çözülen soru henüz girilmemişken uyarı gösterme — yazma sırası kullanıcının tercihi.
  const asim = girildi && nSoru > 0 && bos !== null && bos < 0;

  const liste = calismaDersleri(alan, sinav);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarih" htmlFor="tarih" required>
          <Input
            id="tarih"
            name="tarih"
            type="date"
            defaultValue={bugun()}
            max={bugun()}
            required
          />
        </Field>

        <div className="flex items-end">
          <SinavSecici deger={sinav} onChange={setSinav} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* key: sınav değişince tarayıcı eski ders seçimini tutmasın */}
        <Field label="Ders" htmlFor="ders" required>
          <Select id="ders" name="ders" key={sinav} required defaultValue="">
            <option value="" disabled>
              Ders seç…
            </option>
            {liste.map((d) => (
              <option key={d.key} value={d.key}>
                {d.ad}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Konu" htmlFor="konu" hint="İsteğe bağlı — örn. Türev, Paragraf">
          <Input id="konu" name="konu" maxLength={160} placeholder="Türev — Maksimum Minimum" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Çözülen soru" htmlFor="soru" required>
          <Input
            id="soru"
            name="soru"
            type="number"
            inputMode="numeric"
            min={1}
            max={2000}
            value={soru}
            onChange={(e) => setSoru(e.target.value)}
            required
          />
        </Field>
        <Field label="Doğru" htmlFor="dogru">
          <Input
            id="dogru"
            name="dogru"
            type="number"
            inputMode="numeric"
            min={0}
            value={dogru}
            onChange={(e) => setDogru(e.target.value)}
          />
        </Field>
        <Field label="Yanlış" htmlFor="yanlis">
          <Input
            id="yanlis"
            name="yanlis"
            type="number"
            inputMode="numeric"
            min={0}
            value={yanlis}
            onChange={(e) => setYanlis(e.target.value)}
          />
        </Field>
        <Field label="Süre (dk)" htmlFor="sure_dk">
          <Input
            id="sure_dk"
            name="sure_dk"
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            value={sure}
            onChange={(e) => setSure(e.target.value)}
          />
        </Field>
      </div>

      {asim && (
        <Alert tone="danger">
          Doğru + yanlış ({(nDogru ?? 0) + (nYanlis ?? 0)}) çözülen soru sayısını ({nSoru}) aşıyor.
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-3">
        <OzetKutusu
          etiket="Boş"
          deger={bos === null || nSoru === 0 ? "—" : String(Math.max(bos, 0))}
        />
        <OzetKutusu etiket="Net" deger={netYaz(netDeger)} />
        <OzetKutusu
          etiket="Verim"
          deger={verimDeger === null ? "—" : `${netYaz(verimDeger)}/sa`}
        />
      </div>

      <Field label="Not" htmlFor="not_metni" hint="Zorlandığın yer, hata analizi…">
        <Textarea id="not_metni" name="not_metni" maxLength={500} rows={2} />
      </Field>

      <div className="flex justify-end">
        <KaydetButonu />
      </div>
    </>
  );
}

export function SoruFormu({ alan }: { alan: Alan }) {
  const [state, formAction] = useActionState(calismaEkle, BOS);

  return (
    <Card>
      <CardHeader
        title="Günlük soru girişi"
        description="Bir ders için tek seferde çözdüğün soruları kaydet."
      />

      <form action={formAction} className="flex flex-col gap-4 p-4 sm:p-5">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.ok}</Alert>}

        <SoruAlanlari key={state.token ?? "ilk"} alan={alan} />
      </form>
    </Card>
  );
}
