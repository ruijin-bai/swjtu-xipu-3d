#!/bin/sh
# 一键构建：OSM + 覆盖规格 → campus.json → 卫星屋顶色 → 单文件 HTML
set -e
cd "$(dirname "$0")/.."
python3 tools/convert.py data/xipu.osm data/campus.json > /dev/null
python3 tools/sat_process.py
python3 tools/landcover.py
python3 -c "from PIL import Image;Image.open('data/sat/landcover.png').save('data/sat/landcover.webp','WEBP',quality=88,method=6)"
python3 tools/build.py
