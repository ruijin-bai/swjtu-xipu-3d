"""下载 Esri World Imagery 瓦片并拼接成与本地坐标对齐的地面贴图"""
import math, os, subprocess, json, sys
OUTER = len(sys.argv) > 1 and sys.argv[1] == 'outer'
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
Z = 16 if OUTER else 18
LAT0, LON0 = 30.76606, 103.98448
KX = 111320 * math.cos(math.radians(LAT0)); KY = 110540
X0, X1, Z0, Z1 = (-4200, 4000, -4200, 4200) if OUTER else (-1250, 1100, -1250, 1200)
lon_min, lon_max = LON0 + X0 / KX, LON0 + X1 / KX
lat_max, lat_min = LAT0 - Z0 / KY, LAT0 - Z1 / KY
def tile(lat, lon):
    n = 2 ** Z; x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y
tx0, ty0 = tile(lat_max, lon_min); tx1, ty1 = tile(lat_min, lon_max)
TX = range(int(tx0), int(tx1) + 1); TY = range(int(ty0), int(ty1) + 1)
d = 'data/sat/tiles'
def get(t):
    x, y = t; f = f'{d}/{Z}_{x}_{y}.jpg'
    if not os.path.exists(f) or os.path.getsize(f) < 1000:
        subprocess.run(['curl', '-sL', '-m', '30', '-A', 'Mozilla/5.0', '-o', f, f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{y}/{x}'])
    return f
jobs = [(x, y) for x in TX for y in TY]
print('tiles', len(jobs))
with ThreadPoolExecutor(8) as ex: files = list(ex.map(get, jobs))
W = len(TX) * 256; H = len(TY) * 256
img = Image.new('RGB', (W, H))
for (x, y), f in zip(jobs, files):
    try: img.paste(Image.open(f).convert('RGB'), ((x - TX[0]) * 256, (y - TY[0]) * 256))
    except Exception as e: print('bad', f, e)
# 裁剪到精确范围（墨卡托像素 → 近似线性，2km 范围误差可忽略）
cx0 = (tx0 - TX[0]) * 256; cy0 = (ty0 - TY[0]) * 256; cx1 = (tx1 - TX[0]) * 256; cy1 = (ty1 - TY[0]) * 256
crop = img.crop((round(cx0), round(cy0), round(cx1), round(cy1)))
print('mosaic', crop.size, 'm/px', (X1 - X0) / crop.size[0])
if OUTER:
    crop.resize((2048, 2048), Image.LANCZOS).save('data/sat/outer.jpg', quality=78, optimize=True, progressive=True)
    json.dump({'x0': X0, 'x1': X1, 'z0': Z0, 'z1': Z1}, open('data/sat/outer.json', 'w'))
else:
    crop.save('data/sat/mosaic_full.jpg', quality=92)
    json.dump({'x0': X0, 'x1': X1, 'z0': Z0, 'z1': Z1, 'w': crop.size[0], 'h': crop.size[1], 'source': 'Esri World Imagery', 'zoom': Z}, open('data/sat/mosaic.json', 'w'))
