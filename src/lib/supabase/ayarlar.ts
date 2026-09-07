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

  return { url, anonKey };
}
