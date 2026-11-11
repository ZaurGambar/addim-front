#!/usr/bin/env bash
# ADDIM → SmartUrban sinxronizasiyası (əl ilə: `npm run sync:smarturban`, avtomatik: .github/workflows/sync-smarturban.yml)
#   1) əlçatanlıq datası  → smarturban-be/src/SmartUrban.Api/SeedData/access_*.json
#   2) ADDIM embed build-i → smarturban-admin/public/addim  (base /addim/, 2GIS proxy ilə, açarsız)
# Repolar yanaşı olmalıdır (pedastrainized/addim-front, smarturban-be, smarturban-admin) və ya:
#   SMARTURBAN_BE=... SMARTURBAN_ADMIN=... SMARTURBAN_API=https://.../api scripts/sync_smarturban.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BE="${SMARTURBAN_BE:-../smarturban-be}"
ADMIN="${SMARTURBAN_ADMIN:-../smarturban-admin}"
API="${SMARTURBAN_API:-https://smartflow.runasp.net/api}"

[ -d "$BE/src/SmartUrban.Api" ] || { echo "smarturban-be tapılmadı: $BE"; exit 1; }
[ -d "$ADMIN/src" ] || { echo "smarturban-admin tapılmadı: $ADMIN"; exit 1; }

echo "1/2 Data ixracı → $BE"
python3 scripts/export_smarturban.py --out "$BE/src/SmartUrban.Api/SeedData"

echo "2/2 ADDIM build → $ADMIN/public/addim (2GIS proxy: $API)"
# 2GIS açarı build-ə düşmür: sorğular SmartUrban API-nin /2gis proxy-sinə gedir
VITE_2GIS_KEY= VITE_2GIS_PROXY="$API" VITE_ROUTING_API="$API" \
  npx vite build --base /addim/ --outDir "$ADMIN/public/addim" --emptyOutDir --logLevel warn

echo "Hazırdır. Dəyişikliklər:"
git -C "$BE" status --short -- src/SmartUrban.Api/SeedData | head -5 || true
git -C "$ADMIN" status --short -- public/addim | wc -l | xargs echo "  admin public/addim fayl:"
