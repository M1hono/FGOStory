# Atlas Academy 数据源

> API 接口、资源 URL、角色渲染原理

---

## 一、API 概览

### 基础 URL

```
https://api.atlasacademy.io
https://static.atlasacademy.io
```

### 常用接口

| 接口 | 描述 |
|------|------|
| `/export/{region}/nice_war.json` | 所有战争/章节 |
| `/export/{region}/nice_servant_lore.json` | 从者详情 (含幕间) |
| `/nice/{region}/quest/{id}` | 任务详情 |
| `/nice/{region}/svtScript/{charaGraphId}` | 角色渲染参数 |

### Region 可选值

- `JP` - 日服
- `NA` - 美服
- `CN` - 国服
- `KR` - 韩服
- `TW` - 台服

---

## 二、资源 URL

### 图片资源

| 类型 | URL 模板 |
|------|---------|
| 角色立绘 | `static.atlasacademy.io/{region}/CharaFigure/{charaGraphId}/{charaGraphId}_merged.png` |
| 背景图 | `static.atlasacademy.io/{region}/Back/back{sceneId}.png` |
| 脸图 | `static.atlasacademy.io/{region}/Faces/f_{id}0.png` |
| 战争 Banner | `static.atlasacademy.io/{region}/Banner/banner_war{warId}.png` |
| 活动 Banner | `static.atlasacademy.io/{region}/Banner/banner_event{eventId}.png` |

### 音频资源

| 类型 | URL 模板 |
|------|---------|
| BGM | `static.atlasacademy.io/{region}/Audio/{bgmId}.mp3` |
| SE | `static.atlasacademy.io/{region}/Audio/{seId}.mp3` |
| Voice | `static.atlasacademy.io/{region}/Servants/{servantId}/ChrVoice{voiceId}/voice.mp3` |

### 脚本文件

```
static.atlasacademy.io/{region}/Script/{prefix}/{scriptId}.txt

示例: /JP/Script/01/0100000110.txt
```

---

## 三、角色渲染原理

### Merged 精灵图结构

```
┌─────────────────┐
│                 │  0px
│    身体部分      │
│   (768px 高)    │
│                 │
├─────┬─────┬─────┤  768px
│ F0  │ F1  │ F2  │  表情行 0
├─────┼─────┼─────┤  1024px
│ F3  │ F4  │ F5  │  表情行 1
└─────┴─────┴─────┘
```

**关键数值**:
- 身体显示高度: **768px** (不是 1024!)
- 表情尺寸: **256x256**
- 表情从 **768px** 位置开始
- 每行 4 个表情 (1024 / 256)

### SVT_SCRIPTS 数据

```typescript
interface SvtScript {
  id: number          // charaGraphId
  faceX: number       // 表情 X 偏移 (如 384)
  faceY: number       // 表情 Y 偏移 (如 149)
  offsetX: number     // 角色水平偏移
  offsetY: number     // 角色垂直偏移 (我们未使用)
  extendData?: {
    faceSize: number  // 表情尺寸 (默认 256)
  }
}
```

### 表情位置计算

```typescript
// face 从 1 开始
const faceIndex = face - 1
const perRow = 4  // 1024 / 256

const col = faceIndex % perRow
const row = Math.floor(faceIndex / perRow)

// merged 图中的偏移
const srcOffsetX = col * 256
const srcOffsetY = 768 + row * 256  // 关键: 从 768 开始
```

### DOM 结构

```html
<div class="scene-figure-wrapper">  <!-- bottom:0, overflow:hidden -->
  <div class="scene-figure"></div>   <!-- 身体背景图 -->
  <div class="scene-figure-face"></div>  <!-- 表情层 -->
</div>
```

### CSS 关键点

```css
/* Wrapper: 768高度，贴底，裁剪差分 */
.scene-figure-wrapper {
  position: absolute;
  bottom: 0;
  height: ${768 * scale}px;
  overflow: hidden;
}

/* Figure: 填满 wrapper */
.scene-figure {
  position: absolute;
  inset: 0;
  background-position: left top;
}

/* Face: 绝对定位叠加 */
.scene-figure-face {
  position: absolute;
  left: ${faceX * scale + figureLeft}px;
  top: ${faceY * scale}px;
  background-position: -${srcOffsetX * scale}px -${srcOffsetY * scale}px;
}
```

### 多角色布局

| 角色数 | posX 分布 | 缩放 |
|--------|----------|------|
| 1 人 | 0.5 | 1.0 |
| 2 人 | 0.28, 0.72 | 1.0, 0.95 |
| 3 人 | 0.18, 0.5, 0.82 | 0.9, 1.0, 0.9 |

### 角色高亮/暗淡

```css
.scene-figure-wrapper.inactive {
  filter: brightness(0.4) saturate(0.5);
}

.scene-figure-wrapper.active {
  filter: brightness(1.05) drop-shadow(0 0 20px rgba(0,0,0,0.6));
}
```

---

## 四、数据获取示例

### 获取章节列表

```typescript
const wars = await fetch('https://api.atlasacademy.io/export/JP/nice_war.json')
  .then(r => r.json())

// 过滤主线章节
const mainStory = wars.filter(w => w.id >= 100 && w.id < 1000)
```

### 获取任务脚本

```typescript
const quest = await fetch(`https://api.atlasacademy.io/nice/JP/quest/${questId}`)
  .then(r => r.json())

const scripts = quest.phases[0].scripts  // [{scriptId: "0100000110", ...}]
```

### 获取角色渲染参数

```typescript
const scripts = await fetch(`https://api.atlasacademy.io/nice/JP/svtScript/${charaGraphId}`)
  .then(r => r.json())

const { faceX, faceY, offsetX } = scripts[0]
```

---

## 五、常用角色 ID

| charaGraphId | 角色 | faceX | faceY |
|--------------|------|-------|-------|
| 98001000 | 玛修 (便服) | 384 | 149 |
| 8001000 | 玛修 (战斗服) | 384 | 149 |
| 98003000 | Dr.ロマン | 384 | 149 |
| 10003000 | 祈荒 | 382 | 153 |

---

## 六、我们的实现 vs Atlas Academy

### Atlas 方案

```javascript
figureWrapperTop = (-script.offsetY) * scale
```

### 我们的方案

```javascript
// 不使用 top，直接 bottom: 0 贴底
wrapper.style.bottom = '0'
wrapper.style.height = `${768 * scale}px`
```

**原因**: Atlas 的 `offsetY` 针对 1024 分辨率，我们使用 626 背景高度时，贴底方案更稳定。

