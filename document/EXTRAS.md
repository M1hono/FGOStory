# 扩展功能

> CN 审查映射、剧情索引、工具类、VitePress 集成

---

## 一、CN 审查映射

### 映射目标

**让中国用户看到历史人物真名，而非审查代号**

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

### 反向映射实现

```typescript
class CnMappingService {
  private reverseServantMap = new Map<string, string>()  // 审查名 → 真名
  private reverseTermMap = new Map<string, string>()     // 审查词 → 原词
  
  constructor(mapping: CnMapping) {
    // 构建反向索引
    Object.entries(mapping.servants).forEach(([trueName, aliases]) => {
      aliases.forEach(alias => this.reverseServantMap.set(alias, trueName))
    })
    Object.entries(mapping.terms).forEach(([original, aliases]) => {
      aliases.forEach(alias => this.reverseTermMap.set(alias, original))
    })
  }
  
  mapServantName(name: string): string {
    return this.reverseServantMap.get(name) || name
  }
  
  mapDialogueText(text: string): string {
    let result = text
    this.reverseServantMap.forEach((trueName, alias) => {
      result = result.replaceAll(alias, trueName)
    })
    this.reverseTermMap.forEach((original, alias) => {
      result = result.replaceAll(alias, original)
    })
    return result
  }
}
```

### Vue Composable

```typescript
export function useCnMapping() {
  const { locale } = useI18n()
  const isCn = computed(() => locale.value === 'zh-CN')
  
  const mapText = (text: string) => 
    isCn.value ? cnMapping.mapDialogueText(text) : text
  
  const mapName = (name: string) => 
    isCn.value ? cnMapping.mapServantName(name) : name
  
  return { mapText, mapName }
}
```

---

## 二、剧情索引设计

### 分类结构

```
剧情
├── 主线 (Main Story)
│   ├── 序章 - 特异点F 燃烧汚染都市 冬木
│   ├── 第一章 - 邪龍百年戦争 オルレアン
│   └── ...
├── 活动 (Events)
│   ├── 常驻活动
│   └── 限时活动
└── 幕间 (Interludes)
    ├── Saber
    ├── Archer
    └── ...
```

### War 数据结构

```typescript
interface War {
  id: number
  name: string
  longName: string
  banner: string
  quests: Quest[]
}

interface Quest {
  id: number
  name: string
  type: 'main' | 'free' | 'interlude'
  scripts: string[]
}
```

### 判断逻辑

```typescript
// 主线: warId 100-999
const isMainStory = (war: War) => war.id >= 100 && war.id < 1000

// 活动: eventId > 0
const isEvent = (war: War) => war.eventId > 0

// 幕间: quest.type === 'friendship'
const isInterlude = (quest: Quest) => quest.type === 'friendship'
```

---

## 三、路由设计

### URL 结构

```
/story/:warId/:questId?scene=:sceneIndex

示例:
/story/100/9100001?scene=5
```

### VitePress 动态路由

```typescript
// docs/.vitepress/config.ts
export default {
  rewrites: {
    'story/:warId/:questId.md': 'story/:warId/:questId/index.md'
  }
}
```

### 场景同步

```typescript
// URL Hash 同步
watch(currentSceneIndex, (index) => {
  window.location.hash = `scene-${index}`
})

onMounted(() => {
  const hash = window.location.hash
  if (hash.startsWith('#scene-')) {
    currentSceneIndex.value = parseInt(hash.slice(7))
  }
})
```

---

## 四、进度存储

### LocalStorage 结构

```typescript
interface StoryProgress {
  lastRead: {
    warId: number
    questId: number
    sceneIndex: number
    timestamp: number
  }
  completed: {
    [questId: number]: boolean
  }
  bookmarks: {
    id: string
    warId: number
    questId: number
    sceneIndex: number
    note?: string
    createdAt: number
  }[]
}
```

### Composable

```typescript
export function useStoryProgress() {
  const STORAGE_KEY = 'fgo-story-progress'
  
  const progress = ref<StoryProgress>(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  )
  
  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress.value))
  }
  
  const markAsRead = (warId: number, questId: number, sceneIndex: number) => {
    progress.value.lastRead = { warId, questId, sceneIndex, timestamp: Date.now() }
    saveProgress()
  }
  
  return { progress, markAsRead, saveProgress }
}
```

---

## 五、布局计算工具

### layout-calculator.ts

```typescript
interface LayoutConfig {
  baseWidth: 1024
  baseHeight: 626
  displayHeight: 768
  defaultFaceSize: 256
}

export function calculateCharacterLayout(
  char: CharacterState,
  stageWidth: number,
  config: LayoutConfig
): CharacterLayout {
  const scale = stageWidth / config.baseWidth * char.charScale
  
  const wrapperWidth = config.baseWidth * scale
  const wrapperHeight = config.displayHeight * scale
  const wrapperLeft = stageWidth * char.posX - wrapperWidth / 2
  
  return {
    wrapper: { width: wrapperWidth, height: wrapperHeight, left: wrapperLeft },
    figure: { backgroundSize: figureWidth * scale, left: figureLeft },
    faceData: calculateFaceData(char.face, scale, script)
  }
}

function calculateFaceData(face: number, scale: number, script: SvtScript) {
  if (face <= 0) return null
  
  const faceIndex = face - 1
  const faceSize = script.faceSize || 256
  const col = faceIndex % 4
  const row = Math.floor(faceIndex / 4)
  
  return {
    backgroundPositionX: -col * faceSize * scale,
    backgroundPositionY: -(768 + row * faceSize) * scale,
    width: faceSize * scale,
    height: faceSize * scale,
    left: script.faceX * scale,
    top: script.faceY * scale
  }
}
```

---

## 六、VitePress 集成

### 自定义布局

```typescript
// docs/.vitepress/theme/index.ts
import StoryLayout from './layouts/StoryLayout.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(StoryLayout)
    })
  }
}
```

### 全局组件注册

```typescript
enhanceApp({ app }) {
  app.component('StoryReader', StoryReader)
  app.component('DialogueBox', DialogueBox)
}
```

### 样式覆盖

```css
/* 隐藏 VitePress 默认元素 */
.story-layout .VPDoc,
.story-layout .VPDocAside {
  display: none;
}

/* 全屏占用 */
.story-layout .VPContent {
  padding: 0;
  max-width: none;
}
```

---

## 七、开发工具

### 布局编辑器

路径: `/playground/test-pages/layout-editor`

功能:
- 拖拽调整对话框元素
- 实时预览效果
- 导出配置 JSON

### 数据流测试

路径: `/playground/test-pages/full-data-flow-test`

功能:
- 验证 Atlas API 连接
- 显示章节/活动/角色数据
- 测试图片加载

### 脚本解析测试

路径: `/playground/test-pages/script-parser-test`

功能:
- 输入原始脚本
- 查看解析结果
- 调试 Token 流

