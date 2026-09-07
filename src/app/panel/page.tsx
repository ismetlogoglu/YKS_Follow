import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, PenLine } from "lucide-react";
import { gerekliProfil } from "@/lib/db";
import { bugun } from "@/lib/yks";

export const metadata: Metadata = { title: "Panel" };

const SECENEKLER = [
  {
    href: "/panel/soru" as const,
    Icon: PenLine,
    baslik: "Günlük çözülen soru sayısını gir",
    aciklama: "Ders, çözdüğün soru sayısı ve istersen doğru/yanlış.",
    ton: "birincil" as const,
  },
  {
    href: "/panel/deneme" as const,
    Icon: ClipboardList,
    baslik: "Deneme sonucu gir",
    aciklama: "Her ders için doğru ve yanlış; netler otomatik hesaplanır.",
    ton: "ikincil" as const,
  },
];

export default async function PanelSayfasi() {
  const { supabase, user, profil } = await gerekliProfil({ adminiYonlendir: true });

  // Tek amaç öğrenciye bugün kayıt girip girmediğini hatırlatmak.
  const bugunIso = bugun();
  const [{ count: soruSayisi }, { count: denemeSayisi }] = await Promise.all([
    supabase
      .from("study_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tarih", bugunIso),
    supabase
      .from("mock_exams")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tarih", bugunIso),
  ]);

  const ilkAd = (profil.ad_soyad ?? "").split(" ")[0];
  const bugunToplam = (soruSayisi ?? 0) + (denemeSayisi ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">
          {ilkAd ? `Merhaba ${ilkAd}` : "Merhaba"}
        </h1>
        <p className="mt-1 text-sm text-muted-ink">
          {bugunToplam === 0
            ? "Bugün henüz kayıt girmedin."
            : `Bugün ${bugunToplam} kayıt girdin.`}
        </p>
      </div>

      <div className="grid gap-4">
        {SECENEKLER.map(({ href, Icon, baslik, aciklama, ton }) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-center gap-4 rounded-[10px] border-2 px-5 py-6 transition-colors duration-200 ${
              ton === "birincil"
                ? "border-primary bg-primary text-on-primary hover:bg-primary-hover"
                : "border-accent bg-accent text-on-accent hover:brightness-95"
            }`}
          >
            <Icon className="h-8 w-8 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-lg leading-snug font-semibold">{baslik}</span>
              <span className="mt-0.5 block text-sm opacity-90">{aciklama}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
