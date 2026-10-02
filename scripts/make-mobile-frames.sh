#!/usr/bin/env bash
# One-shot: build the lightweight phone sequence from public/frames/t2.
# Keeps every 2nd frame, scales to 1600px wide and writes
# public/frames/t2-m/001.webp … 076.webp. Requires python3 + Pillow with WebP.
#
#   bash scripts/make-mobile-frames.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/frames/t2"
OUT="$ROOT/public/frames/t2-m"

[ -d "$SRC" ] || { echo "missing $SRC" >&2; exit 1; }
python3 -c "from PIL import features; assert features.check('webp')" 2>/dev/null \
  || { echo "python3 + Pillow with WebP support required" >&2; exit 1; }

rm -rf "$OUT"; mkdir -p "$OUT"
python3 - "$SRC" "$OUT" <<'PY'
import sys, pathlib
from PIL import Image
src, out = map(pathlib.Path, sys.argv[1:3])
WIDTH = 1600
n = 0
# 1, 3, 5 … 151 — frame 1 stays the shared rest pose, frame 151 the last.
for i in range(1, 152, 2):
    img = Image.open(src / f"{i:03d}.webp").convert("RGB")
    h = round(img.height * WIDTH / img.width)
    img = img.resize((WIDTH, h), Image.LANCZOS)
    n += 1
    img.save(out / f"{n:03d}.webp", "WEBP", quality=78, method=6)
PY
echo "wrote $(ls "$OUT" | wc -l) frames to $OUT"
