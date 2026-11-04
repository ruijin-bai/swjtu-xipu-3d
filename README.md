# 西南交通大学犀浦校区 · 三维校园浏览（非官方）

双击 `西南交大犀浦校区数字孪生.html` 即可在浏览器打开（单文件、离线可用）。

## 操作
- **环绕**：拖动旋转 / 滚轮缩放 / 右键平移，点击楼看信息卡（层数、外观、依据与可信度）
- **漫游**：WASD + 鼠标（手机为摇杆），不穿墙、不下水、桥上可走；双击地面直接走过去
- 左侧导览点与搜索；底部日照时间、晴/阴、夏/秋、标签开关

## 构建
```bash
tools/make.sh        # OSM → campus.json → 逐楼规格 → 卫星屋顶色 → 地物分类 → 打包 HTML
```
首次在新环境需先下载卫星瓦片：`python3 tools/sat_fetch.py && python3 tools/sat_fetch.py outer`

| 文件 | 作用 |
|---|---|
| `tools/convert.py` | OSM XML → 本地米制坐标（x 东、z 南）；套用 `data/overrides/*.json` |
| `tools/sat_fetch.py` | 下载/拼接 Esri World Imagery（z18 校园、z16 外围） |
| `tools/sat_process.py` | 每栋楼屋顶色（轮廓内缩取中位）、地面贴图 |
| `tools/landcover.py` | 影像分类：草/树冠/铺装/沥青/土 → 权重图 + 树冠点位 |
| `tools/build.py` | 内联 three.js、数据、贴图 → 单文件 HTML |
| `src/index.html` | 渲染：程序化立面着色器、天空/环境反射、环绕+漫游、天气季节 |
| `src/parts/gates.js` | 南门（仿唐山老校门三拱门）、东门、图书馆柱廊 |
| `data/overrides/` | 逐楼外观规格（依据照片/航拍/卫星，含来源与可信度） |
| `data/refs/style_guide.json` | 整体风格指南（路面、铺装、树种、水色、街道家具、色调规律） |

## 数据口径
- 轮廓、楼名、道路、水系：© OpenStreetMap 贡献者（ODbL）
- 卫星影像：© Esri, Maxar, Earthstar Geographics
- 层数与外观：有规格文件的按公开照片/航拍/卫星斜视整理，其余按风格规律估算（页面上标注）
