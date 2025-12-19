# FGO Story Reader 开发手册

> **版本**: 2.0  
> **最后更新**: 2024-12-20  
> **状态**: 开发中
>
> 本文档涵盖：架构设计、组件规范、UI 设计、数据流、测试策略、开发进度

---

## 目录

1. [项目概览](#一项目概览)
2. [技术架构](#二技术架构)
3. [目录结构](#三目录结构)
4. [组件设计](#四组件设计)
5. [数据流架构](#五数据流架构)
6. [UI 设计规范](#六ui-设计规范)
7. [Composables 设计](#七composables-设计)
8. [测试策略](#八测试策略)
9. [开发进度](#九开发进度)
10. [已知问题与待办](#十已知问题与待办)

---

## 一、项目概览

### 1.1 项目目标

构建一个基于 VitePress 的 FGO 剧情阅读器，实现：
- **GalGame 体验**: 沉浸式剧情阅读，支持对话、选项、角色表情
- **多服务器**: 支持 JP/NA/CN/TW/KR 五个服务器
- **响应式**: 桌面端三栏布局，移动端自适应
- **离线**: 支持数据缓存，减少网络请求

### 1.2 核心特性

| 特性 | 状态 | 描述 |
|------|------|------|
| 角色渲染 | ✅ 完成 | merged.png + 表情差分系统 |
| 对话系统 | ✅ 完成 | FGO UI 资源 + Ruby + 傍点 + 颜色 |
| 选项系统 | ✅ 完成 | GalGame 风格选项 |
| 布局系统 | ✅ 完成 | 1024:626 严格比例 + 响应式 |
| 脚本解析 | 🔄 进行中 | Tokenizer + Parser + StateManager |
| 音频系统 | ⏳ 待实现 | BGM + SE + Voice |
| 剧情索引 | ⏳ 待实现 | 主线 + 活动 + 幕间 |
| CN 映射 | ⏳ 待实现 | 审查名称反向映射 |

### 1.3 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | VitePress | 1.x | 静态站点 |
| UI 框架 | Vue 3 | 3.4+ | 组件化 |
| UI 库 | Vuetify 3 | 3.x | 基础 UI |
| 类型 | TypeScript | 5.x | 类型安全 |
| 数据源 | Atlas Academy | - | FGO 数据 |
| 构建 | Vite | 5.x | 开发/构建 |

---

## 二、技术架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         VitePress                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Custom Theme                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │   Layout    │  │    Pages    │  │      Components      │ ││
│  │  │ StoryLayout │  │ story/[id]  │  │ DialogueBox, Stage   │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Services Layer                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │  AtlasApi   │  │ScriptParser │  │  StateManager       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Composables                               ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │useStoryPlay │  │useSceneRend │  │   useAudio          │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Atlas Academy API                             │
│         https://api.atlasacademy.io/export/{region}/            │
│         https://static.atlasacademy.io/{region}/                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 设计原则

1. **函数式优先**
   - 避免 class (除 StateManager)
   - 优先使用纯函数
   - 使用 Composables 封装状态逻辑

2. **严格类型**
   - 所有 API 返回值必须有类型定义
   - 禁止 `any`，使用 `unknown` + 类型守卫

3. **文件限制**
   - 单文件 < 400 行
   - 超过则拆分为子模块

4. **文档规范**
   - 仅使用 JSDoc，无普通注释
   - 公共 API 必须有文档

### 2.3 数据流

```
用户操作
    │
    ▼
Vue Component (事件处理)
    │
    ▼
Composable (状态管理)
    │
    ├──▶ ScriptStateManager (状态转换)
    │           │
    │           ▼
    │    RenderState (渲染状态)
    │           │
    │           ▼
    │    Vue Component (渲染)
    │
    └──▶ AtlasApiService (数据获取)
                │
                ▼
         Atlas Academy API
```

---

## 三、目录结构

### 3.1 完整结构

```
fgo/
├── document/                    # 文档目录
│   ├── README.md               # 项目索引
│   ├── DEVELOPMENT.md          # 开发手册 (本文档)
│   ├── SCRIPT.md               # 脚本系统
│   ├── ATLAS.md                # Atlas API
│   └── EXTRAS.md               # 扩展功能
│
├── docs/                        # VitePress 站点
│   ├── .vitepress/
│   │   ├── config.ts           # VitePress 配置
│   │   ├── theme/
│   │   │   ├── index.ts        # 主题入口
│   │   │   ├── Layout.vue      # 自定义布局
│   │   │   └── styles/         # 样式文件
│   │   └── utils/              # 工具函数
│   │
│   └── src/
│       ├── playground/         # 剧情阅读器
│       │   ├── components/     # Vue 组件
│       │   │   └── story/
│       │   │       ├── layout/     # 布局组件
│       │   │       ├── dialogue/   # 对话组件
│       │   │       ├── scene/      # 场景组件
│       │   │       ├── controls/   # 控制组件
│       │   │       └── editor/     # 编辑器组件
│       │   │
│       │   ├── services/       # 服务层
│       │   │   ├── atlas-api.ts        # Atlas API 封装
│       │   │   ├── script-parser.ts    # 脚本解析器
│       │   │   └── script-state-manager.ts  # 状态管理
│       │   │
│       │   ├── composables/    # Vue Composables
│       │   │   ├── useSceneRenderer.ts
│       │   │   ├── useStoryPlayer.ts
│       │   │   └── useAudio.ts
│       │   │
│       │   ├── utils/          # 工具函数
│       │   │   └── layout-calculator.ts
│       │   │
│       │   └── types/          # 类型定义
│       │       └── index.ts
│       │
│       ├── public/             # 静态资源
│       │   └── SystemUI/       # FGO UI 资源
│       │
│       ├── index.md            # 首页
│       └── story/              # 剧情页面
│           └── [warId]/
│               └── [questId].vue
│
└── data/                        # 数据文件
    └── mappings/
        └── cn-censorship.json  # CN 审查映射
```

### 3.2 组件目录详解

```
components/story/
├── layout/
│   ├── StoryLayout.vue         # 主布局 (全屏 + 三栏)
│   └── StoryDemo.vue           # 演示页面
│
├── dialogue/
│   ├── DialogueBox.vue         # 对话框容器
│   ├── DialogueSpeaker.vue     # 说话者名称
│   ├── DialogueText.vue        # 对话文本 (Ruby/傍点/颜色)
│   ├── DialogueControls.vue    # 控制按钮
│   ├── DialogueChoices.vue     # 选项列表
│   └── SpoilerText.vue         # 隐藏名 (Spoiler)
│
├── scene/
│   └── SceneCharacter.vue      # 角色渲染
│
├── controls/
│   └── AudioControls.vue       # 音频开关
│
└── editor/
    └── LayoutEditor.vue        # 布局编辑器
```

---

## 四、组件设计

### 4.1 组件清单

| 组件 | 文件 | 行数限制 | 职责 |
|------|------|---------|------|
| StoryLayout | layout/StoryLayout.vue | <350 | 全屏布局 + 响应式 + 侧边栏 |
| DialogueBox | dialogue/DialogueBox.vue | <200 | 对话框容器 + 背景图 |
| DialogueSpeaker | dialogue/DialogueSpeaker.vue | <80 | 名字标签 |
| DialogueText | dialogue/DialogueText.vue | <200 | 文本渲染 + Ruby + 自适应字体 |
| DialogueControls | dialogue/DialogueControls.vue | <120 | 控制按钮 (复制/返回) |
| DialogueChoices | dialogue/DialogueChoices.vue | <150 | 选项系统 |
| SpoilerText | dialogue/SpoilerText.vue | <100 | 隐藏名揭示 |
| SceneCharacter | scene/SceneCharacter.vue | <200 | 角色渲染 (身体 + 表情) |
| AudioControls | controls/AudioControls.vue | <150 | BGM/SE 开关 |

### 4.2 StoryLayout.vue

**职责**: 全屏布局、响应式、舞台尺寸计算

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SceneCharacter from '../scene/SceneCharacter.vue'
import DialogueBox from '../dialogue/DialogueBox.vue'
import DialogueChoices from '../dialogue/DialogueChoices.vue'
import AudioControls from '../controls/AudioControls.vue'

interface Props {
  background?: string
  characters: CharacterSlot[]
  dialogue: DialogueState | null
  choices: ChoiceOption[] | null
  audio: AudioState
  sceneType: SceneType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  next: []
  prev: []
  selectChoice: [id: number]
  toggleBgm: [muted: boolean]
  toggleSe: [muted: boolean]
}>()

// 舞台尺寸
const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(1024)
const stageHeight = ref(626)
const dialogueScale = ref(1)

// 计算舞台尺寸
function updateStageDimensions() {
  if (!stageRef.value) return
  
  const container = stageRef.value.parentElement
  if (!container) return
  
  const maxWidth = container.clientWidth - 24  // padding
  const maxHeight = window.innerHeight - 100    // header
  
  const baseRatio = 1024 / 626
  
  let width = maxWidth
  let height = width / baseRatio
  
  if (height > maxHeight) {
    height = maxHeight
    width = height * baseRatio
  }
  
  stageWidth.value = width
  stageHeight.value = height
  dialogueScale.value = width / 1024
}

// 生命周期
onMounted(() => {
  updateStageDimensions()
  window.addEventListener('resize', updateStageDimensions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateStageDimensions)
})

// 交互
const canClickDialogue = computed(() => props.sceneType === 'dialogue')
const canClickBackground = computed(() => props.sceneType === 'transition')
const showChoices = computed(() => props.choices && props.choices.length > 0)
const hasDialogue = computed(() => !!props.dialogue)

function handleDialogueClick() {
  if (canClickDialogue.value) {
    emit('next')
  }
}

function handleBackgroundClick() {
  if (canClickBackground.value) {
    emit('next')
  }
}
</script>

<template>
  <div class="story-layout">
    <!-- 舞台 -->
    <div 
      ref="stageRef"
      class="stage"
      :style="{ width: stageWidth + 'px', height: stageHeight + 'px' }"
      @click="handleBackgroundClick"
    >
      <!-- 背景 -->
      <div 
        class="stage-background"
        :style="{ backgroundImage: background ? `url(${background})` : 'none' }"
      />
      
      <!-- 角色 -->
      <SceneCharacter
        v-for="char in characters"
        :key="char.slot"
        :character="char"
        :stage-width="stageWidth"
        :stage-height="stageHeight"
      />
      
      <!-- 音频控制 -->
      <AudioControls
        :bgm-playing="audio.bgm?.playing"
        @toggle-bgm="(muted) => emit('toggleBgm', muted)"
        @toggle-se="(muted) => emit('toggleSe', muted)"
      />
      
      <!-- 选项 -->
      <DialogueChoices
        v-if="showChoices"
        :choices="choices!"
        :has-dialogue="hasDialogue"
        @select="(id) => emit('selectChoice', id)"
      />
      
      <!-- 对话框 -->
      <DialogueBox
        v-if="dialogue && sceneType !== 'choice-only'"
        :speaker="dialogue.speaker"
        :components="dialogue.components"
        :scale="dialogueScale"
        :clickable="canClickDialogue"
        @click="handleDialogueClick"
        @prev="emit('prev')"
      />
    </div>
  </div>
</template>
```

### 4.3 DialogueBox.vue

**职责**: 对话框容器、FGO UI 背景

```vue
<script setup lang="ts">
import DialogueSpeaker from './DialogueSpeaker.vue'
import DialogueText from './DialogueText.vue'
import DialogueControls from './DialogueControls.vue'

interface Props {
  speaker?: string
  components: DialogueComponent[][]
  scale: number
  clickable: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
  prev: []
  copy: []
}>()

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}

function handlePrev() {
  emit('prev')
}

function handleCopy() {
  // 复制文本逻辑
  const text = flattenComponents(props.components)
  navigator.clipboard.writeText(text)
}

function flattenComponents(components: DialogueComponent[][]): string {
  return components.map(line => 
    line.map(comp => {
      if (comp.type === 'text') return comp.text
      if (comp.type === 'playerName') return '藤丸立香'
      if (comp.type === 'ruby') return comp.text
      return ''
    }).join('')
  ).join('\n')
}
</script>

<template>
  <div 
    class="dialogue-box"
    :style="{ transform: `scale(${scale})` }"
    @click="handleClick"
  >
    <DialogueSpeaker v-if="speaker" :name="speaker" />
    <DialogueText :components="components" />
    <DialogueControls 
      @prev="handlePrev"
      @copy="handleCopy"
    />
  </div>
</template>

<style scoped>
.dialogue-box {
  position: absolute;
  left: 10px;
  bottom: 20px;
  width: 1004px;
  min-height: 170px;
  background: url('/SystemUI/img_talk_textbg.png') center center / 100% 100% no-repeat;
  transform-origin: bottom left;
}
</style>
```

### 4.4 SceneCharacter.vue

**职责**: 角色渲染 (身体 + 表情)

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { CharacterSlot, CharacterLayout } from '../../../types'

interface Props {
  character: CharacterSlot
  stageWidth: number
  stageHeight: number
}

const props = defineProps<Props>()

/** 计算角色布局 */
const layout = computed<CharacterLayout>(() => {
  const { character: char, stageWidth } = props
  
  const baseWidth = 1024
  const bodyHeight = 768
  const faceSize = char.svtScript?.extendData?.faceSize ?? 256
  
  // 缩放
  const scale = (stageWidth / baseWidth) * char.scale
  
  // Wrapper
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
  
  // 表情
  if (char.currentFace > 0 && char.svtScript) {
    const faceIndex = char.currentFace - 1
    const perRow = Math.floor(1024 / faceSize)
    const col = faceIndex % perRow
    const row = Math.floor(faceIndex / perRow)
    
    const srcX = col * faceSize
    const srcY = 768 + row * faceSize
    
    const { faceX = 0, faceY = 0, offsetX = 0 } = char.svtScript
    
    layout.face = {
      left: (faceX + offsetX) * scale,
      top: faceY * scale,
      width: faceSize * scale,
      height: faceSize * scale,
      backgroundPositionX: -srcX * scale,
      backgroundPositionY: -srcY * scale,
      backgroundSize: baseWidth * scale
    }
  }
  
  return layout
})

/** 角色状态类 */
const wrapperClass = computed(() => ({
  'character-wrapper': true,
  'active': props.character.isActive,
  'inactive': !props.character.isActive,
  'silhouette': props.character.isSilhouette
}))
</script>

<template>
  <div 
    :class="wrapperClass"
    :style="{
      width: layout.wrapper.width + 'px',
      height: layout.wrapper.height + 'px',
      left: layout.wrapper.left + 'px',
      bottom: layout.wrapper.bottom + 'px'
    }"
  >
    <!-- 身体 -->
    <div 
      class="character-body"
      :style="{
        backgroundImage: `url(${character.imageUrl})`,
        backgroundSize: layout.body.backgroundSize,
        backgroundPosition: layout.body.backgroundPosition
      }"
    />
    
    <!-- 表情 -->
    <div 
      v-if="layout.face"
      class="character-face"
      :style="{
        left: layout.face.left + 'px',
        top: layout.face.top + 'px',
        width: layout.face.width + 'px',
        height: layout.face.height + 'px',
        backgroundImage: `url(${character.imageUrl})`,
        backgroundPosition: `${layout.face.backgroundPositionX}px ${layout.face.backgroundPositionY}px`,
        backgroundSize: `${layout.face.backgroundSize}px auto`
      }"
    />
  </div>
</template>

<style scoped>
.character-wrapper {
  position: absolute;
  overflow: hidden;
  transition: filter 0.3s ease;
}

.character-wrapper.inactive {
  filter: brightness(0.4) saturate(0.5);
}

.character-wrapper.active {
  filter: brightness(1.05) drop-shadow(0 0 20px rgba(0, 0, 0, 0.6));
}

.character-wrapper.silhouette {
  filter: brightness(0) saturate(0);
}

.character-body {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
}

.character-face {
  position: absolute;
  background-repeat: no-repeat;
}
</style>
```

---

## 五、数据流架构

### 5.1 完整数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ 点击对话框   │  │  选择选项   │  │   切换场景              │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Composables 层                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    useStoryPlayer                            ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ ││
│  │  │ scenes  │  │ current │  │ history │  │ choicesMade     │ ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ ││
│  │                                                              ││
│  │  Methods: next(), prev(), goTo(), selectChoice()            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Services 层                                  │
│  ┌───────────────────────┐  ┌─────────────────────────────────┐ │
│  │   ScriptStateManager  │  │       AtlasApiService           │ │
│  │                       │  │                                 │ │
│  │  - slots: Map         │  │  - getWars()                    │ │
│  │  - background         │  │  - getQuest()                   │ │
│  │  - dialogue           │  │  - getScriptContent()           │ │
│  │  - choices            │  │  - getSvtScript()               │ │
│  │                       │  │                                 │ │
│  │  processComponent()   │  │  fetch -> parse -> return       │ │
│  │  getCurrentState()    │  │                                 │ │
│  └───────────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Types 层                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ CharacterSlot│ │ RenderState │  │ DialogueComponent       │ │
│  │ AudioState   │ │ SceneType   │  │ ChoiceOption            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 脚本加载流程

```typescript
async function loadStory(warId: number, questId: number, sceneIndex?: number) {
  // 1. 获取任务信息
  const quest = await api.getQuest(questId)
  
  // 2. 获取脚本 ID 列表
  const scriptIds = quest.phases[0].scripts.map(s => s.scriptId)
  
  // 3. 加载脚本内容
  const rawScript = await api.getScriptContent(scriptIds[0])
  
  // 4. 解析脚本
  const parsed = parseScript(rawScript)
  
  // 5. 处理组件，生成场景
  const manager = new ScriptStateManager()
  for (const comp of parsed.components) {
    manager.processComponent(comp)
  }
  const scenes = manager.getScenes()
  
  // 6. 预加载角色渲染参数
  const charaGraphIds = new Set<string>()
  for (const scene of scenes) {
    for (const char of scene.visibleCharacters) {
      charaGraphIds.add(char.charaGraphId)
    }
  }
  
  for (const id of charaGraphIds) {
    const svtScript = await api.getSvtScript(id)
    // 更新场景中的角色数据
    for (const scene of scenes) {
      for (const char of scene.visibleCharacters) {
        if (char.charaGraphId === id) {
          char.svtScript = svtScript
        }
      }
    }
  }
  
  // 7. 初始化播放器
  const player = useStoryPlayer(scenes)
  
  // 8. 跳转到指定场景
  if (sceneIndex !== undefined) {
    player.goTo(sceneIndex)
  }
  
  return player
}
```

### 5.3 状态同步

```typescript
// URL 同步
function useUrlSync(player: ReturnType<typeof useStoryPlayer>) {
  const route = useRoute()
  
  // URL -> 状态
  onMounted(() => {
    const hash = window.location.hash
    if (hash.startsWith('#scene-')) {
      const index = parseInt(hash.slice(7))
      if (!isNaN(index)) {
        player.goTo(index)
      }
    }
  })
  
  // 状态 -> URL
  watch(() => player.currentIndex.value, (index) => {
    history.replaceState(null, '', `#scene-${index}`)
  })
}
```

---

## 六、UI 设计规范

### 6.1 核心约束

| 约束 | 值 | 说明 |
|------|-----|------|
| 舞台宽度 | 1024px | 基准宽度 |
| 舞台高度 | 626px | 背景图比例 |
| 角色高度 | 768px | 身体部分 |
| 对话框宽度 | 1004px | 留边距 |
| 对话框高度 | 170px | 最小高度 |

### 6.2 FGO UI 资源

| 资源 | 文件 | 尺寸 | 用途 |
|------|------|------|------|
| 对话框背景 | img_talk_textbg.png | 1024×170 | DialogueBox |
| 名字标签 | img_talk_namebg.png | 262×51 | DialogueSpeaker |
| 选项背景 | img_talk_selectbg.png | 600×64 | DialogueChoices |
| 复制按钮 | btn_log.png | 29×29 | DialogueControls |
| 返回按钮 | btn_ff.png | 52×52 | DialogueControls |

### 6.3 CSS 变量

```css
:root {
  /* FGO 颜色 */
  --fgo-gold: #c9a227;
  --fgo-gold-dark: #9a7a1c;
  --fgo-blue: #4a8abf;
  --fgo-dark: #08080a;
  --fgo-text: #ffffff;
  --fgo-text-shadow: rgba(0, 0, 0, 0.8);
  
  /* 舞台 */
  --stage-width: 1024px;
  --stage-height: 626px;
  --stage-ratio: calc(1024 / 626);
  
  /* 对话框 */
  --dialogue-width: 1004px;
  --dialogue-min-height: 170px;
  --dialogue-bottom: 20px;
  
  /* 字体 */
  --font-fgo: 'FGO-Main-Font', 'Noto Sans JP', sans-serif;
  --font-size-dialogue: 19px;
  --font-size-speaker: 18px;
  
  /* 动画 */
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
```

### 6.4 响应式断点

```css
/* 桌面 - 三栏布局 */
@media (min-width: 1100px) {
  .story-layout {
    display: grid;
    grid-template-columns: 240px 1fr 240px;
  }
}

/* 平板 - 单栏，舞台居中 */
@media (max-width: 1099px) {
  .story-layout {
    display: flex;
    flex-direction: column;
  }
  
  .sidebar {
    display: none;
  }
}

/* 手机 - 横屏提示 */
@media (max-width: 768px) and (orientation: portrait) {
  .rotate-hint {
    display: flex;
  }
}
```

### 6.5 文本格式

| 格式 | 语法 | CSS |
|------|------|-----|
| Ruby | `<ruby>汉字<rt>注音</rt></ruby>` | `font-size: 0.6em` |
| 傍点 | `<span class="emphasis">` | `text-emphasis: filled dot` |
| 颜色 | `style="color: #ff0000"` | 内联样式 |

---

## 七、Composables 设计

### 7.1 useStoryPlayer

```typescript
interface UseStoryPlayerReturn {
  // 状态
  scenes: ComputedRef<RenderState[]>
  currentScene: ComputedRef<RenderState>
  currentIndex: ComputedRef<number>
  canNext: ComputedRef<boolean>
  canPrev: ComputedRef<boolean>
  
  // 方法
  next: () => boolean
  prev: () => boolean
  goTo: (index: number) => void
  selectChoice: (choiceId: number) => void
}

export function useStoryPlayer(scenes: RenderState[]): UseStoryPlayerReturn {
  const currentIndex = ref(0)
  const history = ref<number[]>([0])
  const choicesMade = ref(new Map<number, number>())
  
  const currentScene = computed(() => scenes[currentIndex.value])
  const canNext = computed(() => currentScene.value?.canAdvance ?? false)
  const canPrev = computed(() => history.value.length > 1)
  
  function next(): boolean {
    if (!canNext.value) return false
    
    if (currentIndex.value < scenes.length - 1) {
      history.value.push(++currentIndex.value)
      return true
    }
    return false
  }
  
  function prev(): boolean {
    if (!canPrev.value) return false
    
    history.value.pop()
    currentIndex.value = history.value[history.value.length - 1]
    return true
  }
  
  function goTo(index: number): void {
    if (index >= 0 && index < scenes.length) {
      currentIndex.value = index
      history.value.push(index)
    }
  }
  
  function selectChoice(choiceId: number): void {
    const sceneIndex = currentIndex.value
    choicesMade.value.set(sceneIndex, choiceId)
    next()
  }
  
  return {
    scenes: computed(() => scenes),
    currentScene,
    currentIndex: computed(() => currentIndex.value),
    canNext,
    canPrev,
    next,
    prev,
    goTo,
    selectChoice
  }
}
```

### 7.2 useSceneRenderer

```typescript
interface UseSceneRendererReturn {
  stageWidth: Ref<number>
  stageHeight: Ref<number>
  dialogueScale: Ref<number>
  updateDimensions: () => void
}

export function useSceneRenderer(containerRef: Ref<HTMLElement | null>): UseSceneRendererReturn {
  const stageWidth = ref(1024)
  const stageHeight = ref(626)
  const dialogueScale = ref(1)
  
  function updateDimensions() {
    if (!containerRef.value) return
    
    const container = containerRef.value
    const maxWidth = container.clientWidth - 24
    const maxHeight = window.innerHeight - 100
    
    const baseRatio = 1024 / 626
    
    let width = maxWidth
    let height = width / baseRatio
    
    if (height > maxHeight) {
      height = maxHeight
      width = height * baseRatio
    }
    
    stageWidth.value = width
    stageHeight.value = height
    dialogueScale.value = width / 1024
  }
  
  let resizeTimer: number | null = null
  
  function debouncedUpdate() {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(updateDimensions, 100)
  }
  
  onMounted(() => {
    updateDimensions()
    window.addEventListener('resize', debouncedUpdate)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', debouncedUpdate)
    if (resizeTimer) clearTimeout(resizeTimer)
  })
  
  return {
    stageWidth,
    stageHeight,
    dialogueScale,
    updateDimensions
  }
}
```

### 7.3 useAudio

```typescript
interface UseAudioReturn {
  bgmMuted: Ref<boolean>
  seMuted: Ref<boolean>
  voiceMuted: Ref<boolean>
  
  playBgm: (url: string, volume?: number) => void
  stopBgm: (fadeOut?: number) => void
  playSe: (url: string) => void
  playVoice: (url: string) => void
  
  toggleBgm: () => void
  toggleSe: () => void
  toggleVoice: () => void
}

export function useAudio(): UseAudioReturn {
  const bgmMuted = ref(false)
  const seMuted = ref(false)
  const voiceMuted = ref(false)
  
  let bgmAudio: HTMLAudioElement | null = null
  
  function playBgm(url: string, volume = 1) {
    if (bgmAudio) {
      bgmAudio.pause()
    }
    
    bgmAudio = new Audio(url)
    bgmAudio.loop = true
    bgmAudio.volume = bgmMuted.value ? 0 : volume
    bgmAudio.play()
  }
  
  function stopBgm(fadeOut = 0) {
    if (!bgmAudio) return
    
    if (fadeOut > 0) {
      const startVolume = bgmAudio.volume
      const step = startVolume / (fadeOut * 60)
      
      const fade = () => {
        if (bgmAudio && bgmAudio.volume > step) {
          bgmAudio.volume -= step
          requestAnimationFrame(fade)
        } else if (bgmAudio) {
          bgmAudio.pause()
          bgmAudio = null
        }
      }
      fade()
    } else {
      bgmAudio.pause()
      bgmAudio = null
    }
  }
  
  function playSe(url: string) {
    if (seMuted.value) return
    
    const audio = new Audio(url)
    audio.play()
  }
  
  function playVoice(url: string) {
    if (voiceMuted.value) return
    
    const audio = new Audio(url)
    audio.play()
  }
  
  function toggleBgm() {
    bgmMuted.value = !bgmMuted.value
    if (bgmAudio) {
      bgmAudio.volume = bgmMuted.value ? 0 : 1
    }
  }
  
  function toggleSe() {
    seMuted.value = !seMuted.value
  }
  
  function toggleVoice() {
    voiceMuted.value = !voiceMuted.value
  }
  
  return {
    bgmMuted,
    seMuted,
    voiceMuted,
    playBgm,
    stopBgm,
    playSe,
    playVoice,
    toggleBgm,
    toggleSe,
    toggleVoice
  }
}
```

---

## 八、测试策略

### 8.1 单元测试

```typescript
// 测试文本解析
describe('DialogueText Parser', () => {
  test('Ruby text', () => {
    const result = parseDialogueText('[#魔力:マナ]')
    expect(result).toEqual([
      { type: 'ruby', text: '魔力', ruby: 'マナ' }
    ])
  })
  
  test('Player name', () => {
    const result = parseDialogueText('[%1]さん')
    expect(result).toEqual([
      { type: 'playerName' },
      { type: 'text', text: 'さん' }
    ])
  })
})
```

### 8.2 组件测试

```typescript
// 测试角色渲染
describe('SceneCharacter', () => {
  test('renders correctly', () => {
    const wrapper = mount(SceneCharacter, {
      props: {
        character: {
          slot: 'A',
          charaGraphId: '1001000',
          visible: true,
          position: 1,
          currentFace: 1,
          isActive: true,
          // ...
        },
        stageWidth: 1024,
        stageHeight: 626
      }
    })
    
    expect(wrapper.find('.character-wrapper').exists()).toBe(true)
    expect(wrapper.find('.character-body').exists()).toBe(true)
    expect(wrapper.find('.character-face').exists()).toBe(true)
  })
})
```

### 8.3 E2E 测试

```typescript
// Playwright 测试
test('Story playback', async ({ page }) => {
  await page.goto('/story/100/1000001')
  
  // 等待加载
  await page.waitForSelector('.stage')
  
  // 检查角色显示
  const character = page.locator('.character-wrapper')
  await expect(character).toBeVisible()
  
  // 点击对话框
  await page.click('.dialogue-box')
  
  // 检查场景切换
  await expect(page.locator('#scene-1')).toBeInViewport()
})
```

---

## 九、开发进度

### 9.1 已完成

| 功能 | 完成日期 | 说明 |
|------|----------|------|
| 角色渲染 | 2024-12-15 | merged.png + 表情系统 |
| 对话系统 | 2024-12-16 | FGO UI + Ruby + 傍点 |
| 选项系统 | 2024-12-17 | GalGame 风格 |
| 布局系统 | 2024-12-18 | 响应式 + 缩放 |
| 脚本解析 (基础) | 2024-12-20 | Tokenizer + Parser |

### 9.2 进行中

| 功能 | 进度 | 说明 |
|------|------|------|
| 脚本解析 (完善) | 70% | StateManager |
| 音频系统 | 30% | AudioControls 已完成 |
| 数据索引 | 10% | 主线分类 |

### 9.3 待开始

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 剧情索引 | 高 | 主线/活动/幕间 |
| CN 映射 | 中 | 审查名称处理 |
| 离线缓存 | 中 | IndexedDB |
| 主题切换 | 低 | VitePress 集成 |

---

## 十、已知问题与待办

### 10.1 已知问题

| 问题 | 严重度 | 状态 |
|------|--------|------|
| 某些 NPC 无 svtScript | 低 | 使用默认值 |
| 窄屏对话框位置 | 已修复 | transform-origin |
| 文本溢出 | 已修复 | 自适应字体 |

### 10.2 待办事项

- [ ] 实现完整的脚本解析器
- [ ] 添加音频播放功能
- [ ] 实现剧情索引页面
- [ ] 添加 CN 审查映射
- [ ] 实现离线缓存
- [ ] 添加书签功能
- [ ] 实现主题切换
- [ ] 添加多语言支持
- [ ] 性能优化 (虚拟列表)
- [ ] 无障碍支持

---

*文档完*
