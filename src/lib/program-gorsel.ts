import { GORSEL, GUN_RENGI, hucreRengi } from "./program-renk";
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
  const baslikYukseklik = 60;
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
  const SANS_K = '700 %dpx "Fira Sans", system-ui, -apple-system, sans-serif';
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

  // Gün başlıkları — ekrandaki gibi dolu, koyu bantlar
  const gridUst = ustAlan;
  for (let g = 0; g < G; g++) {
    const x = kenar + g * gunGenislik;
    c.fillStyle = g >= 5 ? GUN_RENGI.haftaSonu : GUN_RENGI.hafta;
    yuvarlak(x + 4, gridUst, gunGenislik - 8, baslikYukseklik - 12, 10);
    c.fill();
    yaz(
      GUNLER[g],
      x + gunGenislik / 2,
      gridUst + (baslikYukseklik - 12) / 2,
      f(SANS_K, 20),
      GUN_RENGI.yazi,
      "center",
    );
  }

  // Hücreler — yarı saydam zemin, çerçeve ve solda dolu şerit
  for (let s = 0; s < PROGRAM_SATIR; s++) {
    for (let g = 0; g < G; g++) {
      const x = kenar + g * gunGenislik + 4;
      const y = gridUst + baslikYukseklik + s * satirYukseklik;
      const gen = gunGenislik - 8;
      const yuk = satirYukseklik - 10;
      const ders = hucreler[hucreAnahtari(g, s)];
      const renk = hucreRengi(ders);

      c.fillStyle = renk.zemin;
      yuvarlak(x, y, gen, yuk, 10);
      c.fill();

      c.save();
      c.clip();
      c.fillStyle = renk.serit;
      c.fillRect(x, y, 5, yuk);
      c.restore();

      yuvarlak(x, y, gen, yuk, 10);
      c.strokeStyle = renk.cizgi;
      c.lineWidth = 1;
      c.setLineDash(renk.kesikli ? [5, 4] : []);
      c.stroke();
      c.setLineDash([]);

      const ad = ders ? programDersAdi(ders) : "Boş";
      const yazi = f(renk.kalin ? SANS_K : SANS, 15);
      const ikon = ders ? IKONLAR[ders] : undefined;
      let solX = x + 18;
      const ortaY = y + yuk / 2;

      if (ikon) {
        ikonCiz(c, ikon, solX, ortaY - 8, 16, renk.yazi);
        solX += 22;
      }

      // Uzun ders adlarını iki satıra böl (örn. "TYT Matematik")
      c.font = yazi;
      if (c.measureText(ad).width > x + gen - 12 - solX && ad.includes(" ")) {
        const bosluk = ad.lastIndexOf(" ");
        yaz(ad.slice(0, bosluk), solX, ortaY - 10, yazi, renk.yazi);
        yaz(ad.slice(bosluk + 1), solX, ortaY + 10, yazi, renk.yazi);
      } else {
        yaz(ad, solX, ortaY, yazi, renk.yazi);
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
 * Ekrandaki Target ve RotateCcw simgelerinin (lucide) çizim verisi, 24×24 ızgarada.
 * Resimde de aynı simgeler görünsün diye aynı yollar Path2D ile çiziliyor.
 */
const IKONLAR: Record<string, string[]> = {
  p_deneme: [
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    "M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0",
    "M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  ],
  p_tekrar: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
};

function ikonCiz(
  c: CanvasRenderingContext2D,
  yollar: string[],
  x: number,
  y: number,
  boy: number,
  renk: string,
) {
  c.save();
  c.translate(x, y);
  c.scale(boy / 24, boy / 24);
  c.strokeStyle = renk;
  c.lineWidth = 2;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const yol of yollar) c.stroke(new Path2D(yol));
  c.restore();
}

export type KaydetmeSonucu = "paylasildi" | "indirildi" | "iptal";

/**
 * Dokunmatik cihaz mı? Paylaşım penceresi yalnızca burada işe yarıyor.
 *
 * macOS'ta navigator.canShare dosya paylaşımını destekliyor ama açılan menüde
 * "Fotoğraflara Kaydet" / "Save to Files" YOK — bunlar iOS eklentileri.
 * Masaüstünde paylaşım penceresi açmak kullanıcıyı dosyayı kaydedemediği bir
 * menüde bırakıyor; oradaki doğru davranış doğrudan indirmek.
 */
function dokunmatikCihaz(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0;
}

/**
 * Görseli cihaza kaydettirir.
 * Telefon/tablette paylaşım penceresi açılır ("Fotoğraflara Kaydet" galeriye
 * eklemenin tek güvenilir yolu; iOS Safari'de <a download> galeriye koymaz).
 * Masaüstünde doğrudan indirilir.
 */
export async function programGorseliniKaydet(
  canvas: HTMLCanvasElement,
  dosyaAdi: string,
): Promise<KaydetmeSonucu> {
  const blob = await new Promise<Blob | null>((coz) => canvas.toBlob(coz, "image/png"));
  if (!blob) throw new Error("Görsel oluşturulamadı.");

  const dosya = new File([blob], dosyaAdi, { type: "image/png" });

  if (dokunmatikCihaz() && navigator.canShare?.({ files: [dosya] })) {
    try {
      await navigator.share({ files: [dosya], title: "Haftalık Program" });
      return "paylasildi";
    } catch (e) {
      // Kullanıcı pencereyi kapattıysa başarı mesajı göstermek yanıltıcı olur.
      if (e instanceof DOMException && e.name === "AbortError") return "iptal";
      // Paylaşım başka bir sebeple çöktüyse indirmeye düş.
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
