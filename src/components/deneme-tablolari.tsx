import type { AnalizDenemesi } from "@/lib/analiz";
import { dersler, netYaz, tarihYaz, type Alan, type SinavTuru } from "@/lib/yks";
import { Card, CardHeader, cn } from "./ui";

/** Sütun başlıkları dar kalsın diye kısa adlar; tam ad başlığın title'ında. */
const KISA_AD: Record<string, string> = {
  tyt_turkce: "Türkçe",
  tyt_sosyal: "Sosyal",
  tyt_matematik: "Matematik",
  tyt_fen: "Fen",
  ayt_matematik: "Matematik",
  ayt_fizik: "Fizik",
  ayt_kimya: "Kimya",
  ayt_biyoloji: "Biyoloji",
  ayt_edebiyat: "Edebiyat",
  ayt_tarih1: "Tarih-1",
  ayt_cografya1: "Coğrafya-1",
  ayt_tarih2: "Tarih-2",
  ayt_cografya2: "Coğrafya-2",
  ayt_felsefe: "Felsefe",
  ayt_din: "Din",
};

function ortalama(sayilar: number[]): number | null {
  return sayilar.length ? sayilar.reduce((t, n) => t + n, 0) / sayilar.length : null;
}

/** Ortalama doğru/yanlış tek ondalık yeter: "11,5D". */
function ortYaz(n: number | null): string {
  return n === null ? "—" : (Math.round(n * 10) / 10).toLocaleString("tr-TR");
}

/**
 * Deneme adı sütunu kayarken sabit kalıyor. Yarı saydam + bulanık zemin: altından
 * geçen sayılar okunmuyor ama tablo "beyaz ve şeffaf" görünümünü koruyor.
 */
const ILK_SUTUN = "sticky left-0 z-10 backdrop-blur-sm pl-4 pr-3 text-left sm:pl-5";
/** Başlık ve ortalama satırının hafif tonu; zeminler tek tek veriliyor, cn çakışma çözmüyor. */
const SERIT = "bg-[#f8fafc]/90";
const HUCRE = "border-b border-line px-3 py-2.5 text-right align-top";
const TOPLAM = "border-l border-line";

function Deger({
  dogru,
  yanlis,
  net,
  vurgulu = false,
}: {
  dogru: string | number;
  yanlis: string | number;
  net: number | null;
  vurgulu?: boolean;
}) {
  return (
    <div className="tabular leading-tight whitespace-nowrap">
      <p className={cn("text-sm text-heading", vurgulu ? "font-bold" : "font-semibold")}>
        {netYaz(net)} <span className="text-xs font-normal text-muted-ink">net</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-ink">
        {dogru}D · {yanlis}Y
      </p>
    </div>
  );
}

function DenemeTablosu({
  sinav,
  alan,
  denemeler,
}: {
  sinav: SinavTuru;
  alan: Alan;
  denemeler: AnalizDenemesi[];
}) {
  const sutunlar = dersler(alan, sinav);
  // Gelen liste eskiden yeniye; tabloda en son girilen deneme en üstte.
  const liste = denemeler.filter((d) => d.sinav === sinav).reverse();

  return (
    <Card>
      <CardHeader
        title={`${sinav} denemeleri`}
        description={
          liste.length > 0 ? `${liste.length} deneme · en yenisi en üstte` : undefined
        }
      />

      {liste.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-ink">
          Henüz {sinav} denemesi yok.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
            <caption className="sr-only">
              {sinav} denemelerinin ders ders doğru, yanlış ve netleri; en yeni deneme en
              üstte, en altta ortalamalar.
            </caption>
            <thead>
              <tr className="text-xs font-semibold tracking-wide text-muted-ink uppercase">
                <th scope="col" className={cn(ILK_SUTUN, SERIT, "border-b border-line py-2.5")}>
                  Deneme
                </th>
                {sutunlar.map((s) => (
                  <th
                    key={s.key}
                    scope="col"
                    title={s.ad}
                    className={cn(SERIT, "border-b border-line px-3 py-2.5 text-right")}
                  >
                    {KISA_AD[s.key] ?? s.ad}
                  </th>
                ))}
                <th scope="col" className={cn(SERIT, "border-b border-line px-3 py-2.5 text-right", TOPLAM)}>
                  Toplam
                </th>
              </tr>
            </thead>

            <tbody>
              {liste.map((d) => (
                <tr key={d.id} className="group transition-colors duration-150 hover:bg-[#f8fafc]/70">
                  <th
                    scope="row"
                    className={cn(ILK_SUTUN, "border-b border-line bg-white/90 py-2.5 font-normal group-hover:bg-[#f8fafc]/90")}
                  >
                    {/* Telefonda dar: sabit sütun ekranın yarısını kaplamasın, yanında dersler görünsün. */}
                    <p className="max-w-[8.5rem] truncate font-medium text-ink sm:max-w-[11rem]" title={d.ad}>
                      {d.ad}
                    </p>
                    <p className="tabular mt-0.5 text-xs text-muted-ink">{tarihYaz(d.tarih)}</p>
                  </th>
                  {sutunlar.map((s) => {
                    const b = d.bolumler[s.key];
                    return (
                      <td key={s.key} className={HUCRE}>
                        {b ? (
                          <Deger dogru={b.dogru} yanlis={b.yanlis} net={b.net} />
                        ) : (
                          <span className="text-muted-ink">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={cn(HUCRE, TOPLAM)}>
                    <Deger dogru={d.toplamDogru} yanlis={d.toplamYanlis} net={d.toplamNet} vurgulu />
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th scope="row" className={cn(ILK_SUTUN, SERIT, "py-3 align-top")}>
                  <p className="font-semibold text-heading">Ortalama</p>
                  <p className="mt-0.5 text-xs font-normal text-muted-ink">
                    {liste.length} deneme
                  </p>
                </th>
                {sutunlar.map((s) => {
                  const b = liste.flatMap((d) => (d.bolumler[s.key] ? [d.bolumler[s.key]] : []));
                  return (
                    <td key={s.key} className={cn(SERIT, "px-3 py-3 text-right align-top")}>
                      {b.length ? (
                        <Deger
                          dogru={ortYaz(ortalama(b.map((x) => x.dogru)))}
                          yanlis={ortYaz(ortalama(b.map((x) => x.yanlis)))}
                          net={ortalama(b.map((x) => x.net))}
                        />
                      ) : (
                        <span className="text-muted-ink">—</span>
                      )}
                    </td>
                  );
                })}
                <td className={cn(SERIT, "px-3 py-3 text-right align-top", TOPLAM)}>
                  <Deger
                    dogru={ortYaz(ortalama(liste.map((d) => d.toplamDogru)))}
                    yanlis={ortYaz(ortalama(liste.map((d) => d.toplamYanlis)))}
                    net={ortalama(liste.map((d) => d.toplamNet))}
                    vurgulu
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

/** TYT ve AYT için ayrı iki tablo. */
export function DenemeTablolari({ alan, denemeler }: { alan: Alan; denemeler: AnalizDenemesi[] }) {
  return (
    <>
      <DenemeTablosu sinav="TYT" alan={alan} denemeler={denemeler} />
      <DenemeTablosu sinav="AYT" alan={alan} denemeler={denemeler} />
    </>
  );
}
