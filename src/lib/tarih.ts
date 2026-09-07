/**
 * Sunucu genelde UTC'de çalışır, öğrenci ise kendi saat diliminde.
 * UTC'ye göre "bugün" ile kıyaslamak, Türkiye'de gece yarısından sonra
 * girilen kaydı "gelecek tarih" sayıp reddederdi. Bu yüzden bir gün pay
 * bırakıyoruz: gerçek ileri tarihler yine engelleniyor.
 */
export function enGecTarih(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}
