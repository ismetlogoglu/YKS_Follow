import Image from "next/image";
import { cn } from "./ui";

/**
 * Marka işareti. Kaynak PNG şeffaf zeminli ve kırpılmış; açık zeminli
 * başlıklarda kullanılıyor. priority: her sayfanın başlığında görünüyor,
 * geç yüklenmesi logo yerinin boş kalmasına yol açardı.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={64}
      height={64}
      priority
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo className="h-8 w-8" />
      <span className="text-lg font-semibold tracking-tight text-heading">YKS Takip</span>
    </span>
  );
}
