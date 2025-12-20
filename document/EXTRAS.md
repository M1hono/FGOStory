# 扩展功能完整设计

> **版本**: 2.0  
> **最后更新**: 2024-12-20  
> **状态**: 设计中
>
> 本文档涵盖：剧情索引、NPC 数据、特效系统、主题切换、CN 映射、音频系统、VitePress 集成

---

## 目录

1. [剧情索引系统](#一剧情索引系统)
2. [NPC 与特殊角色](#二npc-与特殊角色)
3. [特效系统](#三特效系统)
4. [音频系统](#四音频系统)
5. [主题与语言切换](#五主题与语言切换)
6. [CN 审查映射](#六cn-审查映射)
7. [VitePress 集成](#七vitepress-集成)
8. [URL 与导航](#八url-与导航)
9. [数据缓存](#九数据缓存)
10. [测试用例](#十测试用例)

---

## 一、剧情索引系统

### 1.1 页面结构

| 页面 | 路径 | 内容 |
|------|------|------|
| 主线 | `/` (Hero) | 第一部 / 1.5部 / 第二部 |
| 活动 | `/events` | 按年份/类型分类 |
| 幕间 | `/interludes` | 按职介/星级筛选 |

### 1.2 主线分类

```typescript
interface MainStoryPart {
  id: 'part1' | 'part1.5' | 'part2'
  name: string
  nameJp: string
  wars: War[]
}

const MAIN_STORY_PARTS = {
  part1: {
    range: [100, 108],
    name: '第一部',
    nameJp: '第一部'
  },
  'part1.5': {
    range: [109, 112],
    name: '1.5部',
    nameJp: 'Epic of Remnant'
  },
  part2: {
    range: [200, 299],
    name: '第二部',
    nameJp: 'Cosmos in the Lostbelt'
  }
}

/** 分类主线章节 */
function classifyMainStory(wars: War[]): MainStoryPart[] {
  return Object.entries(MAIN_STORY_PARTS).map(([id, config]) => ({
    id: id as MainStoryPart['id'],
    name: config.name,
    nameJp: config.nameJp,
    wars: wars.filter(w => w.id >= config.range[0] && w.id <= config.range[1])
      .sort((a, b) => a.id - b.id)
  }))
}
```

### 1.3 主线 Hero Page 组件

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AtlasApiService } from '../services/atlas-api'

interface MainStoryPart {
  id: string
  name: string
  wars: War[]
}

const api = new AtlasApiService('JP')
const parts = ref<MainStoryPart[]>([])
const loading = ref(true)
const selectedPart = ref<string>('part1')

onMounted(async () => {
  const wars = await api.getMainStoryWars()
  parts.value = classifyMainStory(wars)
  loading.value = false
})

function getBannerUrl(war: War): string {
  return `https://static.atlasacademy.io/JP/Banner/banner_war${war.id}.png`
}
</script>

<template>
  <div class="main-story-page">
    <h1>Fate/Grand Order Story</h1>
    
    <!-- 部分选择器 -->
    <div class="part-selector">
      <button 
        v-for="part in parts" 
        :key="part.id"
        :class="{ active: selectedPart === part.id }"
        @click="selectedPart = part.id"
      >
        {{ part.name }}
      </button>
    </div>
    
    <!-- 章节列表 -->
    <div class="wars-grid">
      <div 
        v-for="war in parts.find(p => p.id === selectedPart)?.wars"
        :key="war.id"
        class="war-card"
      >
        <img :src="getBannerUrl(war)" :alt="war.name" />
        <div class="war-info">
          <h3>{{ war.longName }}</h3>
          <p>{{ war.name }}</p>
        </div>
        <router-link :to="`/story/${war.id}`" class="war-link">
          開始
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-story-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.part-selector {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.part-selector button {
  padding: 12px 24px;
  border: 2px solid var(--fgo-gold);
  background: transparent;
  color: var(--fgo-gold);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.part-selector button.active {
  background: var(--fgo-gold);
  color: #000;
}

.wars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.war-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--fgo-dark);
  transition: transform 0.3s;
}

.war-card:hover {
  transform: translateY(-4px);
}

.war-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.war-info {
  padding: 16px;
}

.war-info h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.war-link {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 8px 16px;
  background: var(--fgo-gold);
  color: #000;
  border-radius: 4px;
  text-decoration: none;
}
</style>
```

### 1.4 活动分类 (多语言支持)

```typescript
interface EventCategory {
  year: number
  events: Event[]
}

interface EventTypeGroup {
  type: EventType
  label: string
  events: Event[]
}

type EventType = 
  | 'collaboration'   // 联动
  | 'seasonal'        // 季节性
  | 'campaign'        // 纪念
  | 'story'           // 剧情
  | 'rerun'           // 复刻

// 多语言标签配置
const EVENT_TYPE_LABELS: Record<string, Record<EventType, string>> = {
  'zh-CN': {
    collaboration: '联动活动',
    seasonal: '季节活动',
    campaign: '纪念活动',
    story: '剧情活动',
    rerun: '复刻活动'
  },
  'en-US': {
    collaboration: 'Collaboration',
    seasonal: 'Seasonal',
    campaign: 'Campaign',
    story: 'Story Event',
    rerun: 'Rerun'
  },
  'ja': {
    collaboration: 'コラボレーション',
    seasonal: 'シーズナル',
    campaign: 'キャンペーン',
    story: 'ストーリー',
    rerun: '復刻'
  }
}

// 多语言关键词检测
const EVENT_KEYWORDS: Record<EventType, string[]> = {
  collaboration: [
    // 日语
    'コラボ', 'コラボレーション',
    // 英语
    'collaboration', 'collab', 'crossover',
    // 中文
    '联动', '合作'
  ],
  seasonal: [
    // 日语
    'サマー', 'クリスマス', 'バレンタイン', 'ハロウィン', '正月', 'お月見',
    // 英语
    'summer', 'christmas', 'valentine', 'halloween', 'new year', 'moon',
    // 中文
    '夏日', '夏季', '圣诞', '情人节', '万圣节', '新年', '春节'
  ],
  rerun: [
    // 日语
    '復刻', 'リバイバル',
    // 英语
    'rerun', 'revival', 're-run',
    // 中文
    '复刻', '重开'
  ],
  campaign: [
    // 日语
    '周年', 'キャンペーン', '記念',
    // 英语
    'anniversary', 'campaign', 'celebration', 'memorial',
    // 中文
    '周年', '纪念', '庆典'
  ],
  story: []  // 默认类型
}

/** 按年份分组 */
function groupEventsByYear(events: Event[]): EventCategory[] {
  const groups = new Map<number, Event[]>()
  
  events.forEach(event => {
    const year = new Date(event.startedAt * 1000).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(event)
  })
  
  return Array.from(groups.entries())
    .map(([year, events]) => ({ year, events }))
    .sort((a, b) => b.year - a.year)
}

/** 按类型分组 (支持多语言) */
function groupEventsByType(events: Event[], locale: string = 'zh-CN'): EventTypeGroup[] {
  const groups = new Map<EventType, Event[]>()
  const labels = EVENT_TYPE_LABELS[locale] || EVENT_TYPE_LABELS['zh-CN']
  
  events.forEach(event => {
    const type = detectEventType(event)
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type)!.push(event)
  })
  
  return Array.from(groups.entries())
    .map(([type, events]) => ({
      type,
      label: labels[type],
      events
    }))
}

/** 检测活动类型 (多语言关键词) */
function detectEventType(event: Event): EventType {
  const name = event.name.toLowerCase()
  
  for (const [type, keywords] of Object.entries(EVENT_KEYWORDS)) {
    if (type === 'story') continue  // 跳过默认类型
    
    for (const keyword of keywords as string[]) {
      if (name.includes(keyword.toLowerCase())) {
        return type as EventType
      }
    }
  }
  
  return 'story'
}

// 测试用例
describe('Event Classification', () => {
  const testCases = [
    { name: '空の境界コラボ', expected: 'collaboration' },
    { name: 'Fate/Zero Collaboration', expected: 'collaboration' },
    { name: '空之境界联动', expected: 'collaboration' },
    { name: 'サマーイベント', expected: 'seasonal' },
    { name: 'Summer Event', expected: 'seasonal' },
    { name: '夏日祭典', expected: 'seasonal' },
    { name: '復刻版', expected: 'rerun' },
    { name: 'Event Rerun', expected: 'rerun' },
    { name: '5周年記念', expected: 'campaign' },
    { name: '5th Anniversary', expected: 'campaign' },
    { name: '普通のイベント', expected: 'story' }
  ]
  
  testCases.forEach(({ name, expected }) => {
    test(`${name} should be ${expected}`, () => {
      expect(detectEventType({ name } as Event)).toBe(expected)
    })
  })
})
```

### 1.5 活动页面组件

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type ViewMode = 'year' | 'type'

const events = ref<Event[]>([])
const viewMode = ref<ViewMode>('year')
const loading = ref(true)

const eventsByYear = computed(() => groupEventsByYear(events.value))
const eventsByType = computed(() => groupEventsByType(events.value))

onMounted(async () => {
  const api = new AtlasApiService('JP')
  const wars = await api.getEventWars()
  
  // 从战争中提取活动
  events.value = await Promise.all(
    wars.map(async war => {
      try {
        const event = await api.getEvent(war.eventId)
        return event
      } catch {
        return null
      }
    })
  ).then(results => results.filter(Boolean) as Event[])
  
  loading.value = false
})
</script>

<template>
  <div class="events-page">
    <h1>活動剧情</h1>
    
    <!-- 视图切换 -->
    <div class="view-toggle">
      <button :class="{ active: viewMode === 'year' }" @click="viewMode = 'year'">
        按年份
      </button>
      <button :class="{ active: viewMode === 'type' }" @click="viewMode = 'type'">
        按类型
      </button>
    </div>
    
    <!-- 年份视图 -->
    <template v-if="viewMode === 'year'">
      <div v-for="category in eventsByYear" :key="category.year" class="year-section">
        <h2>{{ category.year }}年</h2>
        <div class="events-grid">
          <EventCard v-for="event in category.events" :key="event.id" :event="event" />
        </div>
      </div>
    </template>
    
    <!-- 类型视图 -->
    <template v-if="viewMode === 'type'">
      <div v-for="group in eventsByType" :key="group.type" class="type-section">
        <h2>{{ group.label }}</h2>
        <div class="events-grid">
          <EventCard v-for="event in group.events" :key="event.id" :event="event" />
        </div>
      </div>
    </template>
  </div>
</template>
```

### 1.6 幕间筛选

```typescript
interface InterludeFilter {
  className?: ClassName
  rarity?: number[]
  search?: string
}

type ClassName = 
  | 'saber' | 'archer' | 'lancer' 
  | 'rider' | 'caster' | 'assassin' | 'berserker'
  | 'extra'  // 特殊职介集合

const CLASS_ICONS: Record<ClassName, string> = {
  saber: '/icons/class_saber.png',
  archer: '/icons/class_archer.png',
  lancer: '/icons/class_lancer.png',
  rider: '/icons/class_rider.png',
  caster: '/icons/class_caster.png',
  assassin: '/icons/class_assassin.png',
  berserker: '/icons/class_berserker.png',
  extra: '/icons/class_extra.png'
}

const EXTRA_CLASSES = ['ruler', 'avenger', 'moonCancer', 'alterEgo', 'foreigner', 'pretender', 'beast']

/** 获取从者幕间 */
async function getServantInterludes(api: AtlasApiService, servantId: number): Promise<Quest[]> {
  const servants = await api.getServants()
  const servant = servants.find(s => s.id === servantId)
  
  if (!servant) return []
  
  const interludes: Quest[] = []
  
  for (const questId of servant.relateQuestIds) {
    try {
      const quest = await api.getQuest(questId)
      if (quest.type === 'friendship') {
        interludes.push(quest)
      }
    } catch {
      // 忽略无法获取的任务
    }
  }
  
  return interludes
}

/** 筛选从者 */
function filterServants(servants: Servant[], filter: InterludeFilter): Servant[] {
  return servants.filter(servant => {
    // 职介筛选
    if (filter.className) {
      if (filter.className === 'extra') {
        if (!EXTRA_CLASSES.includes(servant.className)) return false
      } else {
        if (servant.className !== filter.className) return false
      }
    }
    
    // 星级筛选
    if (filter.rarity && filter.rarity.length > 0) {
      if (!filter.rarity.includes(servant.rarity)) return false
    }
    
    // 搜索
    if (filter.search) {
      const search = filter.search.toLowerCase()
      if (!servant.name.toLowerCase().includes(search)) return false
    }
    
    // 必须有幕间
    if (servant.relateQuestIds.length === 0) return false
    
    return true
  })
}
```

### 1.7 幕间页面组件

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface InterludeFilter {
  className?: ClassName
  rarity: number[]
  search: string
}

const servants = ref<Servant[]>([])
const filter = ref<InterludeFilter>({
  className: undefined,
  rarity: [],
  search: ''
})
const loading = ref(true)

const filteredServants = computed(() => filterServants(servants.value, filter.value))

const groupedByClass = computed(() => {
  const groups = new Map<ClassName, Servant[]>()
  
  filteredServants.value.forEach(servant => {
    const cls = EXTRA_CLASSES.includes(servant.className) ? 'extra' : servant.className as ClassName
    if (!groups.has(cls)) groups.set(cls, [])
    groups.get(cls)!.push(servant)
  })
  
  return groups
})

onMounted(async () => {
  const api = new AtlasApiService('JP')
  servants.value = await api.getServants()
  // 只保留有幕间的从者
  servants.value = servants.value.filter(s => s.relateQuestIds.length > 0)
  loading.value = false
})

const rarityOptions = [5, 4, 3, 2, 1]
</script>

<template>
  <div class="interludes-page">
    <h1>幕間物語</h1>
    
    <!-- 筛选器 -->
    <div class="filter-panel">
      <!-- 职介筛选 -->
      <div class="filter-section">
        <h3>職介</h3>
        <div class="class-icons">
          <button 
            v-for="(icon, cls) in CLASS_ICONS" 
            :key="cls"
            :class="{ active: filter.className === cls }"
            @click="filter.className = filter.className === cls ? undefined : cls"
          >
            <img :src="icon" :alt="cls" />
          </button>
        </div>
      </div>
      
      <!-- 星级筛选 -->
      <div class="filter-section">
        <h3>星级</h3>
        <div class="rarity-buttons">
          <button 
            v-for="r in rarityOptions" 
            :key="r"
            :class="{ active: filter.rarity.includes(r) }"
            @click="toggleRarity(r)"
          >
            {{ '★'.repeat(r) }}
          </button>
        </div>
      </div>
      
      <!-- 搜索 -->
      <div class="filter-section">
        <h3>搜索</h3>
        <input 
          v-model="filter.search" 
          type="text" 
          placeholder="从者名称..."
        />
      </div>
    </div>
    
    <!-- 结果 -->
    <div class="results">
      <div v-for="[cls, list] in groupedByClass" :key="cls" class="class-section">
        <h2>
          <img :src="CLASS_ICONS[cls]" :alt="cls" />
          {{ CLASS_NAMES[cls] }}
          <span class="count">({{ list.length }})</span>
        </h2>
        
        <div class="servants-grid">
          <ServantCard 
            v-for="servant in list" 
            :key="servant.id" 
            :servant="servant"
          />
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 二、NPC 与特殊角色

### 2.1 NPC ID 规则

| ID 范围 | 类型 | 示例 |
|---------|------|------|
| `1xx0xxx` - `4xx0xxx` | 从者 (灵基) | `1001000` |
| `1xx0xxx1` - `1xx0xxx3` | 从者 (第2-4灵基) | `1001001` |
| `1xx1xxx` - `1xx9xxx` | 灵衣 | `1001300` |
| `8001xxx` | 玛修 (战斗) | `8001000` |
| `98xxxxxx` | 剧情 NPC | `98001000` |
| `9xxxxxxx` | 敌人 | - |

### 2.2 常见剧情 NPC

```typescript
const STORY_NPCS: Record<string, NpcInfo> = {
  '98001000': { name: 'マシュ', nameZh: '玛修 (便服)', role: 'ally' },
  '98001010': { name: 'マシュ', nameZh: '玛修 (制服)', role: 'ally' },
  '98002000': { name: 'フォウ', nameZh: '芙芙', role: 'mascot' },
  '98003000': { name: 'Dr.ロマン', nameZh: '罗曼尼', role: 'ally' },
  '98003003': { name: 'Dr.ロマン', nameZh: '罗曼尼 (通信)', role: 'ally' },
  '98004000': { name: 'ダ・ヴィンチ', nameZh: '达芬奇', role: 'ally' },
  '98005000': { name: 'オルガマリー', nameZh: '奥尔加玛丽', role: 'ally' },
  '98006000': { name: 'アナウンス', nameZh: '播报', role: 'system' },
  '98007000': { name: 'ゴルドルフ', nameZh: '戈尔德鲁夫', role: 'ally' },
  '98008000': { name: 'ホームズ', nameZh: '福尔摩斯', role: 'ally' },
}
```

### 2.3 NPC 数据获取

```typescript
interface NpcData {
  charaGraphId: string
  name: string
  imageUrl: string
  faceUrl: string
  svtScript: SvtScript | null
}

class NpcDataService {
  private api: AtlasApiService
  private cache = new Map<string, NpcData>()
  
  constructor(region: string = 'JP') {
    this.api = new AtlasApiService(region)
  }
  
  /** 获取 NPC 数据 */
  async getNpcData(charaGraphId: string): Promise<NpcData | null> {
    // 检查缓存
    if (this.cache.has(charaGraphId)) {
      return this.cache.get(charaGraphId)!
    }
    
    // 构建 URL
    const imageUrl = `https://static.atlasacademy.io/${this.api.region}/CharaFigure/${charaGraphId}/${charaGraphId}_merged.png`
    const faceUrl = `https://static.atlasacademy.io/${this.api.region}/Faces/f_${charaGraphId}0.png`
    
    // 验证图片存在
    const imageExists = await this.validateUrl(imageUrl)
    if (!imageExists) return null
    
    // 获取渲染参数
    const svtScript = await this.api.getSvtScript(charaGraphId)
    
    // 获取名称
    const name = STORY_NPCS[charaGraphId]?.name ?? '???'
    
    const data: NpcData = {
      charaGraphId,
      name,
      imageUrl,
      faceUrl,
      svtScript
    }
    
    this.cache.set(charaGraphId, data)
    return data
  }
  
  /** 从完整从者数据中提取 NPC */
  async getAllNpcs(): Promise<NpcData[]> {
    const url = `https://api.atlasacademy.io/export/${this.api.region}/nice_servant.json`
    const servants = await fetch(url).then(r => r.json())
    
    const npcs: NpcData[] = []
    
    for (const servant of servants) {
      // 提取所有 charaGraphId
      const charaGraphIds = new Set<string>()
      
      // 灵基
      if (servant.extraAssets?.charaFigure?.ascension) {
        Object.keys(servant.extraAssets.charaFigure.ascension).forEach(id => {
          charaGraphIds.add(id)
        })
      }
      
      // 剧情
      if (servant.extraAssets?.charaFigure?.story) {
        Object.keys(servant.extraAssets.charaFigure.story).forEach(id => {
          charaGraphIds.add(id)
        })
      }
      
      // 处理每个 charaGraphId
      for (const id of charaGraphIds) {
        const npc = await this.getNpcData(id)
        if (npc) npcs.push(npc)
      }
    }
    
    return npcs
  }
  
  private async validateUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }
}
```

---

## 三、特效系统

### 3.1 特效类型

| 类型 | 脚本指令 | 效果 |
|------|---------|------|
| 淡入淡出 | `[fadein]` `[fadeout]` | 黑/白屏过渡 |
| 闪光 | `[flashin]` | 瞬间亮屏 |
| 擦除 | `[wipeFilter]` | 圆形/滑动过渡 |
| 角色阴影 | `[charaFilter shadow]` | 角色黑化 |
| 震动 | `[charaShake]` | 角色/场景震动 |

### 3.2 特效资源

```typescript
const EFFECT_BASE_URL = 'https://static.atlasacademy.io/file/aa-fgo-decrypt-{region}/Effect'

interface EffectAsset {
  id: string
  url: string
  type: 'image' | 'video' | 'spine'
}

const TALK_EFFECTS: Record<string, EffectAsset> = {
  'bit_talk_01': {
    id: 'bit_talk_01',
    url: `${EFFECT_BASE_URL}/Talk/bit_talk_01`,
    type: 'image'
  },
  'bit_talk_06': {
    id: 'bit_talk_06',
    url: `${EFFECT_BASE_URL}/Talk/bit_talk_06`,
    type: 'image'
  }
}
```

### 3.3 淡入淡出实现

```typescript
interface FadeState {
  type: 'in' | 'out' | 'none'
  color: string
  duration: number
  progress: number
}

class FadeManager {
  private state: FadeState = {
    type: 'none',
    color: 'black',
    duration: 0,
    progress: 0
  }
  
  private animationId: number | null = null
  private onUpdate: (state: FadeState) => void
  
  constructor(onUpdate: (state: FadeState) => void) {
    this.onUpdate = onUpdate
  }
  
  fadeIn(color: string, duration: number): Promise<void> {
    return new Promise(resolve => {
      this.state = {
        type: 'in',
        color,
        duration,
        progress: 0
      }
      
      const startTime = performance.now()
      
      const animate = (time: number) => {
        const elapsed = time - startTime
        this.state.progress = Math.min(elapsed / (duration * 1000), 1)
        this.onUpdate(this.state)
        
        if (this.state.progress < 1) {
          this.animationId = requestAnimationFrame(animate)
        } else {
          this.state.type = 'none'
          resolve()
        }
      }
      
      this.animationId = requestAnimationFrame(animate)
    })
  }
  
  fadeOut(color: string, duration: number): Promise<void> {
    return new Promise(resolve => {
      this.state = {
        type: 'out',
        color,
        duration,
        progress: 0
      }
      
      const startTime = performance.now()
      
      const animate = (time: number) => {
        const elapsed = time - startTime
        this.state.progress = Math.min(elapsed / (duration * 1000), 1)
        this.onUpdate(this.state)
        
        if (this.state.progress < 1) {
          this.animationId = requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      this.animationId = requestAnimationFrame(animate)
    })
  }
  
  cancel() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}
```

### 3.4 淡入淡出 Vue 组件

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  fadeState: FadeState
}

const props = defineProps<Props>()

const overlayStyle = computed(() => {
  if (props.fadeState.type === 'none') {
    return { display: 'none' }
  }
  
  const opacity = props.fadeState.type === 'in'
    ? 1 - props.fadeState.progress
    : props.fadeState.progress
  
  return {
    backgroundColor: props.fadeState.color,
    opacity
  }
})
</script>

<template>
  <div class="fade-overlay" :style="overlayStyle" />
</template>

<style scoped>
.fade-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}
</style>
```

### 3.5 角色滤镜实现

```css
/* 正常状态 */
.character-wrapper.normal {
  filter: none;
}

/* 阴影效果 */
.character-wrapper.shadow {
  filter: brightness(0) saturate(0);
}

/* 剪影效果 */
.character-wrapper.silhouette {
  filter: brightness(0.2) saturate(0.3);
}

/* 暗淡效果 (非活跃) */
.character-wrapper.inactive {
  filter: brightness(0.4) saturate(0.5);
}

/* 高亮效果 (活跃) */
.character-wrapper.active {
  filter: brightness(1.05) drop-shadow(0 0 20px rgba(0, 0, 0, 0.6));
}
```

---

## 四、音频系统

### 4.1 音频类型

| 类型 | 特点 | 示例 |
|------|------|------|
| BGM | 循环播放，可淡入淡出 | BGM_EVENT_01 |
| SE | 单次播放 | ad1, ba_sword |
| Voice | 单次播放，对话语音 | 100100_battle_001 |

### 4.2 音频 URL 构建

```typescript
const AUDIO_BASE = 'https://assets.atlasacademy.io/GameData'

interface AudioUrls {
  getBgmUrl(region: string, bgmId: string): string
  getSeUrl(region: string, seId: string): string
  getVoiceUrl(region: string, servantId: number, voiceId: string): string
}

const audioUrls: AudioUrls = {
  getBgmUrl(region, bgmId) {
    return `${AUDIO_BASE}/${region}/Audio/${bgmId}/${bgmId}.mp3`
  },
  
  getSeUrl(region, seId) {
    const prefix = seId.slice(0, 2)
    const folderMap: Record<string, string> = {
      'ba': 'Battle',
      'ad': 'SE',
      'ar': 'ResidentSE',
      '21': 'SE_21'
    }
    const folder = folderMap[prefix] ?? 'SE'
    return `${AUDIO_BASE}/${region}/Audio/${folder}/${seId}.mp3`
  },
  
  getVoiceUrl(region, servantId, voiceId) {
    return `${AUDIO_BASE}/${region}/Audio/Servants_${servantId}/${voiceId}.mp3`
  }
}
```

### 4.3 音频管理器

```typescript
interface AudioManager {
  // BGM
  playBgm(url: string, volume?: number, fadein?: number): void
  stopBgm(fadeout?: number): void
  setBgmVolume(volume: number): void
  
  // SE
  playSe(url: string): void
  
  // Voice
  playVoice(url: string): void
  stopVoice(): void
  
  // 静音控制
  muteBgm(muted: boolean): void
  muteSe(muted: boolean): void
  muteVoice(muted: boolean): void
  
  // 状态
  isBgmPlaying(): boolean
  isVoicePlaying(): boolean
}

class AudioManagerImpl implements AudioManager {
  private bgm: HTMLAudioElement | null = null
  private voice: HTMLAudioElement | null = null
  private bgmMuted = false
  private seMuted = false
  private voiceMuted = false
  private bgmVolume = 1
  
  playBgm(url: string, volume = 1, fadein = 0) {
    this.stopBgm(0)
    
    this.bgm = new Audio(url)
    this.bgm.loop = true
    this.bgmVolume = volume
    
    if (fadein > 0) {
      this.bgm.volume = 0
      this.bgm.play()
      this.fadeAudioIn(this.bgm, volume, fadein)
    } else {
      this.bgm.volume = this.bgmMuted ? 0 : volume
      this.bgm.play()
    }
  }
  
  stopBgm(fadeout = 0) {
    if (!this.bgm) return
    
    if (fadeout > 0) {
      this.fadeAudioOut(this.bgm, fadeout).then(() => {
        this.bgm?.pause()
        this.bgm = null
      })
    } else {
      this.bgm.pause()
      this.bgm = null
    }
  }
  
  setBgmVolume(volume: number) {
    this.bgmVolume = volume
    if (this.bgm && !this.bgmMuted) {
      this.bgm.volume = volume
    }
  }
  
  playSe(url: string) {
    if (this.seMuted) return
    
    const audio = new Audio(url)
    audio.play()
  }
  
  playVoice(url: string) {
    this.stopVoice()
    if (this.voiceMuted) return
    
    this.voice = new Audio(url)
    this.voice.play()
  }
  
  stopVoice() {
    if (this.voice) {
      this.voice.pause()
      this.voice = null
    }
  }
  
  muteBgm(muted: boolean) {
    this.bgmMuted = muted
    if (this.bgm) {
      this.bgm.volume = muted ? 0 : this.bgmVolume
    }
  }
  
  muteSe(muted: boolean) {
    this.seMuted = muted
  }
  
  muteVoice(muted: boolean) {
    this.voiceMuted = muted
    if (muted) this.stopVoice()
  }
  
  isBgmPlaying(): boolean {
    return this.bgm !== null && !this.bgm.paused
  }
  
  isVoicePlaying(): boolean {
    return this.voice !== null && !this.voice.paused
  }
  
  private fadeAudioIn(audio: HTMLAudioElement, targetVolume: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const steps = duration * 60
      const step = targetVolume / steps
      let current = 0
      
      const interval = setInterval(() => {
        current += step
        if (current >= targetVolume) {
          audio.volume = targetVolume
          clearInterval(interval)
          resolve()
        } else {
          audio.volume = current
        }
      }, 1000 / 60)
    })
  }
  
  private fadeAudioOut(audio: HTMLAudioElement, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startVolume = audio.volume
      const steps = duration * 60
      const step = startVolume / steps
      
      const interval = setInterval(() => {
        if (audio.volume <= step) {
          audio.volume = 0
          clearInterval(interval)
          resolve()
        } else {
          audio.volume -= step
        }
      }, 1000 / 60)
    })
  }
}

// 单例
export const audioManager = new AudioManagerImpl()
```

### 4.4 音频控制组件

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  bgmPlaying?: boolean
}

interface Emits {
  (e: 'toggleBgm', muted: boolean): void
  (e: 'toggleSe', muted: boolean): void
  (e: 'toggleVoice', muted: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bgmMuted = ref(false)
const seMuted = ref(false)
const voiceMuted = ref(false)

function toggleBgm() {
  bgmMuted.value = !bgmMuted.value
  emit('toggleBgm', bgmMuted.value)
}

function toggleSe() {
  seMuted.value = !seMuted.value
  emit('toggleSe', seMuted.value)
}

function toggleVoice() {
  voiceMuted.value = !voiceMuted.value
  emit('toggleVoice', voiceMuted.value)
}
</script>

<template>
  <div class="audio-controls">
    <button 
      class="audio-btn"
      :class="{ muted: bgmMuted, playing: bgmPlaying && !bgmMuted }"
      @click.stop="toggleBgm"
      title="BGM"
    >
      🎵
    </button>
    
    <button 
      class="audio-btn"
      :class="{ muted: seMuted }"
      @click.stop="toggleSe"
      title="音效"
    >
      🔊
    </button>
    
    <button 
      class="audio-btn"
      :class="{ muted: voiceMuted }"
      @click.stop="toggleVoice"
      title="语音"
    >
      🎙️
    </button>
  </div>
</template>
```

---

## 五、主题与语言切换

### 5.1 VitePress 主题切换

```typescript
// composables/useTheme.ts
import { useData } from 'vitepress'

export function useTheme() {
  const { isDark } = useData()
  
  function toggleTheme() {
    isDark.value = !isDark.value
  }
  
  function setTheme(dark: boolean) {
    isDark.value = dark
  }
  
  return {
    isDark,
    toggleTheme,
    setTheme
  }
}
```

### 5.2 主题样式

```css
/* FGO 暗色主题 (默认) */
:root {
  --fgo-bg: #08080a;
  --fgo-text: #ffffff;
  --fgo-gold: #c9a227;
  --fgo-blue: #4a8abf;
}

/* FGO 亮色主题 */
:root.light {
  --fgo-bg: #f5f5f5;
  --fgo-text: #1a1a1a;
  --fgo-gold: #b8941e;
  --fgo-blue: #3a7aaf;
}
```

### 5.3 多语言配置

```typescript
// .vitepress/config.ts
export default {
  locales: {
    root: {
      label: '日本語',
      lang: 'ja',
      link: '/'
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh-CN/'
    },
    'zh-TW': {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh-TW/'
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/'
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      link: '/ko/'
    }
  }
}
```

### 5.4 语言与 Region 映射

```typescript
const LANG_TO_REGION: Record<string, string> = {
  'ja': 'JP',
  'zh-CN': 'CN',
  'zh-TW': 'TW',
  'en': 'NA',
  'ko': 'KR'
}

export function useRegion() {
  const { lang } = useData()
  
  const region = computed(() => LANG_TO_REGION[lang.value] ?? 'JP')
  
  return { region }
}
```

---

## 六、CN 审查映射

### 6.1 映射数据

```json
{
  "servants": {
    "荆轲": ["暗匿者042", "匕见"],
    "吕布奉先": ["狂战士049", "虎狼"],
    "始皇帝": ["统治者227", "政"],
    "武则天": ["暗匿者174", "周帝"],
    "杨贵妃": ["降临者268", "玉环"],
    "虞美人": ["暗匿者209", "虞"],
    "西王母": ["术者322", "瑶姬"],
    "项羽": ["狂战士226", "籍"]
  },
  "terms": {
    "暗杀": ["暗匿"],
    "杀": ["击", "败"],
    "血": ["红色液体"],
    "死亡": ["消逝", "离去"],
    "暗杀者": ["暗匿者"]
  }
}
```

### 6.2 反向映射服务

```typescript
interface CnMapping {
  servants: Record<string, string[]>
  terms: Record<string, string[]>
}

class CnMappingService {
  private reverseMap = new Map<string, string>()
  
  constructor(mapping: CnMapping) {
    // 构建反向映射
    Object.entries(mapping.servants).forEach(([trueName, aliases]) => {
      aliases.forEach(alias => {
        this.reverseMap.set(alias, trueName)
      })
    })
    
    Object.entries(mapping.terms).forEach(([original, aliases]) => {
      aliases.forEach(alias => {
        this.reverseMap.set(alias, original)
      })
    })
  }
  
  /** 将审查名称映射回原名 */
  mapToOriginal(text: string): string {
    let result = text
    
    // 按长度排序，优先替换长的
    const sortedAliases = Array.from(this.reverseMap.keys())
      .sort((a, b) => b.length - a.length)
    
    for (const alias of sortedAliases) {
      const original = this.reverseMap.get(alias)!
      result = result.replaceAll(alias, original)
    }
    
    return result
  }
  
  /** 检查文本是否包含审查名称 */
  containsCensoredName(text: string): boolean {
    for (const alias of this.reverseMap.keys()) {
      if (text.includes(alias)) return true
    }
    return false
  }
}

// 使用
const cnMapping = new CnMappingService(mappingData)
const originalText = cnMapping.mapToOriginal('暗匿者042说：我要暗匿你')
// → "荆轲说：我要暗杀你"
```

---

## 七、VitePress 集成

### 7.0 现有脚本工具 (重要!)

项目 `.vitepress/scripts/` 目录包含多个实用工具：

| 脚本 | 命令 | 功能 |
|------|------|------|
| `build-sidebar.mjs` | `npm run sidebar` | 自动生成多语言侧边栏 |
| `create-indexes.mjs` | `npm run index -- -p zh` | 创建目录 index.md 文件 |
| `generate-tag-data.mjs` | `npm run tags` | 生成标签数据 |
| `locale-key-sync.mjs` | `npm run i18n` | 同步组件翻译 key |
| `update-frontmatter.mjs` | - | 更新 frontmatter |

#### 使用 i18n 同步脚本

```bash
# 同步所有使用 useSafeI18n 的组件翻译
npm run i18n

# 输出示例:
# 🔍 Processing script for: DialogueControls.vue
#    ✅ Successfully extracted script: DialogueControls.vue
# 🔄 Processing DialogueControls.vue (3 keys)
#    📋 Found componentId: "story/StoryReader" -> "..."
```

#### i18n 系统使用方式

```typescript
// 在组件中使用 i18n
import { useSafeI18n } from '../../.vitepress/utils/i18n/locale'

const { t } = useSafeI18n('story/StoryReader', {
  loading: '加载中...',
  error: '发生错误',
  copySuccess: '复制成功'
})

// 在模板中使用
// <span>{{ t.loading }}</span>
```

#### 侧边栏自动生成

```bash
npm run sidebar

# 会扫描 src/ 目录并生成:
# .vitepress/cache/sidebar/zh.json
# .vitepress/cache/sidebar/en.json
```

### 7.1 自定义布局

```typescript
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import StoryLayout from './StoryLayout.vue'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  Layout: StoryLayout,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('StoryPlayer', StoryPlayer)
    app.component('DialogueBox', DialogueBox)
  }
} satisfies Theme
```

### 7.2 动态路由

```typescript
// .vitepress/config.ts
export default {
  rewrites: {
    'story/:warId/:questId': 'story/[warId]/[questId].vue'
  }
}

// story/[warId]/[questId].vue
<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()
const warId = computed(() => Number(route.params.warId))
const questId = computed(() => Number(route.params.questId))
</script>
```

### 7.3 侧边栏配置

```typescript
// .vitepress/config.ts
export default {
  themeConfig: {
    sidebar: {
      '/story/': [
        {
          text: '第一部',
          items: [
            { text: '序章 - 特异点F', link: '/story/100' },
            { text: '第一特异点 - 邪龙百年战争', link: '/story/101' },
            // ...
          ]
        }
      ]
    }
  }
}
```

---

## 八、URL 与导航

### 8.1 URL 结构

```
/story/{warId}/{questId}#scene-{index}

示例:
/story/100/1000001#scene-15   → 主线序章第15个场景
/events/80001#scene-3         → 活动剧情第3个场景
/interludes/100100#scene-0    → 阿尔托莉雅幕间开头
```

### 8.2 URL 同步

```typescript
function useUrlSync(player: StoryPlayer) {
  // 初始化时从 URL 读取
  onMounted(() => {
    const hash = window.location.hash
    if (hash.startsWith('#scene-')) {
      const index = parseInt(hash.slice(7))
      if (!isNaN(index)) {
        player.goTo(index)
      }
    }
  })
  
  // 状态变化时更新 URL
  watch(() => player.currentIndex.value, (index) => {
    history.replaceState(null, '', `#scene-${index}`)
  })
}
```

### 8.3 分享功能

```typescript
function getShareUrl(warId: number, questId: number, sceneIndex: number): string {
  const base = window.location.origin
  return `${base}/story/${warId}/${questId}#scene-${sceneIndex}`
}

async function shareScene(warId: number, questId: number, sceneIndex: number) {
  const url = getShareUrl(warId, questId, sceneIndex)
  
  if (navigator.share) {
    await navigator.share({
      title: 'FGO Story',
      url
    })
  } else {
    await navigator.clipboard.writeText(url)
    alert('链接已复制')
  }
}
```

---

## 九、数据缓存

### 9.1 缓存策略

| 数据类型 | TTL | 存储位置 |
|----------|-----|----------|
| War 列表 | 24h | localStorage |
| Quest 详情 | 1h | Memory |
| Script 内容 | 7d | IndexedDB |
| SVT Script | 永久 | IndexedDB |
| 图片 | 浏览器 | HTTP Cache |

### 9.2 IndexedDB 封装

```typescript
class StoryCache {
  private dbName = 'fgo-story-cache'
  private db: IDBDatabase | null = null
  
  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Scripts
        if (!db.objectStoreNames.contains('scripts')) {
          db.createObjectStore('scripts', { keyPath: 'id' })
        }
        
        // SVT Scripts
        if (!db.objectStoreNames.contains('svtScripts')) {
          db.createObjectStore('svtScripts', { keyPath: 'id' })
        }
      }
    })
  }
  
  async getScript(scriptId: string): Promise<string | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('scripts', 'readonly')
      const store = tx.objectStore('scripts')
      const request = store.get(scriptId)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result && result.expires > Date.now()) {
          resolve(result.content)
        } else {
          resolve(null)
        }
      }
    })
  }
  
  async setScript(scriptId: string, content: string, ttl = 7 * 24 * 60 * 60 * 1000) {
    if (!this.db) await this.init()
    
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('scripts', 'readwrite')
      const store = tx.objectStore('scripts')
      
      const request = store.put({
        id: scriptId,
        content,
        expires: Date.now() + ttl
      })
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const storyCache = new StoryCache()
```

---

## 十、测试用例

### 10.1 剧情索引测试

```typescript
describe('Story Index', () => {
  test('Main story classification', () => {
    const wars = [
      { id: 100, name: '序章' },
      { id: 101, name: '第一章' },
      { id: 200, name: 'LB1' }
    ]
    
    const parts = classifyMainStory(wars)
    
    expect(parts).toHaveLength(3)
    expect(parts[0].id).toBe('part1')
    expect(parts[0].wars).toHaveLength(2)
    expect(parts[2].id).toBe('part2')
    expect(parts[2].wars).toHaveLength(1)
  })
  
  test('Event grouping by year', () => {
    const events = [
      { id: 1, startedAt: 1609459200 },  // 2021
      { id: 2, startedAt: 1640995200 },  // 2022
      { id: 3, startedAt: 1640995200 }   // 2022
    ]
    
    const grouped = groupEventsByYear(events)
    
    expect(grouped).toHaveLength(2)
    expect(grouped[0].year).toBe(2022)
    expect(grouped[0].events).toHaveLength(2)
  })
})
```

### 10.2 CN 映射测试

```typescript
describe('CN Mapping', () => {
  const mapping = new CnMappingService({
    servants: {
      '荆轲': ['暗匿者042', '匕见']
    },
    terms: {
      '暗杀': ['暗匿']
    }
  })
  
  test('Map servant name', () => {
    expect(mapping.mapToOriginal('暗匿者042')).toBe('荆轲')
    expect(mapping.mapToOriginal('匕见')).toBe('荆轲')
  })
  
  test('Map term', () => {
    expect(mapping.mapToOriginal('暗匿行动')).toBe('暗杀行动')
  })
  
  test('Mixed mapping', () => {
    const text = '暗匿者042发动暗匿'
    expect(mapping.mapToOriginal(text)).toBe('荆轲发动暗杀')
  })
})
```

### 10.3 音频测试

```typescript
describe('Audio Manager', () => {
  test('BGM playback', () => {
    const manager = new AudioManagerImpl()
    
    manager.playBgm('test.mp3')
    expect(manager.isBgmPlaying()).toBe(true)
    
    manager.stopBgm()
    expect(manager.isBgmPlaying()).toBe(false)
  })
  
  test('Mute control', () => {
    const manager = new AudioManagerImpl()
    
    manager.playBgm('test.mp3')
    manager.muteBgm(true)
    
    // BGM 仍在播放但静音
    expect(manager.isBgmPlaying()).toBe(true)
  })
})
```

---

*文档完*
