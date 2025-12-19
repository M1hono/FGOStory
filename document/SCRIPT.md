# 脚本系统

> FGO 原始脚本格式、解析器实现、数据转换、GalGame 交互逻辑
> 
> 参考: [cipherallies/fgo-scripts-parser](https://github.com/cipherallies/fgo-scripts-parser)

---

## 一、核心概念：角色生命周期

### ⚠️ 重要区分

| 指令 | 作用 | 角色可见性 |
|------|------|-----------|
| `charaSet` | **预加载**角色到槽位 | ❌ 不可见 |
| `charaFadein` | **显示**角色（淡入） | ✅ 可见 |
| `charaFadeout` | **隐藏**角色（淡出） | ❌ 不可见 |
| `charaClear` | **清除**所有角色 | ❌ 全部不可见 |

### 示例分析

```
[charaSet A 98001000 0 ？？？]   ← 预加载角色 A（不显示）
[charaSet B 98003000 2 ？？？]   ← 预加载角色 B（不显示）
[charaSet C 98002000 1 ？？？]   ← 预加载角色 C（不显示）
[charaFace C 0]                  ← 设置角色 C 的表情
[charaFadein C 0]                ← ✅ 显示角色 C（淡入，位置 0）

＠C：？？？
フォウ……？                      ← 角色 C 说话，此时只有 C 可见
```

### 角色状态机

```
                    charaSet
                       ↓
    ┌────────────────────────────────────┐
    │          PRELOADED (不可见)         │
    │   - charaGraphId, baseFace, name   │
    └────────────────────────────────────┘
                       │
                  charaFadein
                       ↓
    ┌────────────────────────────────────┐
    │          VISIBLE (可见)            │
    │   - position, face, isActive       │
    └────────────────────────────────────┘
                       │
                  charaFadeout
                       ↓
    ┌────────────────────────────────────┐
    │          HIDDEN (不可见)           │
    │   - 保留数据，可再次 fadein        │
    └────────────────────────────────────┘
```

---

## 二、数据转换层

### 第一层：原始脚本 → ScriptComponent[]

解析器将原始文本转换为结构化组件数组。

### 第二层：ScriptComponent[] → RenderState

**这是关键的数据转换层**，维护运行时状态：

```typescript
interface CharacterSlot {
  slot: string                    // "A", "B", "C"...
  charaGraphId: string
  baseFace: number
  displayName: string
  // 运行时状态
  visible: boolean                // 是否可见
  position: number                // 舞台位置 (0/1/2)
  currentFace: number             // 当前表情
  isActive: boolean               // 是否高亮（说话中）
  isSilhouette: boolean           // 是否剪影
}

interface RenderState {
  background: string | null
  slots: Map<string, CharacterSlot>  // 所有预加载的角色
  visibleCharacters: CharacterSlot[] // 当前可见的角色
  currentDialogue: DialogueRender | null
  currentChoices: ChoiceRender[] | null
  audio: {
    bgm: string | null
    se: string[]
  }
}
```

### 状态转换器

```typescript
class ScriptStateManager {
  private slots = new Map<string, CharacterSlot>()
  private background: string | null = null
  private audio = { bgm: null, se: [] }
  
  processComponent(comp: ScriptComponent): RenderState {
    switch (comp.type) {
      case 'CHARA_SET':
        // 预加载角色，默认不可见
        this.slots.set(comp.speakerCode, {
          slot: comp.speakerCode,
          charaGraphId: comp.charaGraphId,
          baseFace: comp.baseFace,
          displayName: comp.baseName,
          visible: false,        // ← 关键：默认不可见
          position: -1,
          currentFace: comp.baseFace,
          isActive: false,
          isSilhouette: false
        })
        break
        
      case 'CHARA_FADE_IN':
        const char = this.slots.get(comp.speakerCode)
        if (char) {
          char.visible = true    // ← 关键：fadein 使角色可见
          char.position = comp.position ?? 1
          char.currentFace = comp.face ?? char.baseFace
        }
        break
        
      case 'CHARA_FADE_OUT':
        const charOut = this.slots.get(comp.speakerCode)
        if (charOut) {
          charOut.visible = false // ← fadeout 隐藏角色
        }
        break
        
      case 'CHARA_FACE':
        const charFace = this.slots.get(comp.speakerCode)
        if (charFace) {
          charFace.currentFace = comp.face
        }
        break
        
      case 'BACKGROUND':
        this.background = comp.backgroundAsset
        break
    }
    
    return this.getCurrentRenderState()
  }
  
  getCurrentRenderState(): RenderState {
    return {
      background: this.background,
      slots: this.slots,
      visibleCharacters: Array.from(this.slots.values())
        .filter(c => c.visible)                    // ← 只返回可见角色
        .sort((a, b) => a.position - b.position),
      currentDialogue: null,
      currentChoices: null,
      audio: { ...this.audio }
    }
  }
}
```

---

## 三、对话文本格式

### DIALOGUE_HIDDEN_NAME (Spoiler 效果)

用于剧情中隐藏真名的角色，点击/悬停后显示真名。

```
脚本格式: [servantName svtId:hiddenName:trueName]
示例:     [servantName 100100:セイバー:アルトリア]
```

```typescript
interface DialogueSpeakerHiddenName {
  type: ScriptComponentType.DIALOGUE_HIDDEN_NAME
  svtId: number          // 从者 ID
  hiddenName: string     // 隐藏名（显示）
  trueName: string       // 真名（揭示后）
  colorHex?: string
}
```

**Vue 组件实现**:

```vue
<template>
  <span 
    class="spoiler" 
    :class="{ revealed }"
    @click="revealed = !revealed"
    :title="revealed ? hiddenName : '点击查看真名'"
  >
    {{ revealed ? trueName : hiddenName }}
  </span>
</template>

<style scoped>
.spoiler {
  background: linear-gradient(90deg, #333 0%, #555 100%);
  color: transparent;
  cursor: pointer;
  border-radius: 2px;
  padding: 0 4px;
  transition: all 0.3s;
}
.spoiler:hover:not(.revealed) {
  background: #444;
}
.spoiler.revealed {
  background: transparent;
  color: #ffcc00;  /* 金色高亮真名 */
}
</style>
```

### 其他文本格式

| 格式 | 脚本 | 渲染 |
|------|------|------|
| 换行 | `[r]` `[sr]` | `<br>` |
| 玩家名 | `[%1]` | `藤丸立香` |
| Ruby | `[#汉字:注音]` | `<ruby>汉字<rt>注音</rt></ruby>` |
| 颜色 | `[ff0000]文本[-]` | `<span style="color:#ff0000">` |
| 性别 | `[&男性文本:女性文本]` | 根据玩家性别选择 |
| 空行 | `[line N]` | 插入 N 个空行 |

---

## 四、音频控制

### 音频状态

```typescript
interface AudioState {
  bgm: {
    id: string
    url: string
    volume: number
    playing: boolean
  } | null
  se: {
    id: string
    url: string
  }[]
  voice: {
    id: string
    url: string
  } | null
}
```

### 音频 URL 构建规则

```typescript
const AssetHost = 'https://assets.atlasacademy.io/GameData'

// BGM
`${AssetHost}/${region}/Audio/${bgmId}/${bgmId}.mp3`

// SE (音效)
const SE_FOLDERS = {
  'ba': 'Battle',
  'ad': 'SE',
  'ar': 'ResidentSE',
  '21': 'SE_21'
}
const folder = SE_FOLDERS[seId.slice(0, 2)] ?? 'SE'
`${AssetHost}/${region}/Audio/${folder}/${seId}.mp3`

// Voice
`${AssetHost}/${region}/Audio/Servants_${svtId}/${voiceId}.mp3`
```

### 音频控制组件

需要在舞台右上角添加音频开关：

```vue
<template>
  <div class="audio-controls">
    <button 
      class="audio-btn" 
      :class="{ muted: bgmMuted }"
      @click="toggleBgm"
      title="BGM"
    >
      <IconMusic />
    </button>
    <button 
      class="audio-btn"
      :class="{ muted: seMuted }"
      @click="toggleSe"
      title="音效"
    >
      <IconVolume />
    </button>
  </div>
</template>
```

---

## 五、完整解析流程

```
┌─────────────────────────────────────────────────────────────┐
│                     原始脚本 (.txt)                          │
│  ＄01-00-00-00-1-1                                          │
│  [charaSet A 98001000 0 ？？？]                             │
│  [charaFadein A 0]                                          │
│  ＠A：？？？                                                 │
│  フォウ……？[r]キュウ……キュウ？                              │
│  [k]                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼  parseScript()
┌─────────────────────────────────────────────────────────────┐
│                  ScriptComponent[] (AST)                     │
│  [                                                           │
│    { type: CHARA_SET, speakerCode: "A", ... },              │
│    { type: CHARA_FADE_IN, speakerCode: "A", ... },          │
│    { type: DIALOGUE, speaker: { name: "？？？" }, ... }     │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼  ScriptStateManager.process()
┌─────────────────────────────────────────────────────────────┐
│                  RenderState (运行时状态)                    │
│  {                                                           │
│    visibleCharacters: [{ slot: "A", visible: true, ... }],  │
│    currentDialogue: { speaker: "？？？", text: "..." },     │
│    background: null                                          │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼  Vue Components
┌─────────────────────────────────────────────────────────────┐
│                      渲染组件                                │
│  <StoryLayout>                                               │
│    <SceneStage :characters="visibleCharacters" />           │
│    <DialogueBox :dialogue="currentDialogue" />              │
│    <AudioControls :audio="audioState" />                    │
│  </StoryLayout>                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 六、GalGame 交互逻辑

### 场景流转状态

```typescript
type SceneType = 
  | 'dialogue'      // 有对话，点击对话框进入下一句
  | 'choice'        // 有选项，对话框显示上一句，等待选择
  | 'choice-only'   // 只有选项无对话，隐藏对话框
  | 'transition'    // 过渡场景，点击背景进入下一幕

interface InteractionConfig {
  dialogueBoxVisible: boolean
  dialogueBoxClickable: boolean
  backgroundClickable: boolean
  choicesVisible: boolean
}

const INTERACTION_MAP: Record<SceneType, InteractionConfig> = {
  'dialogue': {
    dialogueBoxVisible: true,
    dialogueBoxClickable: true,
    backgroundClickable: false,
    choicesVisible: false
  },
  'choice': {
    dialogueBoxVisible: true,       // 显示上一句对话
    dialogueBoxClickable: false,    // 禁用点击
    backgroundClickable: false,
    choicesVisible: true
  },
  'choice-only': {
    dialogueBoxVisible: false,
    dialogueBoxClickable: false,
    backgroundClickable: false,
    choicesVisible: true
  },
  'transition': {
    dialogueBoxVisible: false,
    dialogueBoxClickable: false,
    backgroundClickable: true,      // 点击背景进入下一幕
    choicesVisible: false
  }
}
```

### 历史与回退

```typescript
interface HistoryEntry {
  sceneIndex: number
  dialogueIndex: number
  choiceMade?: { choiceId: number; optionIndex: number }
  renderState: RenderState  // 保存完整渲染状态用于回退
}

class StoryPlayer {
  private history: HistoryEntry[] = []
  
  goBack(): boolean {
    if (this.history.length <= 1) return false
    
    this.history.pop()  // 移除当前
    const prev = this.history[this.history.length - 1]
    
    // 恢复渲染状态
    this.restoreRenderState(prev.renderState)
    return true
  }
  
  // 选项回退：允许重新选择
  undoChoice(choiceId: number): void {
    // 找到该选项的历史记录
    const idx = this.history.findIndex(
      h => h.choiceMade?.choiceId === choiceId
    )
    if (idx > 0) {
      this.history = this.history.slice(0, idx)
      this.restoreRenderState(this.history[idx - 1].renderState)
    }
  }
}
```

---

## 七、待实现功能清单

| 功能 | 状态 | 描述 |
|------|------|------|
| charaSet/Fadein 逻辑 | ⏳ | 修正预加载 vs 显示的区分 |
| HIDDEN_NAME | ⏳ | Spoiler 组件实现 |
| 音频控制按钮 | ⏳ | 舞台右上角 BGM/SE 开关 |
| 数据转换层 | ⏳ | ScriptStateManager 实现 |
| 性别选择 | ⏳ | DIALOGUE_GENDER 处理 |
| 颜色渲染 | ✅ | 已支持 [ff0000] 格式 |
| Ruby | ✅ | 已支持 [#:] 格式 |
| 玩家名 | ✅ | 已支持 [%1] → 藤丸立香 |
