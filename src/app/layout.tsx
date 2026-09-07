import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import { SayiKorumasi } from "@/components/sayi-korumasi";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YKS Takip",
    template: "%s · YKS Takip",
  },
  description:
    "Günlük soru çözümünü ve deneme netlerini kaydet, hedeflerine ne kadar yaklaştığını gör.",
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
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SayiKorumasi />
        {children}
      </body>
    </html>
  );
}
