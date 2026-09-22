/**
 * Supabase panelinde "Project URL" yerine "REST URL" (…supabase.co/rest/v1/)
 * kopyalanırsa istemci her isteği /rest/v1/auth/v1/… gibi yanlış bir yola gönderir
 * ve giriş dahil hiçbir şey çalışmaz. Adresin yalnızca kök kısmını kullanıyoruz.
 */
export function projeAdresi(url: string): string {
  return new URL(url).origin;
}

/**
 * Ortam değişkenleri eksikken Supabase istemcisi anlamsız bir hata fırlatıyor.
 * Bunun yerine ne yapılması gerektiğini söyleyen tek bir mesaj veriyoruz.
 */
export function supabaseAyarlari() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase ayarları eksik. Proje kökünde .env.local dosyası oluştur ve " +
        "NEXT_PUBLIC_SUPABASE_URL ile NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini gir. " +
        "Örnek için .env.example dosyasına bak.",
    );
  }

  return { url: projeAdresi(url), anonKey };
}
