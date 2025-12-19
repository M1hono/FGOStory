# 扩展功能

> 剧情索引、NPC 数据、特效系统、主题切换、CN 映射

---

## 一、剧情索引设计

### 页面结构

| 页面 | 路径 | 内容 |
|------|------|------|
| **主线** | `/` (Hero) | 第一部 / 1.5部 / 第二部 |
| **活动** | `/events` | 按年份/类型分类 |
| **幕间** | `/interludes` | 按职介/星级筛选 |

### 主线分类 (Hero Page)

```typescript
interface MainStoryPart {
  id: 'part1' | 'part1.5' | 'part2'
  name: string
  wars: War[]
}

const MAIN_STORY_PARTS = {
  part1: { range: [100, 108], name: '第一部' },      // 序章~终章
  'part1.5': { range: [109, 112], name: '1.5部' },  // Epic of Remnant
  part2: { range: [200, 299], name: '第二部' },      // Cosmos in the Lostbelt
}

function classifyMainStory(wars: War[]): MainStoryPart[] {
  return Object.entries(MAIN_STORY_PARTS).map(([id, config]) => ({
    id,
    name: config.name,
    wars: wars.filter(w => w.id >= config.range[0] && w.id <= config.range[1])
  }))
}
```

### 活动分类 (Events Page)

```typescript
interface EventCategory {
  year?: number          // 按年份
  type?: EventType       // 按类型
  events: Event[]
}

type EventType = 
  | 'collaboration'      // 联动
  | 'seasonal'           // 季节性 (夏日/圣诞/情人节)
  | 'campaign'           // 纪念活动
  | 'story'              // 剧情活动
  | 'rerun'              // 复刻

// 按年份分组
function groupEventsByYear(events: Event[]): Map<number, Event[]> {
  const groups = new Map<number, Event[]>()
  events.forEach(event => {
    const year = new Date(event.startedAt * 1000).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(event)
  })
  return groups
}
```

### 幕间筛选 (Interludes Page)

```typescript
interface InterludeFilter {
  className?: ClassName   // 职介筛选
  rarity?: number[]       // 星级筛选 (1-5)
}

type ClassName = 'saber' | 'archer' | 'lancer' | 'rider' | 'caster' | 'assassin' | 'berserker' | 'extra'

// 获取从者幕间
function getServantInterludes(servant: Servant): Quest[] {
  return servant.relateQuestIds
    .map(id => getQuestById(id))
    .filter(q => q.type === 'friendship')
}

// 按职介分组
function groupByClass(servants: Servant[]): Map<ClassName, Servant[]> {
  const groups = new Map()
  servants.forEach(s => {
    const cls = s.className as ClassName
    if (!groups.has(cls)) groups.set(cls, [])
    groups.get(cls)!.push(s)
  })
  return groups
}
```

---

## 二、NPC 数据获取

### 数据源

```typescript
// 完整从者数据 (包含特殊 NPC 如 98003003 罗曼尼)
const SERVANT_DATA_URL = 'https://api.atlasacademy.io/export/{region}/nice_servant.json'

// 包含所有 charaGraphId 的实体
const NPC_DATA_URL = 'https://api.atlasacademy.io/export/{region}/nice_equip.json'
const ENEMY_DATA_URL = 'https://api.atlasacademy.io/export/{region}/nice_enemy.json'
```

### 特殊 NPC ID 规则

| ID 范围 | 类型 | 示例 |
|---------|------|------|
| 98xxxxxx | 剧情 NPC | 98001000 (玛修便服), 98003003 (罗曼通信) |
| 8001xxx | 玛修战斗形态 | 8001000 |
| 9xxxxxxx | 敌人/怪物 | - |
| 1-4xx0xxx | 从者 | 1001000 (阿尔托莉雅) |

### 获取 NPC 渲染参数

```typescript
interface NpcData {
  id: number
  charaGraphId: string
  name: string
  face: string              // 脸图 URL
  charaFigure: string       // 立绘 URL
  svtScript?: SvtScript     // 渲染参数 (faceX, faceY, offsetX)
}

// API 端点
const getSvtScript = (charaGraphId: number) =>
  `https://api.atlasacademy.io/nice/{region}/svtScript/${charaGraphId}`

// charaFigure 格式
const getCharaFigure = (charaGraphId: number) =>
  `https://static.atlasacademy.io/{region}/CharaFigure/${charaGraphId}/${charaGraphId}_merged.png`
```

### nice_servant.json 关键字段

```typescript
interface ServantData {
  id: number
  collectionNo: number      // 图鉴编号
  name: string
  className: string
  rarity: number
  extraAssets: {
    charaFigure: {
      ascension: Record<string, string>  // 灵基立绘
      story?: Record<string, string>     // 剧情专用立绘
      costume?: Record<string, string>   // 灵衣
    }
    faces: {
      ascension: Record<string, string>  // 脸图
    }
  }
  relateQuestIds: number[]  // 关联任务 (含幕间)
}
```

---

## 三、特效系统

### Effect 资源 URL

```
https://static.atlasacademy.io/file/aa-fgo-decrypt-{region}/Effect/{category}/{effectId}
```

### 特效分类

| 分类 | 路径 | 示例 |
|------|------|------|
| 对话特效 | `Effect/Talk/` | `bit_talk_06` (阴影效果) |
| 战斗特效 | `Effect/Battle/` | - |
| UI 特效 | `Effect/UI/` | - |

### bit_talk 特效

```typescript
// 对话框阴影效果
const TALK_EFFECTS = {
  'bit_talk_01': 'normal',
  'bit_talk_06': 'shadow',     // 黑影/剪影
  'bit_talk_07': 'silhouette', // 轮廓
}

// 使用方式 (CSS filter)
.character-shadow {
  filter: brightness(0) saturate(0);  // 完全黑化
}

.character-silhouette {
  filter: brightness(0.2) saturate(0.3);  // 半透明剪影
}
```

### 场景特效

```typescript
// 脚本中的特效指令
interface ScriptEffect {
  type: 'flash' | 'shake' | 'fade' | 'wipe'
  params: Record<string, number | string>
}

// 示例
[flashin once 200 0.1 00000000 black]  // 闪白
[charaShake A 10 5 0 0.3]              // 角色震动
[wipein circleIn 0.5 0]                // 圆形擦入
```

---

## 四、主题和语言切换

### VitePress 主题切换

```typescript
// 使用 VitePress 内置的 useData
import { useData } from 'vitepress'

export function useTheme() {
  const { isDark } = useData()
  
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }
  
  return { isDark, toggleTheme }
}
```

### VitePress 源码参考

```typescript
// vitepress/src/client/theme-default/composables/dark.ts
import { useDark, useToggle } from '@vueuse/core'

export const isDark = useDark({
  storageKey: 'vitepress-theme-appearance',
  valueDark: 'dark',
  valueLight: '',
})

export const toggleDark = useToggle(isDark)
```

### 多语言切换

```typescript
// .vitepress/config.ts
export default {
  locales: {
    root: { label: '日本語', lang: 'ja' },
    'zh-CN': { label: '简体中文', lang: 'zh-CN' },
    'zh-TW': { label: '繁體中文', lang: 'zh-TW' },
    en: { label: 'English', lang: 'en' },
  }
}

// 组件中使用
import { useData } from 'vitepress'
const { lang } = useData()

// 获取对应 region
const LANG_TO_REGION = {
  'ja': 'JP',
  'zh-CN': 'CN',
  'zh-TW': 'TW',
  'en': 'NA'
}
```

---

## 五、URL 精准定位

### 路由结构

```
/story/{warId}/{questId}#scene-{index}

示例:
/story/100/9100001#scene-15   → 主线序章第15个场景
/events/80001#scene-3         → 活动剧情第3个场景
/interludes/100100#scene-0    → 阿尔托莉雅幕间开头
```

### 深度链接实现

```typescript
// 监听 URL hash 变化
function useSceneNavigation() {
  const currentScene = ref(0)
  
  onMounted(() => {
    const hash = window.location.hash
    if (hash.startsWith('#scene-')) {
      currentScene.value = parseInt(hash.slice(7))
    }
  })
  
  watch(currentScene, (index) => {
    history.replaceState(null, '', `#scene-${index}`)
  })
  
  return { currentScene }
}
```

### 分享链接

```typescript
function getShareUrl(warId: number, questId: number, sceneIndex: number): string {
  const base = window.location.origin
  return `${base}/story/${warId}/${questId}#scene-${sceneIndex}`
}
```

---

## 六、CN 审查映射

### 映射规则

```json
{
  "servants": {
    "荆轲": ["暗匿者042", "匕见"],
    "吕布奉先": ["狂战士049", "虎狼"],
    "始皇帝": ["统治者227", "政"],
    "武则天": ["暗匿者174", "周帝"],
    "杨贵妃": ["降临者268", "玉环"]
  },
  "terms": {
    "暗杀": ["暗匿"],
    "杀": ["击", "败"],
    "血": ["红色液体"],
    "死亡": ["消逝", "离去"]
  }
}
```

### 反向映射

```typescript
class CnMappingService {
  private reverseMap = new Map<string, string>()
  
  constructor(mapping: CnMapping) {
    Object.entries(mapping.servants).forEach(([trueName, aliases]) => {
      aliases.forEach(alias => this.reverseMap.set(alias, trueName))
    })
    Object.entries(mapping.terms).forEach(([original, aliases]) => {
      aliases.forEach(alias => this.reverseMap.set(alias, original))
    })
  }
  
  map(text: string): string {
    let result = text
    this.reverseMap.forEach((original, alias) => {
      result = result.replaceAll(alias, original)
    })
    return result
  }
}
```

---

## 七、API 参考

### Atlas Academy RapiDoc

完整 API 文档: https://api.atlasacademy.io/rapidoc

### 常用端点

| 端点 | 描述 |
|------|------|
| `/export/{region}/nice_war.json` | 所有战争/章节 |
| `/export/{region}/nice_servant.json` | 完整从者数据 (含 NPC) |
| `/export/{region}/nice_quest.json` | 所有任务 |
| `/nice/{region}/svtScript/{id}` | 角色渲染参数 |
| `/nice/{region}/quest/{id}` | 任务详情 |

### 脚本解析参考

参考: [cipherallies/fgo-scripts-parser](https://github.com/cipherallies/fgo-scripts-parser)

```typescript
// ScriptComponentType 枚举
enum ScriptComponentType {
  CHARA_SET,       // [charaSet A 8001000 0 マシュ]
  CHARA_FACE,      // [charaFace A 1]
  CHARA_FADE_IN,   // [charaFadein A 0.3 1]
  CHARA_FADE_OUT,  // [charaFadeout A 0.3]
  DIALOGUE,        // ＠マシュ + 对话内容
  CHOICES,         // ？1：选项1 / ？2：选项2 / ？！
  SOUND_EFFECT,    // [se ad1]
  BGM,             // [bgm BGM_EVENT_1]
  VOICE,           // [voice 100100_100]
  BACKGROUND,      // [scene 10000]
  WAIT,            // [wt 0.5]
  LABEL,           // [label start]
  BRANCH,          // [branch end]
  DIALOGUE_RUBY,   // [#魔力:マナ]
  DIALOGUE_GENDER, // [&男:女]
}
```
