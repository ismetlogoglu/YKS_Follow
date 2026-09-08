import { GORSEL, hucreRengi } from "./program-renk";
import { GUNLER, PROGRAM_SATIR, hucreAnahtari, programDersAdi } from "./yks";

/**
 * Haftalık programı bir canvas'a çizip PNG üretir.
 *
 * html2canvas gibi bir bağımlılık yerine elle çizim: yapı sabit (7x3),
 * çıktı her cihazda birebir aynı oluyor ve ~400 KB paket eklenmiyor.
 * Ekrandaki tablo dar ekranda dikey diziliyor; görsel ise her zaman
 * yatay 7 sütun — paylaşılan resimde haftanın tamamı görünsün diye.
 */
export function programGorseliCiz(
  hucreler: Record<string, string>,
  ogrenciAdi: string,
): HTMLCanvasElement {
  const G = 7;
  const olcek = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);

  const kenar = 48;
  const gunGenislik = 176;
  const satirYukseklik = 76;
  const baslikYukseklik = 44;
  const ustAlan = 118;
  const altAlan = 58;

  const w = kenar * 2 + gunGenislik * G;
  const h = ustAlan + baslikYukseklik + satirYukseklik * PROGRAM_SATIR + altAlan;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * olcek);
  canvas.height = Math.round(h * olcek);
  const c = canvas.getContext("2d")!;
  c.scale(olcek, olcek);

  const yuvarlak = (x: number, y: number, gen: number, yuk: number, r: number) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + gen, y, x + gen, y + yuk, r);
    c.arcTo(x + gen, y + yuk, x, y + yuk, r);
    c.arcTo(x, y + yuk, x, y, r);
    c.arcTo(x, y, x + gen, y, r);
    c.closePath();
  };

  const yaz = (
    metin: string,
    x: number,
    y: number,
    font: string,
    renk: string,
    hiza: CanvasTextAlign = "left",
  ) => {
    c.font = font;
    c.fillStyle = renk;
    c.textAlign = hiza;
    c.textBaseline = "middle";
    c.fillText(metin, x, y);
  };

  const SANS = '600 %dpx "Fira Sans", system-ui, -apple-system, sans-serif';
  const SANS_N = '400 %dpx "Fira Sans", system-ui, -apple-system, sans-serif';
  const f = (sablon: string, boy: number) => sablon.replace("%d", String(boy));

  // Zemin
  c.fillStyle = GORSEL.zemin;
  c.fillRect(0, 0, w, h);

  // Başlık
  yaz("Haftalık Program", kenar, 46, f(SANS, 30), GORSEL.baslik);
  if (ogrenciAdi) yaz(ogrenciAdi, kenar, 78, f(SANS_N, 17), GORSEL.soluk);

  const bugun = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  yaz(bugun, w - kenar, 46, f(SANS_N, 15), GORSEL.soluk, "right");

  // Gün başlıkları
  const gridUst = ustAlan;
  for (let g = 0; g < G; g++) {
    const x = kenar + g * gunGenislik;
    c.fillStyle = g >= 5 ? GORSEL.haftaSonuZemin : GORSEL.gunZemin;
    yuvarlak(x + 3, gridUst, gunGenislik - 6, baslikYukseklik - 6, 8);
    c.fill();
    yaz(
      GUNLER[g],
      x + gunGenislik / 2,
      gridUst + (baslikYukseklik - 6) / 2,
      f(SANS, 15),
      g >= 5 ? GORSEL.soluk : GORSEL.baslik,
      "center",
    );
  }

  // Hücreler
  for (let s = 0; s < PROGRAM_SATIR; s++) {
    for (let g = 0; g < G; g++) {
      const x = kenar + g * gunGenislik;
      const y = gridUst + baslikYukseklik + s * satirYukseklik;
      const ders = hucreler[hucreAnahtari(g, s)];
      const renk = hucreRengi(ders);

      c.fillStyle = renk.zemin;
      yuvarlak(x + 3, y + 3, gunGenislik - 6, satirYukseklik - 8, 10);
      c.fill();
      c.strokeStyle = renk.cizgi;
      c.lineWidth = 1;
      c.stroke();

      const ad = ders ? programDersAdi(ders) : "—";
      const merkezX = x + gunGenislik / 2;
      const merkezY = y + (satirYukseklik - 8) / 2 + 3;

      // Uzun ders adlarını iki satıra böl (örn. "TYT Matematik")
      c.font = f(SANS, 15);
      if (c.measureText(ad).width > gunGenislik - 28 && ad.includes(" ")) {
        const bosluk = ad.lastIndexOf(" ");
        yaz(ad.slice(0, bosluk), merkezX, merkezY - 10, f(SANS, 15), renk.yazi, "center");
        yaz(ad.slice(bosluk + 1), merkezX, merkezY + 10, f(SANS, 15), renk.yazi, "center");
      } else {
        yaz(ad, merkezX, merkezY, f(SANS, ders ? 15 : 18), renk.yazi, "center");
      }
    }
  }

  // Alt bilgi
  const altY = h - altAlan / 2;
  c.strokeStyle = GORSEL.cizgi;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(kenar, h - altAlan);
  c.lineTo(w - kenar, h - altAlan);
  c.stroke();
  yaz("YKS Takip", kenar, altY, f(SANS, 14), GORSEL.baslik);
  yaz("yksfollow.com", w - kenar, altY, f(SANS_N, 13), GORSEL.soluk, "right");

  return canvas;
}

/**
 * Görseli cihaza kaydettirir.
 * Paylaşım sayfası varsa (telefonlar) önce o denenir — "Fotoğraflara Kaydet"
 * seçeneği galeriye kaydetmenin tek güvenilir yolu; iOS Safari'de <a download>
 * dosyayı galeriye koymaz.
 */
export async function programGorseliniKaydet(
  canvas: HTMLCanvasElement,
  dosyaAdi: string,
): Promise<"paylasildi" | "indirildi"> {
  const blob = await new Promise<Blob | null>((coz) => canvas.toBlob(coz, "image/png"));
  if (!blob) throw new Error("Görsel oluşturulamadı.");

  const dosya = new File([blob], dosyaAdi, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [dosya] })) {
    try {
      await navigator.share({ files: [dosya], title: "Haftalık Program" });
      return "paylasildi";
    } catch (e) {
      // Kullanıcı paylaşım sayfasını kapattıysa indirmeye düşme, sessizce çık.
      if (e instanceof DOMException && e.name === "AbortError") return "paylasildi";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "indirildi";
}
