"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { denemeEkle, type DenemeState } from "@/app/panel/deneme/actions";
import { bugun, dersler, net, netYaz, toplamSoru, type Alan, type SinavTuru } from "@/lib/yks";
import { SinavSecici } from "./soru-formu";
import { Alert, Button, Card, CardHeader, Field, Input, Spinner, Textarea } from "./ui";

/**
 * Ders satırı ızgarası. Dar ekranda ders adı tam satır, altında 4 sütun;
 * sm ve üzerinde tek satırlık tablo görünümü. Tek bir DOM ağacı kullanılıyor —
 * mobil/masaüstü için ayrı kopya render etmek aynı isimli inputları
 * iki kez forma eklerdi.
 */
const SATIR = "grid grid-cols-4 gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_3.5rem_4.5rem] sm:items-center";

const BOS: DenemeState = {};

function KaydetButonu() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending && <Spinner />}
      {pending ? "Kaydediliyor…" : "Denemeyi kaydet"}
    </Button>
  );
}

type Girdi = { dogru: string; yanlis: string };

/**
 * Alanlar ayrı bir bileşende: başarılı kayıttan sonra dışarıdaki `key`
 * değişince bileşen yeniden kurulur ve tablo boşalır.
 */
function DenemeAlanlari({ alan }: { alan: Alan }) {
  const [sinav, setSinav] = useState<SinavTuru>("TYT");
  const [girdiler, setGirdiler] = useState<Record<string, Girdi>>({});

  const liste = dersler(alan, sinav);
  const oku = (key: string) => girdiler[key] ?? { dogru: "", yanlis: "" };

  const yaz = (key: string, alanAdi: keyof Girdi, deger: string) =>
    setGirdiler((g) => ({ ...g, [key]: { ...(g[key] ?? { dogru: "", yanlis: "" }), [alanAdi]: deger } }));

  const satirlar = liste.map((d) => {
    const g = oku(d.key);
    const dogru = Number(g.dogru) || 0;
    const yanlis = Number(g.yanlis) || 0;
    const bos = d.soru - dogru - yanlis;
    return { ders: d, dogru, yanlis, bos, net: net(dogru, yanlis), asim: bos < 0 };
  });

  const toplamNet = satirlar.reduce((t, s) => t + s.net, 0);
  const toplamBos = satirlar.reduce((t, s) => t + Math.max(s.bos, 0), 0);
  const asimVar = satirlar.some((s) => s.asim);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarih" htmlFor="d_tarih" required>
          <Input
            id="d_tarih"
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
        <Field label="Deneme adı" htmlFor="d_ad" className="sm:col-span-2" required>
          <Input id="d_ad" name="ad" maxLength={120} placeholder="3D Yayınları TYT-1" required />
        </Field>
      </div>

      <div className="overflow-hidden rounded-md border border-line">
        {/* Başlık satırı yalnızca geniş ekranda; darda her input kendi etiketini taşır. */}
        <div
          className={`${SATIR} hidden border-b border-line bg-canvas px-3 py-2 text-xs font-semibold tracking-wide text-muted-ink uppercase sm:grid`}
          aria-hidden="true"
        >
          <span>Ders</span>
          <span className="text-right">Doğru</span>
          <span className="text-right">Yanlış</span>
          <span className="text-right">Boş</span>
          <span className="text-right">Net</span>
        </div>

        <div className="divide-y divide-line">
          {satirlar.map((s) => (
            <div key={s.ders.key} className={`${SATIR} px-3 py-2.5`}>
              <p className="col-span-4 sm:col-span-1">
                <span className="font-medium text-heading">{s.ders.ad}</span>
                <span className="ml-1.5 text-xs text-muted-ink">({s.ders.soru} soru)</span>
              </p>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-ink sm:sr-only">Doğru</span>
                <Input
                  name={`dogru_${s.ders.key}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={s.ders.soru}
                  value={oku(s.ders.key).dogru}
                  onChange={(e) => yaz(s.ders.key, "dogru", e.target.value)}
                  className="text-right"
                  aria-label={`${s.ders.ad} doğru sayısı`}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-ink sm:sr-only">Yanlış</span>
                <Input
                  name={`yanlis_${s.ders.key}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={s.ders.soru}
                  value={oku(s.ders.key).yanlis}
                  onChange={(e) => yaz(s.ders.key, "yanlis", e.target.value)}
                  className="text-right"
                  aria-label={`${s.ders.ad} yanlış sayısı`}
                />
              </label>

              <p className="flex flex-col gap-1 text-right">
                <span className="text-[11px] text-muted-ink sm:sr-only">Boş</span>
                <span
                  className={`tabular min-h-11 content-center sm:min-h-0 ${s.asim ? "font-semibold text-danger" : "text-muted-ink"}`}
                >
                  {s.bos}
                </span>
              </p>

              <p className="flex flex-col gap-1 text-right">
                <span className="text-[11px] text-muted-ink sm:sr-only">Net</span>
                <span className="tabular min-h-11 content-center font-semibold text-heading sm:min-h-0">
                  {netYaz(s.net)}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className={`${SATIR} border-t border-line bg-canvas px-3 py-2.5`}>
          <p className="col-span-4 font-semibold text-heading sm:col-span-1">
            Toplam
            <span className="ml-1.5 text-xs font-normal text-muted-ink">
              ({toplamSoru(alan, sinav)} soru)
            </span>
          </p>
          <p className="tabular text-right font-medium">
            {satirlar.reduce((t, s) => t + s.dogru, 0)}
          </p>
          <p className="tabular text-right font-medium">
            {satirlar.reduce((t, s) => t + s.yanlis, 0)}
          </p>
          <p className="tabular text-right font-medium">{toplamBos}</p>
          <p className="tabular text-right text-lg leading-tight font-semibold text-accent">
            {netYaz(toplamNet)}
          </p>
        </div>
      </div>

      {asimVar && (
        <Alert tone="danger">
          Bir derste doğru + yanlış toplamı, o dersin soru sayısını aşıyor. Kırmızı görünen boş
          değerlerini düzelt.
        </Alert>
      )}

      <Field label="Değerlendirme / hata analizi" htmlFor="d_not">
        <Textarea
          id="d_not"
          name="not_metni"
          maxLength={500}
          rows={2}
          placeholder="Paragrafta süre sıkıntısı; Fen'de yorum sorularında yanlış."
        />
      </Field>

      <div className="flex justify-end">
        <KaydetButonu />
      </div>
    </>
  );
}

export function DenemeFormu({ alan }: { alan: Alan }) {
  const [state, formAction] = useActionState(denemeEkle, BOS);

  return (
    <Card>
      <CardHeader
        title="Deneme sınavı sonucu"
        description="Sadece doğru ve yanlış sayısını gir; net ve boş otomatik hesaplanır."
      />

      <form action={formAction} className="flex flex-col gap-4 p-4 sm:p-5">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.ok}</Alert>}

        <DenemeAlanlari key={state.token ?? "ilk"} alan={alan} />
      </form>
    </Card>
  );
}
