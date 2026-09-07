import type { Metadata } from "next";
import { DenemeFormu } from "@/components/deneme-formu";
import { SilButonu } from "@/components/sil-butonu";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { gerekliProfil, type DenemeDers, type DenemeToplam } from "@/lib/db";
import { dersAdi, dersSirasi, netYaz, tarihYaz } from "@/lib/yks";
import { denemeSil } from "./actions";

export const metadata: Metadata = { title: "Denemeler" };

export default async function DenemeSayfasi() {
  const { supabase, user, profil } = await gerekliProfil();

  const { data: denemeVerisi } = await supabase
    .from("mock_exam_totals")
    .select("*")
    .eq("user_id", user.id)
    .order("tarih", { ascending: false })
    .limit(50);

  const denemeler = (denemeVerisi ?? []) as DenemeToplam[];

  const { data: bolumVerisi } = denemeler.length
    ? await supabase
        .from("mock_exam_sections")
        .select("*")
        .in(
          "mock_exam_id",
          denemeler.map((d) => d.id),
        )
    : { data: [] };

  const bolumler = (bolumVerisi ?? []) as DenemeDers[];
  const bolumHaritasi = new Map<string, DenemeDers[]>();
  for (const b of bolumler) {
    const mevcut = bolumHaritasi.get(b.mock_exam_id);
    if (mevcut) mevcut.push(b);
    else bolumHaritasi.set(b.mock_exam_id, [b]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Denemeler</h1>
        <p className="mt-1 text-sm text-muted-ink">
          Her denemenin ders bazlı netleri ve toplam neti burada birikiyor.
        </p>
      </div>

      <DenemeFormu alan={profil.alan!} />

      <Card>
        <CardHeader
          title="Deneme geçmişin"
          description={denemeler.length > 0 ? `${denemeler.length} deneme kayıtlı.` : undefined}
        />

        {denemeler.length === 0 ? (
          <EmptyState
            title="Henüz deneme yok"
            description="İlk denemeni kaydettiğinde net trendi grafiği Gelişim sekmesinde oluşmaya başlar."
          />
        ) : (
          <ul className="divide-y divide-line">
            {denemeler.map((d) => {
              const dersSatirlari = (bolumHaritasi.get(d.id) ?? [])
                .filter((b) => b.dogru > 0 || b.yanlis > 0)
                .sort((a, b) => dersSirasi(a.ders) - dersSirasi(b.ders));

              return (
                <li key={d.id} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={d.sinav === "TYT" ? "tyt" : "ayt"}>{d.sinav}</Badge>
                        <span className="font-medium text-heading">{d.ad}</span>
                        {d.yayin && (
                          <span className="text-sm text-muted-ink">· {d.yayin}</span>
                        )}
                      </div>
                      <p className="tabular mt-0.5 text-sm text-muted-ink">
                        {tarihYaz(d.tarih)} · {d.toplam_dogru} doğru · {d.toplam_yanlis} yanlış ·{" "}
                        {d.toplam_bos} boş
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-ink">Toplam net</p>
                        <p className="tabular text-xl leading-tight font-semibold text-accent">
                          {netYaz(Number(d.toplam_net))}
                        </p>
                      </div>
                      <SilButonu
                        action={denemeSil}
                        id={d.id}
                        etiket="Denemeyi sil"
                        soru={`"${d.ad}" denemesini silmek istediğine emin misin? Bu işlem geri alınamaz.`}
                      />
                    </div>
                  </div>

                  {dersSatirlari.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {dersSatirlari.map((b) => (
                        <span
                          key={b.id}
                          className="tabular rounded border border-line bg-canvas px-2 py-1 text-xs text-muted-ink"
                        >
                          {dersAdi(b.ders)}{" "}
                          <span className="font-semibold text-heading">
                            {netYaz(Number(b.net))}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {d.not_metni && (
                    <p className="mt-2 border-l-2 border-line-strong pl-3 text-sm text-muted-ink">
                      {d.not_metni}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
