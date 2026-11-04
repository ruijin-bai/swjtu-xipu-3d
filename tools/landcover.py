"""卫星影像 → 地物分类权重图（草/铺装/沥青/土，余量保留影像本色）+ 树冠点位"""
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
m = json.load(open('data/sat/mosaic.json')); d = json.load(open('data/campus.json'))
img = Image.open('data/sat/mosaic_full.jpg').convert('RGB')
W0, H0 = img.size
A = np.asarray(img).astype(np.float32)
R, G, B = A[..., 0], A[..., 1], A[..., 2]
lum = .299 * R + .587 * G + .114 * B
mx = A.max(-1); mn = A.min(-1); sat = (mx - mn) / (mx + 1)
exg = 2 * G - R - B
# 局部纹理（树冠粗糙、草坪平滑）
L = Image.fromarray(lum.astype(np.uint8))
blur = np.asarray(L.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
var = np.asarray(Image.fromarray(np.clip(np.abs(lum - blur) * 4, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 4
S_ = R + G + B + 1; gch = G / S_; rch = R / S_
veg = (gch > .366) | (exg > 24)
TV = float(np.percentile(var[veg], 55))       # 植被中纹理较粗的一部分判为树冠
tree = veg & ((var > TV) | (lum < 60))
grass = veg & ~tree
nonveg = ~veg
soil = nonveg & (rch > .372) & (lum > 80)
asphalt = nonveg & ~soil & (lum < 100)
paving = nonveg & ~soil & (lum >= 100)
# 建筑与水体不参与（用 OSM 遮罩）
sx = W0 / (m['x1'] - m['x0']); sz = H0 / (m['z1'] - m['z0'])
mask = Image.new('L', (W0, H0), 0); dr = ImageDraw.Draw(mask)
for b in d['buildings']: dr.polygon([((x - m['x0']) * sx, (z - m['z0']) * sz) for x, z in b['p']], fill=1)
wmask = Image.new('L', (W0, H0), 0); dw = ImageDraw.Draw(wmask)
for a in d['areas']:
    if a['k'] == 'water' and len(a['p']) > 2: dw.polygon([((x - m['x0']) * sx, (z - m['z0']) * sz) for x, z in a['p']], fill=1)
bm = np.asarray(mask) > 0; wm = np.asarray(wmask) > 0
# 树下画草；建筑脚下按周边主类（用模糊后的概率决定）
classes = [grass | tree, paving, asphalt, soil]
OUT = 2048
def prob(c, r=3.6):
    im = Image.fromarray((c * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im.resize((OUT, OUT), Image.BILINEAR)).astype(np.float32) / 255
P = np.stack([prob(c) for c in classes], -1)
s = P.sum(-1, keepdims=True)
keep = np.clip(1 - s, 0, 1)                      # 未归类（彩色球场等）保留影像
# 适度锐化：让主类占优，过渡带仍平滑
Pn = P / np.maximum(s, 1e-3)
Pn = Pn ** 2.3; Pn = Pn / np.maximum(Pn.sum(-1, keepdims=True), 1e-3)
Wt = Pn * (1 - keep)
rgba = np.clip(Wt * 255, 0, 255).astype(np.uint8)
rgba = (np.round(rgba / 17) * 17).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save('data/sat/landcover.png', optimize=True)
# 树冠点位：6m 网格抖动采样
rng = np.random.default_rng(7)
pts = []
step = 7.0
xs = np.arange(m['x0'] + 3, m['x1'] - 3, step); zs = np.arange(m['z0'] + 3, m['z1'] - 3, step)
for z in zs:
    for x in xs:
        jx, jz = x + rng.uniform(-2.5, 2.5), z + rng.uniform(-2.5, 2.5)
        px, pz = int((jx - m['x0']) * sx), int((jz - m['z0']) * sz)
        if 0 <= px < W0 and 0 <= pz < H0:
            win = tree[max(0, pz - 3):pz + 4, max(0, px - 3):px + 4]
            if win.mean() > .8 and not bm[pz, px] and not wm[pz, px]:
                pts.append([round(jx, 1), round(jz, 1), round(float(lum[pz, px]) / 255, 2)])
rng.shuffle(pts); d['canopy'] = pts[:9000]
d['meta']['landcover'] = True
json.dump(d, open('data/campus.json', 'w'), ensure_ascii=False, separators=(',', ':'))
frac = [float(c.mean()) for c in (grass, tree, paving, asphalt, soil)]
print('landcover saved; frac grass/tree/pave/asph/soil', [round(f, 3) for f in frac], 'canopy trees', len(pts))
# 预览
prev = np.zeros((OUT, OUT, 3), np.uint8)
cols = np.array([[110, 160, 70], [200, 195, 185], [80, 82, 86], [170, 140, 100]], np.float32)
prev = (Wt @ cols + keep * 255).clip(0, 255).astype(np.uint8)
Image.fromarray(prev).resize((900, 900)).save('/tmp/claude-0/-home-user/38ead516-2ce7-5f72-a826-033acbdbe385/scratchpad/lc.jpg', quality=85)
