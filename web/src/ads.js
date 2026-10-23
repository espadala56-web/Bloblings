// Ödüllü reklam katmanı.
// Şimdilik test modunda: reklam gösterilmiş gibi davranır.
// Yayına çıkmadan önce Adsgram entegrasyonu buraya eklenecek ve ödül sunucuda doğrulanacak.

export const ADS_LIVE = false;

export function showRewarded(placement) {
  return new Promise((resolve) => {
    // Test modu: kısa bir bekleme, sonra "izlendi".
    setTimeout(() => resolve({ ok: true, test: true, placement }), 600);
  });
}
