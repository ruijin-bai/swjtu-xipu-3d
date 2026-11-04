"""卫星影像 → 地面贴图 + 每栋楼屋顶色 + 水体色"""
import json, math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
m = json.load(open('data/sat/mosaic.json')); d = json.load(open('data/campus.json'))
img = Image.open('data/sat/mosaic_full.jpg').convert('RGB')
A = np.asarray(img).astype(np.float32)
sx = m['w'] / (m['x1'] - m['x0']); sz = m['h'] / (m['z1'] - m['z0'])
def mask(poly, shrink=0):
    mk = Image.new('L', (m['w'], m['h']), 0)
    ImageDraw.Draw(mk).polygon([((x - m['x0']) * sx, (z - m['z0']) * sz) for x, z in poly], fill=255)
    if shrink: mk = mk.filter(ImageFilter.MinFilter(shrink * 2 + 1))
    return np.asarray(mk) > 0
def bbox_med(poly, shrink=3):
    xs = [p[0] for p in poly]; zs = [p[1] for p in poly]
    X0 = max(0, int((min(xs) - m['x0']) * sx) - 2); X1 = min(m['w'], int((max(xs) - m['x0']) * sx) + 3)
    Z0 = max(0, int((min(zs) - m['z0']) * sz) - 2); Z1 = min(m['h'], int((max(zs) - m['z0']) * sz) + 3)
    if X1 <= X0 or Z1 <= Z0: return None
    mk = Image.new('L', (X1 - X0, Z1 - Z0), 0)
    ImageDraw.Draw(mk).polygon([((x - m['x0']) * sx - X0, (z - m['z0']) * sz - Z0) for x, z in poly], fill=255)
    if shrink: mk = mk.filter(ImageFilter.MinFilter(shrink * 2 + 1))
    k = np.asarray(mk) > 0
    px = A[Z0:Z1, X0:X1][k]
    if len(px) < 20: return None
    # 去掉最暗 25%（阴影）与最亮 5%（反光），取中位
    lum = px.mean(1); lo, hi = np.percentile(lum, [25, 95]); px = px[(lum >= lo) & (lum <= hi)]
    return np.median(px, 0)
hexc = lambda c: '#%02x%02x%02x' % tuple(int(max(0, min(255, v))) for v in c)
n = 0
for b in d['buildings']:
    c = bbox_med(b['p'], 3 if b['area'] > 300 else 1)
    if c is not None: b['roofSat'] = hexc(c); n += 1
wc = [bbox_med(a['p'], 4) for a in d['areas'] if a['k'] == 'water' and len(a['p']) > 2]
wc = [c for c in wc if c is not None]
d['meta']['waterSat'] = hexc(np.median(np.array(wc), 0)) if wc else None
for k in ('grass', 'pitch', 'wood', 'parking'):
    cs = [bbox_med(a['p'], 3) for a in d['areas'] if a['k'] == k and len(a['p']) > 2]
    cs = [c for c in cs if c is not None]
    if cs: d['meta'][k + 'Sat'] = hexc(np.median(np.array(cs), 0))
d['meta']['sat'] = {k: m[k] for k in ('x0', 'x1', 'z0', 'z1')}
d['meta']['satOuter'] = json.load(open('data/sat/outer.json'))
d['meta']['satCredit'] = '影像 © Esri, Maxar, Earthstar Geographics'
json.dump(d, open('data/campus.json', 'w'), ensure_ascii=False, separators=(',', ':'))
# 地面贴图：4096 正方形
g = img.resize((4096, 4096), Image.LANCZOS)
g.save('data/sat/ground.jpg', quality=82, optimize=True, progressive=True)
print('roofs', n, 'water', d['meta']['waterSat'], {k: d['meta'].get(k + 'Sat') for k in ('grass', 'pitch', 'wood', 'parking')})
