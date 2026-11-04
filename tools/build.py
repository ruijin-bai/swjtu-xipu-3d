import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root/'src/index.html').read_text(encoding='utf-8')
three = (root/'vendor/three.min.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
data = (root/'data/campus.json').read_text(encoding='utf-8')
html = html.replace('/*@@GATES@@*/', (root/'src/parts/gates.js').read_text(encoding='utf-8'), 1)
import base64
sat = 'data:image/jpeg;base64,' + base64.b64encode((root/'data/sat/ground.jpg').read_bytes()).decode()
html = html.replace('/*@@THREE@@*/', three, 1).replace('/*@@SAT@@*/', sat, 1).replace('/*@@LC@@*/', 'data:image/webp;base64,' + base64.b64encode((root/'data/sat/landcover.webp').read_bytes()).decode(), 1).replace('/*@@SATO@@*/', 'data:image/jpeg;base64,' + base64.b64encode((root/'data/sat/outer.jpg').read_bytes()).decode(), 1).replace('/*@@DATA@@*/', data, 1)
out = root/'西南交大犀浦校区数字孪生.html'
out.write_text(html, encoding='utf-8')
print(out, round(out.stat().st_size/1024), 'KB')
