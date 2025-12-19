# Atlas Academy 数据源完整指南

> **版本**: 2.0  
> **最后更新**: 2024-12-20  
> **状态**: 开发中
>
> 本文档涵盖：API 接口、资源 URL、角色渲染原理、数据获取实现、NPC 处理、测试验证

---

## 目录

1. [API 概览](#一api-概览)
2. [资源 URL 规则](#二资源-url-规则)
3. [角色渲染原理](#三角色渲染原理)
4. [数据结构详解](#四数据结构详解)
5. [数据获取实现](#五数据获取实现)
6. [NPC 与特殊角色](#六npc-与特殊角色)
7. [测试与验证](#七测试与验证)
8. [常见问题](#八常见问题)

---

## 一、API 概览

### 1.1 基础 URL

| 类型 | URL |
|------|-----|
| API 接口 | `https://api.atlasacademy.io` |
| 静态资源 | `https://static.atlasacademy.io` |
| 游戏数据 | `https://assets.atlasacademy.io/GameData` |
| 完整文档 | `https://api.atlasacademy.io/rapidoc` |

### 1.2 Region 列表

| Region | 服务器 | 说明 |
|--------|--------|------|
| `JP` | 日服 | 最新内容，推荐用于开发 |
| `NA` | 美服 | 英文本地化 |
| `CN` | 国服 | 中文本地化，有审查 |
| `KR` | 韩服 | 韩文本地化 |
| `TW` | 台服 | 繁体中文 |

### 1.3 API 端点分类

#### 导出数据 (Export)

大型 JSON 文件，包含完整数据，适合本地缓存：

| 端点 | 描述 | 大小约 |
|------|------|--------|
| `/export/{region}/nice_war.json` | 所有战争/章节 | ~5MB |
| `/export/{region}/nice_servant.json` | 所有从者 (含 NPC) | ~80MB |
| `/export/{region}/nice_servant_lore.json` | 从者详情 (含幕间) | ~30MB |
| `/export/{region}/nice_quest.json` | 所有任务 | ~100MB |
| `/export/{region}/nice_event.json` | 所有活动 | ~10MB |
| `/export/{region}/nice_bgm.json` | 所有 BGM | ~2MB |

#### 单个查询 (Nice)

按需获取单个实体：

| 端点 | 描述 |
|------|------|
| `/nice/{region}/servant/{id}` | 从者详情 |
| `/nice/{region}/quest/{id}` | 任务详情 |
| `/nice/{region}/war/{id}` | 战争详情 |
| `/nice/{region}/event/{id}` | 活动详情 |
| `/nice/{region}/svtScript/{charaGraphId}` | 角色渲染参数 |

#### 原始数据 (Raw)

未处理的原始游戏数据：

| 端点 | 描述 |
|------|------|
| `/raw/{region}/servant/{id}` | 原始从者数据 |
| `/raw/{region}/quest/{id}` | 原始任务数据 |

### 1.4 请求示例

```typescript
// 获取所有战争
const wars = await fetch('https://api.atlasacademy.io/export/JP/nice_war.json')
  .then(r => r.json())

// 获取单个任务
const quest = await fetch('https://api.atlasacademy.io/nice/JP/quest/1000001')
  .then(r => r.json())

// 获取角色渲染参数
const script = await fetch('https://api.atlasacademy.io/nice/JP/svtScript/98001000')
  .then(r => r.json())
```

---

## 二、资源 URL 规则

### 2.1 角色立绘

#### CharaFigure (剧情立绘)

```
https://static.atlasacademy.io/{region}/CharaFigure/{charaGraphId}/{charaGraphId}_merged.png
```

| charaGraphId 类型 | 示例 | 说明 |
|------------------|------|------|
| 从者灵基 | `1001000`, `1001001`, `1001002` | 第1/2/3灵基 |
| 灵衣 | `1001300` | 灵衣 ID |
| 剧情 NPC | `98001000`, `98003000` | 特殊立绘 |
| 敌人 | `9xxxxxxx` | 敌人立绘 |

```typescript
function getCharaFigureUrl(region: string, charaGraphId: string | number): string {
  return `https://static.atlasacademy.io/${region}/CharaFigure/${charaGraphId}/${charaGraphId}_merged.png`
}
```

#### CharaGraph (卡面立绘)

```
https://static.atlasacademy.io/{region}/CharaGraph/{servantId}/{servantId}a@1.png
```

### 2.2 脸图

```
https://static.atlasacademy.io/{region}/Faces/f_{id}0.png
```

```typescript
function getFaceUrl(region: string, servantId: number | string): string {
  return `https://static.atlasacademy.io/${region}/Faces/f_${servantId}0.png`
}
```

### 2.3 背景

```
https://static.atlasacademy.io/{region}/Back/back{sceneId}.png
```

```typescript
function getBackgroundUrl(region: string, sceneId: string | number): string {
  return `https://static.atlasacademy.io/${region}/Back/back${sceneId}.png`
}
```

### 2.4 Banner

```typescript
// 战争 Banner
function getWarBannerUrl(region: string, warId: number): string {
  return `https://static.atlasacademy.io/${region}/Banner/banner_war${warId}.png`
}

// 活动 Banner
function getEventBannerUrl(region: string, eventId: number): string {
  return `https://static.atlasacademy.io/${region}/Banner/banner_event${eventId}.png`
}
```

### 2.5 音频

#### BGM

```
https://assets.atlasacademy.io/GameData/{region}/Audio/{bgmId}/{bgmId}.mp3
```

#### 音效 (SE)

```typescript
function getSoundEffectUrl(region: string, seId: string): string {
  // 根据前缀确定文件夹
  const prefix = seId.slice(0, 2)
  const folderMap: Record<string, string> = {
    'ba': 'Battle',
    'ad': 'SE',
    'ar': 'ResidentSE',
    '21': 'SE_21'
  }
  const folder = folderMap[prefix] ?? 'SE'
  
  return `https://assets.atlasacademy.io/GameData/${region}/Audio/${folder}/${seId}.mp3`
}
```

#### 语音

```typescript
function getVoiceUrl(region: string, servantId: number, voiceId: string): string {
  return `https://assets.atlasacademy.io/GameData/${region}/Audio/Servants_${servantId}/${voiceId}.mp3`
}
```

### 2.6 脚本

```
https://static.atlasacademy.io/{region}/Script/{prefix}/{scriptId}.txt
```

```typescript
function getScriptUrl(region: string, scriptId: string): string {
  const prefix = scriptId.slice(0, 2)
  return `https://static.atlasacademy.io/${region}/Script/${prefix}/${scriptId}.txt`
}
```

### 2.7 特效

```
https://static.atlasacademy.io/file/aa-fgo-decrypt-{region}/Effect/{category}/{effectId}
```

| 分类 | 路径 |
|------|------|
| 对话特效 | `Effect/Talk/` |
| 战斗特效 | `Effect/Battle/` |
| UI 特效 | `Effect/UI/` |

---

## 三、角色渲染原理

### 3.1 Merged 精灵图结构

FGO 的角色立绘使用 `_merged.png` 格式，将身体和表情合并在一张图中：

```
┌─────────────────────────────────────────┐  0px
│                                         │
│                                         │
│              身体部分                    │
│           (宽度: 1024px)                │
│           (高度: 768px)                 │
│                                         │
│                                         │
├────────────┬────────────┬────────────┬──┤  768px
│   Face 0   │   Face 1   │   Face 2   │...│
│  (256x256) │  (256x256) │  (256x256) │   │
├────────────┼────────────┼────────────┼──┤  1024px
│   Face 4   │   Face 5   │   Face 6   │...│
│            │            │            │   │
├────────────┼────────────┼────────────┼──┤  1280px
│   Face 8   │   Face 9   │   Face 10  │...│
│            │            │            │   │
└────────────┴────────────┴────────────┴──┘
```

**关键数值**:
- 身体显示高度: **768px** (不是 1024!)
- 身体宽度: **1024px**
- 表情尺寸: **256 × 256** (默认)
- 表情每行: **4 个** (1024 / 256)
- 表情起始位置: **768px**

### 3.2 表情位置计算

```typescript
interface FaceCalculation {
  faceIndex: number       // 从 0 开始的索引
  col: number             // 列号 (0-3)
  row: number             // 行号 (0, 1, 2...)
  srcX: number            // merged 图中的 X 偏移
  srcY: number            // merged 图中的 Y 偏移
}

function calculateFacePosition(face: number, faceSize: number = 256): FaceCalculation {
  // face 从脚本中是 1-based，转为 0-based
  const faceIndex = face - 1
  
  if (faceIndex < 0) {
    return { faceIndex: -1, col: 0, row: 0, srcX: 0, srcY: 0 }
  }
  
  const perRow = Math.floor(1024 / faceSize)  // 通常是 4
  const col = faceIndex % perRow
  const row = Math.floor(faceIndex / perRow)
  
  return {
    faceIndex,
    col,
    row,
    srcX: col * faceSize,
    srcY: 768 + row * faceSize  // ⚠️ 关键：从 768 开始
  }
}
```

### 3.3 SVT_SCRIPTS 数据

每个角色都有渲染参数，通过 `svtScript` 接口获取：

```typescript
interface SvtScript {
  id: number              // charaGraphId
  faceX: number           // 表情在身体上的 X 位置
  faceY: number           // 表情在身体上的 Y 位置
  offsetX: number         // 角色整体水平偏移
  offsetY: number         // 角色整体垂直偏移 (通常不用)
  extendData?: {
    faceSize?: number     // 表情尺寸 (不是 256 时)
  }
}

// 获取示例
async function getSvtScript(region: string, charaGraphId: string): Promise<SvtScript | null> {
  try {
    const response = await fetch(
      `https://api.atlasacademy.io/nice/${region}/svtScript/${charaGraphId}`
    )
    const data = await response.json()
    return data[0] ?? null
  } catch {
    return null
  }
}
```

### 3.4 DOM 结构实现

```html
<!-- 舞台 -->
<div class="stage" style="position: relative; width: 1024px; height: 626px; overflow: hidden;">
  
  <!-- 背景 -->
  <div class="background" style="
    position: absolute;
    inset: 0;
    background: url('/JP/Back/back10000.png') center/cover;
  "></div>
  
  <!-- 角色 Wrapper -->
  <div class="character-wrapper" style="
    position: absolute;
    bottom: 0;
    left: ${left}px;
    width: ${1024 * scale}px;
    height: ${768 * scale}px;
    overflow: hidden;
  ">
    <!-- 身体 -->
    <div class="character-body" style="
      position: absolute;
      inset: 0;
      background: url('${mergedPngUrl}') left top / ${1024 * scale}px auto no-repeat;
    "></div>
    
    <!-- 表情层 -->
    <div class="character-face" style="
      position: absolute;
      left: ${(faceX + offsetX) * scale}px;
      top: ${faceY * scale}px;
      width: ${faceSize * scale}px;
      height: ${faceSize * scale}px;
      background: url('${mergedPngUrl}');
      background-position: -${srcX * scale}px -${srcY * scale}px;
      background-size: ${imageWidth * scale}px auto;
    "></div>
  </div>
  
</div>
```

### 3.5 完整布局计算

```typescript
interface CharacterLayout {
  wrapper: {
    width: number
    height: number
    left: number
    bottom: number
  }
  body: {
    backgroundSize: string
    backgroundPosition: string
  }
  face?: {
    left: number
    top: number
    width: number
    height: number
    backgroundPosition: string
    backgroundSize: string
  }
}

function calculateCharacterLayout(
  char: CharacterSlot,
  stageWidth: number,
  stageHeight: number,
  script?: SvtScript
): CharacterLayout {
  const baseWidth = 1024
  const bodyHeight = 768
  const faceSize = script?.extendData?.faceSize ?? 256
  
  // 计算缩放
  const scale = (stageWidth / baseWidth) * char.scale
  
  // Wrapper 位置
  const wrapperWidth = baseWidth * scale
  const wrapperHeight = bodyHeight * scale
  const wrapperLeft = stageWidth * char.posX - wrapperWidth / 2
  
  const layout: CharacterLayout = {
    wrapper: {
      width: wrapperWidth,
      height: wrapperHeight,
      left: wrapperLeft,
      bottom: 0
    },
    body: {
      backgroundSize: `${baseWidth * scale}px auto`,
      backgroundPosition: 'left top'
    }
  }
  
  // 表情计算
  if (char.currentFace > 0 && script) {
    const faceCalc = calculateFacePosition(char.currentFace, faceSize)
    
    // 表情在身体上的位置
    const faceX = script.faceX ?? 0
    const faceY = script.faceY ?? 0
    const offsetX = script.offsetX ?? 0
    
    layout.face = {
      left: (faceX + offsetX) * scale,
      top: faceY * scale,
      width: faceSize * scale,
      height: faceSize * scale,
      backgroundPosition: `-${faceCalc.srcX * scale}px -${faceCalc.srcY * scale}px`,
      backgroundSize: `${baseWidth * scale}px auto`  // 使用相同的缩放
    }
  }
  
  return layout
}
```

### 3.6 多角色布局

```typescript
interface MultiCharacterConfig {
  count: number
  positions: number[]  // posX 值 (0-1)
  scales: number[]     // 缩放比例
}

const MULTI_CHARACTER_CONFIGS: Record<number, MultiCharacterConfig> = {
  1: {
    count: 1,
    positions: [0.5],
    scales: [1.0]
  },
  2: {
    count: 2,
    positions: [0.28, 0.72],
    scales: [1.0, 0.95]
  },
  3: {
    count: 3,
    positions: [0.18, 0.5, 0.82],
    scales: [0.9, 1.0, 0.9]
  }
}

function applyMultiCharacterLayout(characters: CharacterSlot[]): CharacterSlot[] {
  const config = MULTI_CHARACTER_CONFIGS[characters.length] ?? MULTI_CHARACTER_CONFIGS[3]
  
  return characters.map((char, index) => ({
    ...char,
    posX: config.positions[index] ?? 0.5,
    scale: config.scales[index] ?? 1.0
  }))
}
```

### 3.7 高亮与暗淡

```css
/* 默认状态 */
.character-wrapper {
  filter: brightness(1) saturate(1);
  transition: filter 0.3s ease;
}

/* 非活跃状态 (其他角色说话时) */
.character-wrapper.inactive {
  filter: brightness(0.4) saturate(0.5);
}

/* 活跃状态 (正在说话) */
.character-wrapper.active {
  filter: brightness(1.05) drop-shadow(0 0 20px rgba(0, 0, 0, 0.6));
}

/* 剪影效果 */
.character-wrapper.silhouette {
  filter: brightness(0) saturate(0);
}

/* 阴影效果 */
.character-wrapper.shadow {
  filter: brightness(0.2) saturate(0.3);
}
```

---

## 四、数据结构详解

### 4.1 War (战争/章节)

```typescript
interface War {
  id: number
  name: string              // 简称
  longName: string          // 全称
  banner: string            // Banner URL
  headerImage?: string      // 头图
  priority: number          // 排序优先级
  eventId: number           // 关联活动 ID (0 = 非活动)
  startType: number         // 开始类型
  spots: Spot[]             // 地点列表
  quests: Quest[]           // 任务列表
}

// 判断章节类型
function getWarType(war: War): 'main' | 'event' | 'other' {
  if (war.id >= 100 && war.id < 1000) return 'main'
  if (war.eventId > 0) return 'event'
  return 'other'
}
```

### 4.2 Quest (任务)

```typescript
interface Quest {
  id: number
  name: string
  type: QuestType
  warId: number
  phases: QuestPhase[]
  releaseConditions: ReleaseCondition[]
  priority: number
}

type QuestType = 
  | 'main'        // 主线
  | 'free'        // Free 本
  | 'friendship'  // 幕间物语
  | 'event'       // 活动任务

interface QuestPhase {
  phase: number
  scripts: ScriptInfo[]
}

interface ScriptInfo {
  scriptId: string   // "0100000110"
  sceneType: number
}
```

### 4.3 Servant (从者)

```typescript
interface Servant {
  id: number
  collectionNo: number       // 图鉴编号
  name: string
  originalName: string
  className: ClassName
  rarity: number             // 1-5
  cost: number
  extraAssets: ServantExtraAssets
  relateQuestIds: number[]   // 关联任务 ID (含幕间)
  traits: Trait[]
}

interface ServantExtraAssets {
  charaGraph: {
    ascension: Record<string, string>  // 灵基立绘
    costume?: Record<string, string>   // 灵衣
  }
  charaFigure: {
    ascension: Record<string, string>  // 剧情立绘
    story?: Record<string, string>     // 特殊剧情立绘
    costume?: Record<string, string>   // 灵衣
  }
  faces: {
    ascension: Record<string, string>  // 脸图
    costume?: Record<string, string>
  }
}

type ClassName = 
  | 'saber' | 'archer' | 'lancer' 
  | 'rider' | 'caster' | 'assassin' | 'berserker'
  | 'ruler' | 'avenger' | 'moonCancer' | 'alterEgo'
  | 'foreigner' | 'pretender' | 'beast' | 'shielder'
```

### 4.4 Event (活动)

```typescript
interface Event {
  id: number
  name: string
  type: EventType
  startedAt: number          // 开始时间戳
  endedAt: number            // 结束时间戳
  noticeBanner?: string      // 公告 Banner
  banner?: string            // Banner
  warIds: number[]           // 关联战争 ID
}

type EventType = 
  | 'story'           // 剧情活动
  | 'collaboration'   // 联动活动
  | 'festival'        // 庆典
  | 'lottery'         // 抽奖箱
  | 'tower'           // 高难
  | 'raid'            // 讨伐
```

---

## 五、数据获取实现

### 5.1 数据服务类

```typescript
class AtlasApiService {
  private region: string
  private cache = new Map<string, unknown>()
  
  constructor(region: string = 'JP') {
    this.region = region
  }
  
  /** 获取所有战争 */
  async getWars(): Promise<War[]> {
    const key = `wars_${this.region}`
    if (this.cache.has(key)) {
      return this.cache.get(key) as War[]
    }
    
    const url = `https://api.atlasacademy.io/export/${this.region}/nice_war.json`
    const wars = await this.fetchJson<War[]>(url)
    this.cache.set(key, wars)
    return wars
  }
  
  /** 获取主线章节 */
  async getMainStoryWars(): Promise<War[]> {
    const wars = await this.getWars()
    return wars.filter(w => w.id >= 100 && w.id < 1000)
  }
  
  /** 获取活动章节 */
  async getEventWars(): Promise<War[]> {
    const wars = await this.getWars()
    return wars.filter(w => w.eventId > 0)
  }
  
  /** 获取任务详情 */
  async getQuest(questId: number): Promise<Quest> {
    const url = `https://api.atlasacademy.io/nice/${this.region}/quest/${questId}`
    return this.fetchJson<Quest>(url)
  }
  
  /** 获取任务脚本 ID 列表 */
  async getQuestScripts(questId: number): Promise<string[]> {
    const quest = await this.getQuest(questId)
    const scripts: string[] = []
    
    for (const phase of quest.phases) {
      for (const script of phase.scripts) {
        scripts.push(script.scriptId)
      }
    }
    
    return scripts
  }
  
  /** 获取原始脚本内容 */
  async getScriptContent(scriptId: string): Promise<string> {
    const prefix = scriptId.slice(0, 2)
    const url = `https://static.atlasacademy.io/${this.region}/Script/${prefix}/${scriptId}.txt`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Script not found: ${scriptId}`)
    }
    return response.text()
  }
  
  /** 获取 SVT Script (渲染参数) */
  async getSvtScript(charaGraphId: string | number): Promise<SvtScript | null> {
    const url = `https://api.atlasacademy.io/nice/${this.region}/svtScript/${charaGraphId}`
    try {
      const data = await this.fetchJson<SvtScript[]>(url)
      return data[0] ?? null
    } catch {
      return null
    }
  }
  
  /** 获取所有从者 */
  async getServants(): Promise<Servant[]> {
    const key = `servants_${this.region}`
    if (this.cache.has(key)) {
      return this.cache.get(key) as Servant[]
    }
    
    const url = `https://api.atlasacademy.io/export/${this.region}/nice_servant.json`
    const servants = await this.fetchJson<Servant[]>(url)
    this.cache.set(key, servants)
    return servants
  }
  
  /** 获取从者幕间任务 */
  async getServantInterludes(servantId: number): Promise<Quest[]> {
    const servants = await this.getServants()
    const servant = servants.find(s => s.id === servantId)
    
    if (!servant) return []
    
    const interludes: Quest[] = []
    for (const questId of servant.relateQuestIds) {
      try {
        const quest = await this.getQuest(questId)
        if (quest.type === 'friendship') {
          interludes.push(quest)
        }
      } catch {
        // 跳过无法获取的任务
      }
    }
    
    return interludes
  }
  
  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Fetch failed: ${url}`)
    }
    return response.json()
  }
}
```

### 5.2 数据缓存策略

```typescript
interface CacheConfig {
  ttl: number             // 过期时间 (毫秒)
  storage: 'memory' | 'localStorage' | 'indexedDB'
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  wars: { ttl: 24 * 60 * 60 * 1000, storage: 'localStorage' },      // 1天
  servants: { ttl: 24 * 60 * 60 * 1000, storage: 'indexedDB' },     // 1天
  quests: { ttl: 60 * 60 * 1000, storage: 'memory' },               // 1小时
  scripts: { ttl: 7 * 24 * 60 * 60 * 1000, storage: 'indexedDB' },  // 7天
}

class CachedAtlasApi extends AtlasApiService {
  private localStorage = new Map<string, { data: unknown; expires: number }>()
  
  async getWithCache<T>(key: string, fetcher: () => Promise<T>, config: CacheConfig): Promise<T> {
    // 检查缓存
    const cached = this.localStorage.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data as T
    }
    
    // 获取新数据
    const data = await fetcher()
    
    // 存储缓存
    this.localStorage.set(key, {
      data,
      expires: Date.now() + config.ttl
    })
    
    return data
  }
}
```

---

## 六、NPC 与特殊角色

### 6.1 charaGraphId 规则

| ID 范围 | 类型 | 示例 |
|---------|------|------|
| `1xx0xxx` ~ `4xx0xxx` | 从者 (灵基) | `1001000` (阿尔托莉雅第1灵基) |
| `1xx0xxx1` ~ `1xx0xxx3` | 从者 (第2-4灵基) | `1001001`, `1001002`, `1001003` |
| `1xx1xxx` ~ `1xx9xxx` | 灵衣 | `1001300` |
| `8001xxx` | 玛修 (战斗) | `8001000` |
| `98xxxxxx` | 剧情 NPC | `98001000` (玛修便服) |
| `9xxxxxxx` | 敌人 | - |

### 6.2 常见剧情 NPC

| charaGraphId | 角色 | 说明 |
|--------------|------|------|
| `98001000` | 玛修 (便服) | 日常立绘 |
| `98001010` | 玛修 (制服) | 卡尔迪亚制服 |
| `98002000` | 芙 | 芙芙 |
| `98003000` | 罗曼尼 | Dr. Roman |
| `98003003` | 罗曼尼 (通信) | 通信画面 |
| `98004000` | 达芬奇 | 达芬奇酱 |
| `98005000` | 奥尔加玛丽 | 前所长 |

### 6.3 获取 NPC 数据

```typescript
interface NpcCharacter {
  charaGraphId: string
  name: string
  imageUrl: string
  svtScript?: SvtScript
}

async function getNpcData(region: string, charaGraphId: string): Promise<NpcCharacter | null> {
  const api = new AtlasApiService(region)
  
  // 尝试获取 svtScript
  const script = await api.getSvtScript(charaGraphId)
  
  // 构建图片 URL
  const imageUrl = getCharaFigureUrl(region, charaGraphId)
  
  // 验证图片是否存在
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' })
    if (!response.ok) return null
  } catch {
    return null
  }
  
  return {
    charaGraphId,
    name: 'NPC',  // NPC 没有名字数据，需要从脚本中获取
    imageUrl,
    svtScript: script ?? undefined
  }
}
```

### 6.4 从脚本中提取 NPC 名称

```typescript
function extractNpcNamesFromScript(script: ParsedScript): Map<string, string> {
  const names = new Map<string, string>()
  
  for (const comp of script.components) {
    if (comp.type === ScriptComponentType.CHARA_SET) {
      const charaSet = comp as ScriptCharaSet
      names.set(charaSet.charaGraphId, charaSet.displayName)
    }
  }
  
  return names
}
```

---

## 七、测试与验证

### 7.1 资源 URL 验证

```typescript
async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

// 测试
describe('Resource URLs', () => {
  test('CharaFigure URL', async () => {
    const url = getCharaFigureUrl('JP', '1001000')
    expect(await validateUrl(url)).toBe(true)
  })
  
  test('Background URL', async () => {
    const url = getBackgroundUrl('JP', '10000')
    expect(await validateUrl(url)).toBe(true)
  })
  
  test('Script URL', async () => {
    const url = getScriptUrl('JP', '0100000110')
    expect(await validateUrl(url)).toBe(true)
  })
})
```

### 7.2 角色渲染测试

```typescript
describe('Character Rendering', () => {
  test('Face position calculation', () => {
    // Face 1 (第一个表情)
    const face1 = calculateFacePosition(1)
    expect(face1.col).toBe(0)
    expect(face1.row).toBe(0)
    expect(face1.srcY).toBe(768)
    
    // Face 5 (第二行第一个)
    const face5 = calculateFacePosition(5)
    expect(face5.col).toBe(0)
    expect(face5.row).toBe(1)
    expect(face5.srcY).toBe(1024)  // 768 + 256
  })
  
  test('Layout calculation', async () => {
    const api = new AtlasApiService('JP')
    const script = await api.getSvtScript('1001000')
    
    const char: CharacterSlot = {
      slot: 'A',
      charaGraphId: '1001000',
      displayName: 'アルトリア',
      baseFace: 0,
      visible: true,
      position: 1,
      currentFace: 1,
      isActive: true,
      isSilhouette: false,
      scale: 1,
      imageUrl: ''
    }
    
    const layout = calculateCharacterLayout(char, 1024, 626, script)
    
    expect(layout.wrapper.height).toBe(768)
    expect(layout.wrapper.bottom).toBe(0)
    expect(layout.face).toBeDefined()
  })
})
```

### 7.3 数据获取测试

```typescript
describe('AtlasApiService', () => {
  const api = new AtlasApiService('JP')
  
  test('Get main story wars', async () => {
    const wars = await api.getMainStoryWars()
    expect(wars.length).toBeGreaterThan(0)
    expect(wars[0].id).toBeGreaterThanOrEqual(100)
    expect(wars[0].id).toBeLessThan(1000)
  })
  
  test('Get quest scripts', async () => {
    const scripts = await api.getQuestScripts(1000001)
    expect(scripts.length).toBeGreaterThan(0)
    expect(scripts[0]).toMatch(/^\d+$/)
  })
  
  test('Get script content', async () => {
    const content = await api.getScriptContent('0100000110')
    expect(content).toContain('＄')
    expect(content.length).toBeGreaterThan(100)
  })
})
```

---

## 八、常见问题

### 8.1 图片加载失败

**问题**: 角色立绘 404

**排查**:
1. 检查 charaGraphId 是否正确
2. 检查 region 是否正确
3. 某些 NPC 可能没有 merged.png

**解决方案**:
```typescript
async function safeGetCharaFigure(region: string, charaGraphId: string): Promise<string | null> {
  const url = getCharaFigureUrl(region, charaGraphId)
  const valid = await validateUrl(url)
  return valid ? url : null
}
```

### 8.2 表情位置错误

**问题**: 表情显示在错误位置

**排查**:
1. 检查 faceSize 是否为默认 256
2. 检查 faceX, faceY 是否正确
3. 检查缩放计算

**解决方案**:
```typescript
// 始终获取 svtScript 而不是使用默认值
const script = await api.getSvtScript(charaGraphId)
if (!script) {
  console.warn(`No svtScript for ${charaGraphId}, using defaults`)
}
```

### 8.3 CORS 问题

**问题**: 浏览器阻止跨域请求

**解决方案**:
- Atlas Academy API 已启用 CORS
- 确保使用正确的 URL (不要添加额外参数)
- 开发环境使用代理

### 8.4 性能优化

**问题**: 大量数据加载缓慢

**解决方案**:
1. 使用 `nice_servant_lore.json` 而不是 `nice_servant.json` (更小)
2. 实现分页加载
3. 使用 IndexedDB 缓存
4. 预加载常用数据

---

*文档完*
