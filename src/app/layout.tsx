import type { Metadata, Viewport } from "next";
import { Fira_Sans } from "next/font/google";
import { SayiKorumasi } from "@/components/sayi-korumasi";
import "./globals.css";

// Yalnızca gerçekten kullanılan ağırlıklar indirilir. 300 hiçbir yerde yok,
// Fira Code de tek bir satır için tüm aileyi indiriyordu — sistem monosu yeterli.
const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE = "https://www.yksfollow.com";
const ACIKLAMA =
  "Günlük çözdüğün soruyu ve deneme netlerini kaydet, hedeflerine ne kadar yaklaştığını gör.";

export const metadata: Metadata = {
  // Paylaşım görselleri ve kanonik adresler bu adrese göre çözülür.
  metadataBase: new URL(SITE),
  title: {
    default: "YKS Takip",
    template: "%s · YKS Takip",
  },
  description: ACIKLAMA,
  applicationName: "YKS Takip",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE,
    siteName: "YKS Takip",
    title: "YKS Takip",
    description: ACIKLAMA,
  },
  twitter: { card: "summary", title: "YKS Takip", description: ACIKLAMA },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale ayarlanmıyor: kullanıcının yakınlaştırmasını engellemek erişilebilirlik ihlali.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${firaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SayiKorumasi />
        {children}
      </body>
    </html>
  );
}
