#!/usr/bin/env bash
# One-shot: unzip public/<name>.zip and convert its PNG frames to WebP at
# public/frames/<name>/001.webp … NNN.webp. Requires python3 + Pillow built
# with WebP support.
#
#   bash scripts/extract-frames.sh <name> <count>
#   e.g. bash scripts/extract-frames.sh left-right 91
#        bash scripts/extract-frames.sh transform 151
set -euo pipefail

NAME="${1:-left-right}"
COUNT="${2:-91}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="$ROOT/public/$NAME.zip"
OUT="$ROOT/public/frames/$NAME"
TMP="$ROOT/.frames-tmp"

[ -f "$ZIP" ] || { echo "missing $ZIP" >&2; exit 1; }
python3 -c "from PIL import features; assert features.check('webp')" 2>/dev/null \
  || { echo "python3 + Pillow with WebP support required" >&2; exit 1; }

rm -rf "$TMP"; mkdir -p "$TMP" "$OUT"
unzip -q -o "$ZIP" -d "$TMP"

python3 - "$TMP" "$OUT" "$COUNT" <<'PY'
import sys, pathlib
from PIL import Image
src, out = map(pathlib.Path, sys.argv[1:3])
count = int(sys.argv[3])
for i in range(1, count + 1):
    name = f"{i:03d}"
    img = Image.open(src / f"ezgif-frame-{name}.png").convert("RGB")
    img.save(out / f"{name}.webp", "WEBP", quality=82, method=6)
PY

rm -rf "$TMP"
echo "wrote $(ls "$OUT" | wc -l) frames to $OUT"
