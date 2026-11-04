"""OSM XML -> campus.json（本地米制坐标，原点为校园中心）"""
import xml.etree.ElementTree as ET, json, math, sys, re
src, dst = sys.argv[1], sys.argv[2]
root = ET.parse(src).getroot()
nodes = {n.get('id'): (float(n.get('lat')), float(n.get('lon'))) for n in root.findall('node')}
ways = {}
for w in root.findall('way'):
    ways[w.get('id')] = ([nd.get('ref') for nd in w.findall('nd')], {t.get('k'): t.get('v') for t in w.findall('tag')})
rels = []
for r in root.findall('relation'):
    tags = {t.get('k'): t.get('v') for t in r.findall('tag')}
    members = [(m.get('ref'), m.get('role')) for m in r.findall('member') if m.get('type') == 'way']
    rels.append((r.get('id'), tags, members))

CAMPUS = '207566638'
LAT0, LON0 = 30.76606, 103.98448
KX = 111320 * math.cos(math.radians(LAT0)); KY = 110540
def xy(nid):
    la, lo = nodes[nid]; return [round((lo - LON0) * KX, 1), round(-(la - LAT0) * KY, 1)]  # x 东, z 南
def ring(refs):
    pts = [xy(r) for r in refs if r in nodes]
    if len(pts) > 1 and pts[0] == pts[-1]: pts = pts[:-1]
    return pts
def area(p):
    return abs(sum(p[i][0]*p[i-1][1]-p[i-1][0]*p[i][1] for i in range(len(p))))/2
def centroid(p):
    return [sum(q[0] for q in p)/len(p), sum(q[1] for q in p)/len(p)]
def inside(pt, poly):
    x, y = pt; c = False; j = len(poly)-1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj-xi)*(y-yi)/(yj-yi+1e-12)+xi: c = not c
        j = i
    return c

boundary = ring(ways[CAMPUS][0])

def classify(t, name):
    b = t.get('building', ''); n = name or ''
    if '图书馆' in n: return 'library'
    if '食堂' in n or '美食' in n: return 'canteen'
    if '斋' in n or 'dormitory' in b or b == 'apartments': return 'dorm'
    if re.search('体育|游泳|健美|羽毛球|乒乓|篮球|网球', n) or b == 'sports_hall': return 'sports'
    if '教学楼' in n or b in ('school',) : return 'teaching'
    if re.search('实验|中心|风洞|磁浮|工程训练', n): return 'lab'
    if '馆' in n or b in ('university', 'college'): return 'teaching'
    if '医院' in n or b == 'hospital': return 'hospital'
    if '服务区' in n or b in ('retail', 'commercial'): return 'service'
    if re.search('后勤|保卫|行政|办公', n) or b == 'office': return 'admin'
    if b in ('residential', 'house'): return 'residential'
    return 'other'

LEVELS = {'dorm': 6, 'teaching': 5, 'library': 7, 'canteen': 3, 'sports': 3, 'lab': 4,
          'hospital': 4, 'service': 2, 'admin': 4, 'residential': 6, 'other': 3}
FLOOR_H = {'sports': 6.0, 'library': 4.2, 'teaching': 4.0, 'lab': 4.5}
buildings = []
def add_building(oid, outer, t, holes=()):
    if len(outer) < 3 or area(outer) < 12: return
    name = t.get('name')
    cat = classify(t, name)
    c = centroid(outer)
    lv = t.get('building:levels'); est = True
    if lv and re.match(r'^\d+', lv): lv = int(re.match(r'^\d+', lv).group()); est = False
    else:
        lv = LEVELS[cat]
        a = area(outer)
        if cat == 'other' and a < 150: lv = 1
        elif cat == 'other' and a > 2500: lv = 4
    h = float(t['height']) if t.get('height', '').replace('.', '').isdigit() else round(lv * FLOOR_H.get(cat, 3.3), 1)
    if cat == 'sports' and est: h = 18.0
    buildings.append({'id': oid, 'name': name, 'cat': cat, 'levels': lv, 'h': h, 'est': est,
                      'in': inside(c, boundary), 'area': round(area(outer)), 'c': [round(c[0], 1), round(c[1], 1)],
                      'p': outer, 'holes': [list(hh) for hh in holes]})

AREA_KEYS = {
    ('natural', 'water'): 'water', ('water', None): 'water', ('leisure', 'pitch'): 'pitch', ('leisure', 'track'): 'track',
    ('leisure', 'stadium'): 'stadium', ('landuse', 'grass'): 'grass', ('natural', 'grassland'): 'grass',
    ('leisure', 'park'): 'grass', ('leisure', 'garden'): 'grass', ('natural', 'scrub'): 'scrub', ('natural', 'wood'): 'wood',
    ('landuse', 'forest'): 'wood', ('amenity', 'parking'): 'parking', ('leisure', 'swimming_pool'): 'water',
}
def area_kind(t):
    for (k, v), kind in AREA_KEYS.items():
        if k in t and (v is None or t[k] == v): return kind
    return None
areas, roads, rows = [], [], []
bridges = []
ROAD_W = {'secondary': 14, 'tertiary': 10, 'tertiary_link': 8, 'unclassified': 7, 'residential': 7, 'living_street': 6,
          'service': 5, 'pedestrian': 6, 'cycleway': 3, 'footway': 2.2, 'path': 2, 'steps': 2.5, 'track': 3}
for wid, (refs, t) in ways.items():
    if wid == CAMPUS: continue
    closed = len(refs) > 3 and refs[0] == refs[-1]
    if 'building' in t and closed:
        add_building('w' + wid, ring(refs), t); continue
    hw = t.get('highway')
    if hw and t.get('bridge') and t.get('bridge') != 'no':
        bridges.append({'t': hw, 'w': ROAD_W.get(hw, 3), 'name': t.get('name'), 'p': [xy(r) for r in refs if r in nodes]})
    if hw in ROAD_W and t.get('area') != 'yes':
        pts = [xy(r) for r in refs if r in nodes]
        if len(pts) > 1: roads.append({'t': hw, 'w': ROAD_W[hw], 'name': t.get('name'), 'p': pts})
        continue
    if t.get('natural') == 'tree_row':
        rows.append([xy(r) for r in refs if r in nodes]); continue
    kind = area_kind(t)
    if kind and closed:
        if kind == 'track' and t.get('leisure') == 'track' and not closed: continue
        areas.append({'k': kind, 'name': t.get('name'), 'sport': t.get('sport'), 'p': ring(refs)})
    elif t.get('waterway') in ('river', 'stream', 'canal', 'ditch', 'drain'):
        roads.append({'t': 'waterway', 'w': 6 if t['waterway'] in ('river', 'canal') else 2.5, 'name': t.get('name'), 'p': [xy(r) for r in refs if r in nodes]})
# multipolygon relations
for rid, t, members in rels:
    if t.get('type') != 'multipolygon': continue
    outers = [ring(ways[m][0]) for m, role in members if role == 'outer' and m in ways and ways[m][0][0] == ways[m][0][-1]]
    inners = [ring(ways[m][0]) for m, role in members if role == 'inner' and m in ways and ways[m][0][0] == ways[m][0][-1]]
    for o in outers:
        if 'building' in t: add_building('r' + rid, o, t, inners)
        elif area_kind(t): areas.append({'k': area_kind(t), 'name': t.get('name'), 'p': o, 'holes': inners})

# named POIs (nodes) for labels
pois = []
for n in root.findall('node'):
    t = {x.get('k'): x.get('v') for x in n.findall('tag')}
    if 'name' in t and (t.get('amenity') or t.get('shop') or t.get('tourism') or t.get('leisure')):
        pois.append({'name': t['name'], 'k': t.get('amenity') or t.get('shop') or t.get('tourism') or t.get('leisure'), 'c': xy(n.get('id'))})

# ---------- 参考照片得出的逐楼覆盖 ----------
import glob, os
OVR = {}
gates = []
for f in sorted(glob.glob(os.path.join(os.path.dirname(dst), 'overrides', '*.json'))):
    o = json.load(open(f, encoding='utf-8'))
    if os.path.basename(f).startswith('gate_'): gates.append(o); continue
    OVR[o['osm_id']] = o
WIN = {'方窗': 0, '竖': 1, '条窗': 1, '带形': 2, '横': 2, '幕墙': 3, '玻璃': 3}
def win_style(txt):
    for k, v in WIN.items():
        if k in (txt or ''): return v
    return 0
for b in buildings:
    o = OVR.get(b['id'])
    if not o: continue
    if o.get('levels'): b['levels'] = int(o['levels'])
    if o.get('height_m'): b['h'] = float(o['height_m'])
    elif o.get('levels'): b['h'] = round(b['levels'] * 3.9, 1)
    b['est'] = False
    b['src'] = o.get('levels_source') or ''
    fc = o.get('facade') or {}; rf = o.get('roof') or {}
    b['style'] = {'main': fc.get('main_color'), 'sec': fc.get('secondary_color'), 'win': o.get('win_type', win_style(fc.get('window_style', ''))),
                  'roof': rf.get('color'), 'material': fc.get('material'), 'roofType': rf.get('type'),
                  'mat': 1 if '砖' in (fc.get('material') or '') else (2 if any(k in (fc.get('material') or '') for k in ('金属', '铝', '幕墙', '玻璃')) else 0)}
    parts = []
    for pt in o.get('parts') or []:
        if pt.get('poly') and len(pt['poly']) >= 3:
            hh = pt.get('height_m') or (pt.get('levels') or b['levels']) * 3.9
            parts.append({'p': [[round(x, 1), round(z, 1)] for x, z in pt['poly']], 'h': float(hh), 'levels': pt.get('levels'), 'desc': pt.get('desc')})
    if parts:
        b['parts'] = parts
        b['h'] = max(pp['h'] for pp in parts); b['levels'] = max((pp['levels'] or 0) for pp in parts) or b['levels']
    b['features'] = o.get('features') or []
    if o.get('colonnade'): b['colonnade'] = o['colonnade']
    b['conf'] = o.get('confidence'); b['sources'] = o.get('sources') or []
gate_out = []
for g in gates:
    pos = g.get('position') or {}
    c = pos.get('local_xz') or pos.get('center_local_xz')
    if not c and g.get('lat'): c = [round((g['lon'] - LON0) * KX, 1), round(-(g['lat'] - LAT0) * KY, 1)]
    if not c: continue
    ori = g.get('orientation') or {}
    gate_out.append({'name': g.get('name'), 'c': c, 'bearing': ori.get('front_faces_bearing_deg', 0), 'form': g.get('form', ''),
                     'w': g.get('width_m') or 22, 'h': g.get('height_m') or 14, 'd': g.get('depth_m') or 4,
                     'color': (g.get('facade') or {}).get('main_color'), 'color2': (g.get('facade') or {}).get('secondary_color'),
                     'roof': (g.get('roof') or {}).get('color'), 'text': g.get('text') or {}, 'replica': g.get('is_tangshan_replica', False)})
# 虹桥：X桥南侧三跨并排的自行车桥（用户指认 + 卫星影像核实：每跨有交叉红色拱肋），OSM 未命名
for br in bridges:
    p_ = br['p']; cx = sum(q[0] for q in p_) / len(p_); cz = sum(q[1] for q in p_) / len(p_)
    if br['t'] == 'cycleway' and not br.get('name') and math.hypot(cx - 37, cz - 142) < 30: br['name'] = '虹桥'; br['group'] = 'hongqiao'
print('overrides applied', len(OVR), 'gates', len(gate_out))

out = {'meta': {'name': '西南交通大学犀浦校区', 'origin': [LAT0, LON0], 'source': '© OpenStreetMap contributors (ODbL)',
                'fetched': '2026-11-04'}, 'boundary': boundary, 'buildings': buildings, 'areas': areas, 'roads': roads,
       'treeRows': rows, 'pois': pois, 'gates': gate_out, 'bridges': bridges}
json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print('buildings', len(buildings), 'inside', sum(b['in'] for b in buildings), Counter(b['cat'] for b in buildings if b['in']))
print('areas', Counter(a['k'] for a in areas), 'roads', len(roads), 'pois', len(pois), 'treeRows', len(rows))
xs = [p[0] for p in boundary]; zs = [p[1] for p in boundary]
print('boundary extent m', min(xs), max(xs), min(zs), max(zs))
