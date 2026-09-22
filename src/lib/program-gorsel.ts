import { GORSEL, GUN_RENGI, hucreRengi } from "./program-renk";
import { GUNLER, PROGRAM_SATIR, hucreAnahtari, programDersAdi } from "./yks";

/**
 * Haftalık programı bir canvas'a çizip PNG üretir.
 *
 * html2canvas gibi bir bağımlılık yerine elle çizim: yapı sabit (7x3),
 * çıktı her cihazda birebir aynı oluyor ve ~400 KB paket eklenmiyor.
 *
 * İki yerleşim var:
 * - yatay: 7 gün yan yana (~3:1). Bilgisayar ekranında haftanın tamamı bir bakışta.
 * - dikey: günler alt alta, her günün 3 bloğu başlığının altında yan yana
 *   (~9:19,5, telefon ekranı oranı). Yatay görsel telefonda küçücük kalıyordu;
 *   dikey olan ekranı tam dolduruyor, kilit ekranı bile yapılabiliyor.
 */
export type GorselYonu = "yatay" | "dikey";

/** Dik tutulan telefon/tablette dikey, geri kalan her yerde yatay. */
export function uygunYon(): GorselYonu {
  return window.matchMedia("(orientation: portrait)").matches ? "dikey" : "yatay";
}

export function programGorseliCiz(
  hucreler: Record<string, string>,
  ogrenciAdi: string,
  yon: GorselYonu = "yatay",
): HTMLCanvasElement {
  return yon === "dikey" ? dikeyCiz(hucreler, ogrenciAdi) : yatayCiz(hucreler, ogrenciAdi);
}

function yatayCiz(hucreler: Record<string, string>, ogrenciAdi: string): HTMLCanvasElement {
  const kenar = 48;
  const gunGenislik = 176;
  const satirYukseklik = 76;
  const baslikYukseklik = 60;
  const ustAlan = 118;
  const altAlan = 58;

  const w = kenar * 2 + gunGenislik * GUNLER.length;
  const h = ustAlan + baslikYukseklik + satirYukseklik * PROGRAM_SATIR + altAlan;
  const { canvas, c } = tuval(w, h);

  ustBilgi(c, w, kenar, ogrenciAdi, { baslikY: 46, baslikBoy: 30, adY: 78, adBoy: 17, tarihY: 46, tarihBoy: 15 });

  for (let g = 0; g < GUNLER.length; g++) {
    const x = kenar + g * gunGenislik;
    gunBasligi(c, g, x + 4, ustAlan, gunGenislik - 8, baslikYukseklik - 12, 20);
    for (let s = 0; s < PROGRAM_SATIR; s++) {
      const y = ustAlan + baslikYukseklik + s * satirYukseklik;
      hucre(c, hucreler[hucreAnahtari(g, s)], x + 4, y, gunGenislik - 8, satirYukseklik - 10, {
        boy: 15,
        serit: 5,
        ic: 18,
        ikon: 16,
      });
    }
  }

  altBilgi(c, w, h, kenar, altAlan);
  return canvas;
}

function dikeyCiz(hucreler: Record<string, string>, ogrenciAdi: string): HTMLCanvasElement {
  const w = 420;
  const kenar = 22;
  const ustAlan = 96;
  const baslikYuk = 34;
  const hucreYuk = 54;
  const ara = 6;
  const gunArasi = 14;
  const altAlan = 50;

  const hucreGen = (w - kenar * 2 - ara * (PROGRAM_SATIR - 1)) / PROGRAM_SATIR;
  const gunYuk = baslikYuk + ara + hucreYuk;
  const izgaraYuk = GUNLER.length * gunYuk + (GUNLER.length - 1) * gunArasi;
  const h = ustAlan + izgaraYuk + 18 + altAlan;
  const { canvas, c } = tuval(w, h);

  ustBilgi(c, w, kenar, ogrenciAdi, { baslikY: 40, baslikBoy: 26, adY: 68, adBoy: 15, tarihY: 68, tarihBoy: 13 });

  for (let g = 0; g < GUNLER.length; g++) {
    const y = ustAlan + g * (gunYuk + gunArasi);
    gunBasligi(c, g, kenar, y, w - kenar * 2, baslikYuk, 16);
    for (let s = 0; s < PROGRAM_SATIR; s++) {
      const x = kenar + s * (hucreGen + ara);
      hucre(c, hucreler[hucreAnahtari(g, s)], x, y + baslikYuk + ara, hucreGen, hucreYuk, {
        boy: 14,
        serit: 4,
        ic: 13,
        ikon: 14,
      });
    }
  }

  altBilgi(c, w, h, kenar, altAlan);
  return canvas;
}

/* -------------------------------------------------------------------------- */
/*  Ortak çizim parçaları                                                     */
/* -------------------------------------------------------------------------- */

const yaziTipi = (agirlik: number, boy: number) =>
  `${agirlik} ${boy}px "Fira Sans", system-ui, -apple-system, sans-serif`;

function tuval(w: number, h: number) {
  const olcek = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * olcek);
  canvas.height = Math.round(h * olcek);
  const c = canvas.getContext("2d")!;
  c.scale(olcek, olcek);
  c.fillStyle = GORSEL.zemin;
  c.fillRect(0, 0, w, h);
  return { canvas, c };
}

function yuvarlak(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  gen: number,
  yuk: number,
  r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + gen, y, x + gen, y + yuk, r);
  c.arcTo(x + gen, y + yuk, x, y + yuk, r);
  c.arcTo(x, y + yuk, x, y, r);
  c.arcTo(x, y, x + gen, y, r);
  c.closePath();
}

function yaz(
  c: CanvasRenderingContext2D,
  metin: string,
  x: number,
  y: number,
  font: string,
  renk: string,
  hiza: CanvasTextAlign = "left",
) {
  c.font = font;
  c.fillStyle = renk;
  c.textAlign = hiza;
  c.textBaseline = "middle";
  c.fillText(metin, x, y);
}

function ustBilgi(
  c: CanvasRenderingContext2D,
  w: number,
  kenar: number,
  ogrenciAdi: string,
  o: { baslikY: number; baslikBoy: number; adY: number; adBoy: number; tarihY: number; tarihBoy: number },
) {
  yaz(c, "Haftalık Program", kenar, o.baslikY, yaziTipi(600, o.baslikBoy), GORSEL.baslik);
  if (ogrenciAdi) yaz(c, ogrenciAdi, kenar, o.adY, yaziTipi(400, o.adBoy), GORSEL.soluk);
  const bugun = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  yaz(c, bugun, w - kenar, o.tarihY, yaziTipi(400, o.tarihBoy), GORSEL.soluk, "right");
}

/** Ekrandaki gibi dolu, koyu bant. */
function gunBasligi(
  c: CanvasRenderingContext2D,
  gun: number,
  x: number,
  y: number,
  gen: number,
  yuk: number,
  boy: number,
) {
  c.fillStyle = gun >= 5 ? GUN_RENGI.haftaSonu : GUN_RENGI.hafta;
  yuvarlak(c, x, y, gen, yuk, 10);
  c.fill();
  yaz(c, GUNLER[gun], x + gen / 2, y + yuk / 2, yaziTipi(700, boy), GUN_RENGI.yazi, "center");
}

/** Yarı saydam zemin, çerçeve (Tekrar ve boşta kesikli), solda dolu şerit. */
function hucre(
  c: CanvasRenderingContext2D,
  ders: string | undefined,
  x: number,
  y: number,
  gen: number,
  yuk: number,
  o: { boy: number; serit: number; ic: number; ikon: number },
) {
  const renk = hucreRengi(ders);

  c.fillStyle = renk.zemin;
  yuvarlak(c, x, y, gen, yuk, 10);
  c.fill();

  c.save();
  c.clip();
  c.fillStyle = renk.serit;
  c.fillRect(x, y, o.serit, yuk);
  c.restore();

  yuvarlak(c, x, y, gen, yuk, 10);
  c.strokeStyle = renk.cizgi;
  c.lineWidth = 1;
  c.setLineDash(renk.kesikli ? [5, 4] : []);
  c.stroke();
  c.setLineDash([]);

  const ad = ders ? programDersAdi(ders) : "Boş";
  const font = yaziTipi(renk.kalin ? 700 : 600, o.boy);
  const ikon = ders ? IKONLAR[ders] : undefined;
  let solX = x + o.ic;
  const ortaY = y + yuk / 2;

  if (ikon) {
    ikonCiz(c, ikon, solX, ortaY - o.ikon / 2, o.ikon, renk.yazi);
    solX += o.ikon + 6;
  }

  // Sığmayan ders adını iki satıra böl (örn. "TYT Matematik")
  c.font = font;
  if (c.measureText(ad).width > x + gen - 8 - solX && ad.includes(" ")) {
    const bosluk = ad.lastIndexOf(" ");
    const kayma = Math.round(o.boy * 0.66);
    yaz(c, ad.slice(0, bosluk), solX, ortaY - kayma, font, renk.yazi);
    yaz(c, ad.slice(bosluk + 1), solX, ortaY + kayma, font, renk.yazi);
  } else {
    yaz(c, ad, solX, ortaY, font, renk.yazi);
  }
}

function altBilgi(c: CanvasRenderingContext2D, w: number, h: number, kenar: number, altAlan: number) {
  c.strokeStyle = GORSEL.cizgi;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(kenar, h - altAlan);
  c.lineTo(w - kenar, h - altAlan);
  c.stroke();
  const y = h - altAlan / 2;
  yaz(c, "YKS Takip", kenar, y, yaziTipi(600, 14), GORSEL.baslik);
  yaz(c, "yksfollow.com", w - kenar, y, yaziTipi(400, 13), GORSEL.soluk, "right");
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
