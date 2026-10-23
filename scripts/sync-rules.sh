#!/usr/bin/env sh
# Oyun kurallarını (web/src) sunucu fonksiyonuna kopyalar.
# Kurallarda değişiklik yaptıktan sonra çalıştır, sonra fonksiyonu yeniden yayınla.
set -e
cd "$(dirname "$0")/.."
mkdir -p supabase/functions/game/rules
for f in config.js store.js sync.js; do
  { echo "// OTOMATİK KOPYA: web/src/$f dosyasını düzenle, sonra scripts/sync-rules.sh çalıştır."; cat "web/src/$f"; } > "supabase/functions/game/rules/$f"
done
echo "Kurallar kopyalandı."
