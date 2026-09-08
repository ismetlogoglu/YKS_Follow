import type { Metadata } from "next";
import { DenemeFormu } from "@/components/deneme-formu";
import { SilButonu } from "@/components/sil-butonu";
import { NetTrendGrafigi } from "@/components/grafikler";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  GeriBaglantisi,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { gerekliProfil, hedefNetler, type DenemeDers, type DenemeToplam } from "@/lib/db";
import { denemeOzeti, hedefKarsilastirma, netTrendi } from "@/lib/istatistik";
import { dersAdi, dersSirasi, netYaz, tarihYaz } from "@/lib/yks";
import { denemeSil } from "./actions";

export const metadata: Metadata = { title: "Denemeler" };

export default async function DenemeSayfasi() {
  const { supabase, user, profil } = await gerekliProfil({ adminiYonlendir: true });

  const [{ data: denemeVerisi }, hedefler] = await Promise.all([
    supabase
      .from("mock_exam_totals")
      .select("*")
      .eq("user_id", user.id)
      .order("tarih", { ascending: false })
      .limit(50),
    hedefNetler(user.id),
  ]);

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

  // Grafik ve hedef tablosu son 10 denemeye bakar; her sınav türü kendi içinde
  // sayılır ki çok TYT az AYT giren öğrencide AYT tarafı boş kalmasın.
  const sonOn = (["TYT", "AYT"] as const).flatMap((sinav) =>
    denemeler.filter((d) => d.sinav === sinav).slice(0, 10),
  );
  const trend = netTrendi(sonOn);
  const karsilastirma = hedefKarsilastirma(hedefler, sonOn, bolumler, 10);
  const ozet = (["TYT", "AYT"] as const).map((s) => denemeOzeti(denemeler, s, 10));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <GeriBaglantisi href="/panel">Ana ekran</GeriBaglantisi>
        <h1 className="mt-1 text-2xl font-semibold text-heading">Deneme sonucu</h1>
        <p className="mt-1 text-sm text-muted-ink">
          Sadece doğru ve yanlış sayısını gir; netler otomatik hesaplanır.
        </p>
      </div>

      <DenemeFormu alan={profil.alan!} />

      {denemeler.length > 0 && (
        <>
          <Card>
            <CardHeader
              title="Son 10 denemenin net grafiği"
              description="TYT düz çizgi, AYT kesikli çizgi"
            />
            <NetTrendGrafigi veri={trend} />
            <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
              {ozet.map((o) => (
                <div key={o.sinav} className="flex items-center gap-4 bg-surface px-4 py-3">
                  <Badge tone={o.sinav === "TYT" ? "tyt" : "ayt"}>{o.sinav}</Badge>
                  <span className="text-sm text-muted-ink">
                    Son 10 ortalaman{" "}
                    <span className="tabular font-semibold text-heading">
                      {netYaz(o.sonNOrtalama)}
                    </span>
                    {o.enIyi !== null && (
                      <>
                        {" "}
                        · en iyin{" "}
                        <span className="tabular font-semibold text-success">
                          {netYaz(o.enIyi)}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Hedeflerine ne kadar yakınsın?"
              description="Son 10 denemenin ders ortalaması, hedef netinle karşılaştırılıyor."
            />
            {karsilastirma.length === 0 ? (
              <EmptyState
                title="Hedef net tanımlı değil"
                description="Ayarlar sayfasından her ders için hedef netini belirleyebilirsin."
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Sınav</Th>
                    <Th>Ders</Th>
                    <Th className="text-right">Hedefin</Th>
                    <Th className="text-right">Son 10 ort.</Th>
                    <Th className="text-right">Fark</Th>
                    <Th>Durum</Th>
                  </tr>
                </thead>
                <tbody>
                  {karsilastirma.map((s) => (
                    <tr
                      key={`${s.sinav}-${s.ders}`}
                      className="transition-colors duration-200 hover:bg-canvas"
                    >
                      <Td>
                        <Badge tone={s.sinav === "TYT" ? "tyt" : "ayt"}>{s.sinav}</Badge>
                      </Td>
                      <Td className="font-medium text-heading">{dersAdi(s.ders)}</Td>
                      <Td className="tabular text-right">{netYaz(s.hedef)}</Td>
                      <Td className="tabular text-right">{netYaz(s.mevcut)}</Td>
                      <Td
                        className={`tabular text-right font-semibold ${
                          s.fark === null
                            ? "text-muted-ink"
                            : s.fark >= 0
                              ? "text-success"
                              : "text-danger"
                        }`}
                      >
                        {s.fark === null ? "—" : `${s.fark > 0 ? "+" : ""}${netYaz(s.fark)}`}
                      </Td>
                      <Td className="text-muted-ink">
                        {s.fark === null ? (
                          "Bu dersten deneme verisi yok"
                        ) : s.fark >= 0 ? (
                          <Badge tone="success">Hedefte</Badge>
                        ) : (
                          <Badge tone="warn">{netYaz(Math.abs(s.fark))} net eksik</Badge>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </>
      )}

      <Card>
        <CardHeader
          title="Deneme geçmişin"
          description={denemeler.length > 0 ? `${denemeler.length} deneme kayıtlı.` : undefined}
        />

        {denemeler.length === 0 ? (
          <EmptyState
            title="Henüz deneme yok"
            description="İlk denemeni kaydettiğinde ders bazlı netlerinle birlikte burada listelenir."
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
