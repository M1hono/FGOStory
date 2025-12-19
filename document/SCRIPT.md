# FGO 脚本系统完整设计

> **版本**: 2.0  
> **最后更新**: 2024-12-20  
> **状态**: 开发中
>
> 本文档涵盖：原始脚本格式、解析器实现、数据结构转换、渲染状态管理、GalGame 交互逻辑、测试用例

---

## 目录

1. [原始脚本格式](#一原始脚本格式)
2. [脚本指令完整参考](#二脚本指令完整参考)
3. [解析器架构](#三解析器架构)
4. [数据结构定义](#四数据结构定义)
5. [数据转换流程](#五数据转换流程)
6. [渲染状态管理](#六渲染状态管理)
7. [GalGame 交互逻辑](#七galgame-交互逻辑)
8. [测试用例](#八测试用例)
9. [已知问题与解决方案](#九已知问题与解决方案)

---

## 一、原始脚本格式

### 1.1 获取脚本

```typescript
const SCRIPT_BASE_URL = 'https://static.atlasacademy.io/{region}/Script/{prefix}/{scriptId}.txt'
const ASSET_BASE_URL = 'https://assets.atlasacademy.io/GameData/{region}/Script/{prefix}/{scriptId}.txt'

// 示例
// https://static.atlasacademy.io/JP/Script/01/0100000110.txt
```

### 1.2 脚本 ID 结构

```
＄01-00-00-01-1-0
 │  │  │  │  │ └─ 序号 (0-9)
 │  │  │  │  └─── 阶段 (1-9)
 │  │  │  └────── 任务编号 (00-99)
 │  │  └───────── 子章节 (00-99)
 │  └──────────── 章节 (00-99)
 └─────────────── 前缀 (01-99)
```

### 1.3 行类型识别

| 首字符 | 类型 | 示例 |
|--------|------|------|
| `＄` | 脚本 ID | `＄01-00-00-01-1-0` |
| `[` | 指令 | `[charaSet A 98001000 0 ？？？]` |
| `＠` | 说话者 | `＠マシュ` 或 `＠A：マシュ` |
| `？` | 选项 | `？1：选项文本` |
| `？！` | 选项结束 | `？！` |
| 其他 | 对话文本 | `フォウ……？` |

### 1.4 完整脚本示例

```
＄01-00-00-00-1-1

[soundStopAll]
[scene 10000]
[charaSet A 98001000 0 ？？？]
[charaSet B 98003000 2 ？？？]
[charaSet C 98002000 1 ？？？]
[charaSet D 98004000 1 ？？？]
[charaSet E 98005000 1 ？？？]
[charaSet F 98006000 1 アナウンス]
[charaFace C 0]
[charaFadein C 0]
[wipeFilter circleIn 0.6 1]
[fadein black 1]
[wait fade]


＠C：？？？
フォウ……？[r]キュウ……キュウ？
[k]


[charaFace C 1]
＠C：？？？
フォウ、フォウ！[r]キュキュキュ！
[k]


？1：無事なのか！？
？2：殺しますよ、とか言わなかった！？
？！

[end]
```

---

## 二、脚本指令完整参考

### 2.1 角色指令

#### charaSet - 预加载角色 (不显示)

```
[charaSet {slot} {charaGraphId} {position} {displayName}]

参数:
  slot         - 槽位标识 (A-Z)
  charaGraphId - 角色图形 ID (如 98001000)
  position     - 初始位置 (0=左, 1=中, 2=右)
  displayName  - 显示名称 (如 "マシュ", "？？？")

示例:
  [charaSet A 98001000 0 マシュ]
  [charaSet B 98003000 2 Dr.ロマン]

⚠️ 重要: charaSet 只是预加载，角色此时不可见！
```

#### charaFadein - 显示角色 (淡入)

```
[charaFadein {slot} {duration} {position?}]

参数:
  slot     - 槽位标识
  duration - 淡入时长 (秒)
  position - 可选，覆盖 charaSet 的位置

示例:
  [charaFadein A 0]      # 立即显示
  [charaFadein B 0.5 1]  # 0.5秒淡入到中间位置

✅ charaFadein 执行后角色才可见！
```

#### charaFadeout - 隐藏角色 (淡出)

```
[charaFadeout {slot} {duration}]

示例:
  [charaFadeout A 0.3]
```

#### charaFace - 设置表情

```
[charaFace {slot} {faceIndex}]

参数:
  faceIndex - 表情索引 (0-based)，对应 merged.png 中的表情

示例:
  [charaFace A 1]  # 切换到第2个表情
  [charaFace B 0]  # 恢复默认表情
```

#### charaTalk - 设置说话状态

```
[charaTalk {slot|on|off}]

示例:
  [charaTalk A]    # 设置 A 为当前说话者
  [charaTalk off]  # 取消所有高亮
  [charaTalk on]   # 恢复高亮
```

#### charaClear - 清除所有角色

```
[charaClear]
```

#### charaMove - 移动角色

```
[charaMove {slot} {targetPosition} {duration}]

示例:
  [charaMove A 1 0.3]  # A 移动到中间，0.3秒
```

#### charaScale - 缩放角色

```
[charaScale {slot} {scale} {duration}]
```

#### charaFilter - 角色滤镜

```
[charaFilter {slot} {filterType}]

filterType:
  - shadow     - 黑影效果
  - silhouette - 剪影效果
  - normal     - 正常
```

### 2.2 场景指令

#### scene - 设置背景

```
[scene {sceneId} {?} {crossFadeDuration?}]

示例:
  [scene 10000]           # 立即切换
  [scene 10100 ? 0.5]     # 0.5秒交叉淡入淡出
```

#### sceneSet - 设置场景 (别名)

```
[sceneSet {sceneId}]
```

#### fadein / fadeout - 淡入淡出

```
[fadein {color} {duration}]
[fadeout {color} {duration}]

color: black, white, red, ...

示例:
  [fadein black 1]   # 从黑色淡入 1秒
  [fadeout white 0.5] # 淡出到白色 0.5秒
```

#### wipeFilter - 擦除效果

```
[wipeFilter {type} {duration} {?}]

type:
  - circleIn   - 圆形进入
  - circleOut  - 圆形退出
  - slideLeft  - 左滑
  - slideRight - 右滑

示例:
  [wipeFilter circleIn 0.6 1]
```

#### flashin / flashout - 闪光效果

```
[flashin {mode} {duration} {?} {color} {?}]

示例:
  [flashin once 200 0.1 00000000 black]
```

### 2.3 音频指令

#### bgm - 播放背景音乐

```
[bgm {bgmId} {volume?} {fadeinTime?}]

示例:
  [bgm BGM_EVENT_01]
  [bgm BGM_BATTLE_01 0.8 1.0]  # 音量80%, 1秒淡入
```

#### bgmStop - 停止背景音乐

```
[bgmStop {bgmId} {fadeoutTime}]

示例:
  [bgmStop BGM_EVENT_01 1.0]
```

#### se - 播放音效

```
[se {seId}]

seId 前缀决定文件夹:
  - ba* → Battle/
  - ad* → SE/
  - ar* → ResidentSE/
  - 21* → SE_21/

示例:
  [se ad1]
  [se ba_sword]
```

#### soundStopAll - 停止所有音频

```
[soundStopAll]
```

#### voice / tVoice - 播放语音

```
[voice {voiceId}]
[tVoice {folder} {fileName}]

示例:
  [voice 100100_battle_001]
  [tVoice Servants_100100 battle_001]
```

### 2.4 对话指令

#### k - 等待点击

```
[k]

标记一段对话结束，等待玩家点击继续。
这是划分"场景"的关键标记。
```

#### page - 翻页

```
[page]

清空对话框并开始新的一页。
```

#### messageOff / messageOn - 隐藏/显示对话框

```
[messageOff]
[messageOn]
```

### 2.5 流程控制指令

#### label - 标签

```
[label {labelName}]

示例:
  [label start]
  [label branch_a]
```

#### branch - 跳转

```
[branch {labelName} {flagName?} {flagValue?}]

示例:
  [branch end]
  [branch choice_a gender male]
```

#### branchQuestNotClear - 任务未完成跳转

```
[branchQuestNotClear {labelName} {questId}]
```

#### flag - 设置标记

```
[flag {flagName} {value}]

示例:
  [flag selected_option 1]
```

#### wait - 等待

```
[wt {duration}]
[wait {type}]

示例:
  [wt 0.5]      # 等待 0.5 秒
  [wait fade]   # 等待淡入淡出完成
```

#### end - 脚本结束

```
[end]
```

### 2.6 对话文本格式

#### 换行

```
[r]   - 换行
[sr]  - 软换行
```

#### 玩家名称

```
[%1]  - 替换为玩家名称 (藤丸立香)
```

#### Ruby 注音

```
[#汉字:注音]

示例:
  [#魔力:マナ]    → <ruby>魔力<rt>マナ</rt></ruby>
  [#人理:オーダー] → <ruby>人理<rt>オーダー</rt></ruby>
```

#### 颜色

```
[RRGGBB]文本[-]

示例:
  [ff0000]红色文字[-]
  [00ff00]绿色文字[-]
```

#### 性别分支

```
[&男性文本:女性文本]

示例:
  [&兄さん:姉さん]  → 根据玩家性别显示
```

#### 隐藏名 (Spoiler)

```
[servantName {svtId}:{hiddenName}:{trueName}]

示例:
  [servantName 100100:セイバー:アルトリア]
```

#### 空行

```
[line {count}]

示例:
  [line 2]  # 插入 2 个空行
```

---

## 三、解析器架构

### 3.1 总体流程

```
原始脚本 (.txt)
      │
      ▼ Tokenizer
Token[] (词法分析结果)
      │
      ▼ Parser
ScriptComponent[] (AST)
      │
      ▼ ScriptStateManager
RenderState (运行时状态)
      │
      ▼ Vue Components
渲染输出
```

### 3.2 Tokenizer 实现

```typescript
type TokenType = 
  | 'SCRIPT_ID'   // ＄01-00-00-01-1-0
  | 'COMMAND'     // [...]
  | 'SPEAKER'     // ＠xxx
  | 'CHOICE'      // ？N：xxx
  | 'CHOICE_END'  // ？！
  | 'TEXT'        // 普通文本

interface Token {
  type: TokenType
  value: string
  line: number
  raw: string
}

function tokenize(script: string): Token[] {
  const lines = script.split(/\r?\n/)
  const tokens: Token[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    if (!trimmed) continue
    
    // 脚本 ID
    if (trimmed.startsWith('＄') || trimmed.startsWith('$')) {
      tokens.push({
        type: 'SCRIPT_ID',
        value: trimmed.slice(1),
        line: i,
        raw: line
      })
      continue
    }
    
    // 命令
    if (trimmed.startsWith('[')) {
      tokens.push({
        type: 'COMMAND',
        value: trimmed,
        line: i,
        raw: line
      })
      continue
    }
    
    // 说话者 (全角@)
    if (trimmed.startsWith('＠') || trimmed.startsWith('@')) {
      tokens.push({
        type: 'SPEAKER',
        value: trimmed.slice(1),
        line: i,
        raw: line
      })
      continue
    }
    
    // 选项结束
    if (trimmed === '？！' || trimmed === '?!') {
      tokens.push({
        type: 'CHOICE_END',
        value: trimmed,
        line: i,
        raw: line
      })
      continue
    }
    
    // 选项
    if (/^[？?]\d+[：:]/.test(trimmed)) {
      tokens.push({
        type: 'CHOICE',
        value: trimmed,
        line: i,
        raw: line
      })
      continue
    }
    
    // 普通文本
    tokens.push({
      type: 'TEXT',
      value: trimmed,
      line: i,
      raw: line
    })
  }
  
  return tokens
}
```

### 3.3 命令解析

```typescript
interface ParsedCommand {
  name: string
  args: string[]
  raw: string
}

function parseCommand(token: Token): ParsedCommand | null {
  const match = token.value.match(/^\[(\w+)\s*(.*?)\]$/)
  if (!match) return null
  
  const [, name, argsStr] = match
  
  // 解析参数 (支持引号内空格)
  const args = argsStr.match(/[^\s"]+|"([^"]*)"/g) || []
  
  return {
    name: name.toLowerCase(),
    args: args.map(a => a.replace(/^"|"$/g, '')),
    raw: token.value
  }
}
```

### 3.4 说话者解析

```typescript
interface ParsedSpeaker {
  name: string
  slot?: string
}

function parseSpeaker(value: string): ParsedSpeaker {
  // 格式: "A：名称" (带槽位)
  const slotMatch = value.match(/^([A-Z])[：:](.+)$/)
  if (slotMatch) {
    return {
      slot: slotMatch[1],
      name: slotMatch[2]
    }
  }
  
  // 格式: "名称"
  return { name: value }
}
```

### 3.5 对话文本解析

```typescript
function parseDialogueText(text: string): DialogueComponent[] {
  const components: DialogueComponent[] = []
  let currentColor: string | undefined
  let buffer = ''
  
  const flushBuffer = () => {
    if (buffer) {
      components.push({
        type: 'text',
        text: buffer,
        colorHex: currentColor
      })
      buffer = ''
    }
  }
  
  // 分割为 token
  const parts = splitDialogueLine(text)
  
  for (const part of parts) {
    if (!part.startsWith('[')) {
      buffer += part
      continue
    }
    
    flushBuffer()
    
    // [r] 换行
    if (part === '[r]' || part === '[sr]') {
      components.push({ type: 'newline' })
      continue
    }
    
    // [%1] 玩家名
    if (part === '[%1]') {
      components.push({ type: 'playerName', colorHex: currentColor })
      continue
    }
    
    // [#汉字:注音] Ruby
    const rubyMatch = part.match(/^\[#([^:]+):([^\]]+)\]$/)
    if (rubyMatch) {
      components.push({
        type: 'ruby',
        text: rubyMatch[1],
        ruby: rubyMatch[2],
        colorHex: currentColor
      })
      continue
    }
    
    // [RRGGBB] 颜色开始
    const colorMatch = part.match(/^\[([0-9a-fA-F]{6})\]$/)
    if (colorMatch) {
      currentColor = colorMatch[1]
      continue
    }
    
    // [-] 颜色结束
    if (part === '[-]') {
      currentColor = undefined
      continue
    }
    
    // [servantName svtId:hidden:true] 隐藏名
    const hiddenMatch = part.match(/^\[servantName\s+(\d+):([^:]+):([^\]]+)\]$/)
    if (hiddenMatch) {
      components.push({
        type: 'hiddenName',
        svtId: parseInt(hiddenMatch[1]),
        hiddenName: hiddenMatch[2],
        trueName: hiddenMatch[3],
        colorHex: currentColor
      })
      continue
    }
    
    // [&male:female] 性别
    const genderMatch = part.match(/^\[&([^:]+):([^\]]+)\]$/)
    if (genderMatch) {
      components.push({
        type: 'gender',
        male: parseDialogueText(genderMatch[1]),
        female: parseDialogueText(genderMatch[2]),
        colorHex: currentColor
      })
      continue
    }
    
    // [line N] 空行
    const lineMatch = part.match(/^\[line\s+(\d+)\]$/)
    if (lineMatch) {
      components.push({
        type: 'line',
        length: parseInt(lineMatch[1]),
        colorHex: currentColor
      })
      continue
    }
    
    // 未知格式，作为文本处理
    buffer += part
  }
  
  flushBuffer()
  return components
}

function splitDialogueLine(line: string): string[] {
  const result: string[] = []
  let buffer = ''
  let bracketDepth = 0
  
  for (const char of line) {
    if (char === '[') {
      if (bracketDepth === 0 && buffer) {
        result.push(buffer)
        buffer = ''
      }
      bracketDepth++
    }
    
    buffer += char
    
    if (char === ']') {
      bracketDepth--
      if (bracketDepth === 0) {
        result.push(buffer)
        buffer = ''
      }
    }
  }
  
  if (buffer) result.push(buffer)
  return result
}
```

---

## 四、数据结构定义

### 4.1 解析器输出结构

```typescript
/** 脚本组件类型枚举 */
enum ScriptComponentType {
  // 角色
  CHARA_SET = 'CHARA_SET',
  CHARA_FACE = 'CHARA_FACE',
  CHARA_FADE_IN = 'CHARA_FADE_IN',
  CHARA_FADE_OUT = 'CHARA_FADE_OUT',
  CHARA_CLEAR = 'CHARA_CLEAR',
  CHARA_MOVE = 'CHARA_MOVE',
  CHARA_FILTER = 'CHARA_FILTER',
  
  // 场景
  BACKGROUND = 'BACKGROUND',
  FADE_IN = 'FADE_IN',
  FADE_OUT = 'FADE_OUT',
  WIPE = 'WIPE',
  FLASH = 'FLASH',
  
  // 音频
  BGM = 'BGM',
  BGM_STOP = 'BGM_STOP',
  SOUND_EFFECT = 'SOUND_EFFECT',
  VOICE = 'VOICE',
  SOUND_STOP_ALL = 'SOUND_STOP_ALL',
  
  // 对话
  DIALOGUE = 'DIALOGUE',
  CHOICES = 'CHOICES',
  
  // 流程
  LABEL = 'LABEL',
  BRANCH = 'BRANCH',
  FLAG = 'FLAG',
  WAIT = 'WAIT',
  END = 'END',
  
  // 未解析
  UNPARSED = 'UNPARSED'
}

/** 角色预加载 */
interface ScriptCharaSet {
  type: ScriptComponentType.CHARA_SET
  slot: string              // "A", "B", "C"...
  charaGraphId: string      // "98001000"
  position: number          // 0, 1, 2
  displayName: string       // "マシュ"
}

/** 角色显示 (淡入) */
interface ScriptCharaFadeIn {
  type: ScriptComponentType.CHARA_FADE_IN
  slot: string
  duration: number          // 秒
  position?: number         // 可覆盖 charaSet 的位置
  face?: number            // 可设置初始表情
}

/** 角色隐藏 (淡出) */
interface ScriptCharaFadeOut {
  type: ScriptComponentType.CHARA_FADE_OUT
  slot: string
  duration: number
}

/** 设置表情 */
interface ScriptCharaFace {
  type: ScriptComponentType.CHARA_FACE
  slot: string
  face: number
}

/** 清除所有角色 */
interface ScriptCharaClear {
  type: ScriptComponentType.CHARA_CLEAR
}

/** 背景 */
interface ScriptBackground {
  type: ScriptComponentType.BACKGROUND
  sceneId: string
  backgroundAsset: string   // 完整 URL
  crossFadeDuration?: number
}

/** BGM */
interface ScriptBgm {
  type: ScriptComponentType.BGM
  bgmId: string
  audioAsset: string
  volume?: number
  fadeinTime?: number
}

/** 音效 */
interface ScriptSoundEffect {
  type: ScriptComponentType.SOUND_EFFECT
  seId: string
  audioAsset: string
}

/** 语音 */
interface ScriptVoice {
  type: ScriptComponentType.VOICE
  voiceId: string
  audioAsset: string
}

/** 对话 */
interface ScriptDialogue {
  type: ScriptComponentType.DIALOGUE
  speaker?: {
    name: string
    slot?: string
  }
  lines: string[]           // 原始行
  components: DialogueComponent[][]  // 解析后的组件 (每行一个数组)
  voice?: {
    id: string
    url: string
  }
}

/** 选项 */
interface ScriptChoices {
  type: ScriptComponentType.CHOICES
  choices: {
    id: number
    option: DialogueComponent[]
    results: ScriptComponent[]  // 选择后执行的指令
  }[]
}

/** 等待 */
interface ScriptWait {
  type: ScriptComponentType.WAIT
  duration?: number
  waitType?: string         // "fade", etc.
}

/** 未解析指令 */
interface ScriptUnparsed {
  type: ScriptComponentType.UNPARSED
  command: string
  args: string[]
}

/** 所有组件类型联合 */
type ScriptComponent =
  | ScriptCharaSet
  | ScriptCharaFadeIn
  | ScriptCharaFadeOut
  | ScriptCharaFace
  | ScriptCharaClear
  | ScriptBackground
  | ScriptBgm
  | ScriptSoundEffect
  | ScriptVoice
  | ScriptDialogue
  | ScriptChoices
  | ScriptWait
  | ScriptUnparsed
  // ... 其他类型

/** 脚本解析结果 */
interface ParsedScript {
  id: string                // 脚本 ID
  region: string            // JP, NA, CN...
  components: ScriptComponent[]
  metadata: {
    questId?: number
    questPhase?: number
    totalDialogues: number
    totalChoices: number
  }
}
```

### 4.2 对话组件结构

```typescript
/** 对话文本组件 */
interface DialogueTextComponent {
  type: 'text'
  text: string
  colorHex?: string
}

/** 换行 */
interface DialogueNewLineComponent {
  type: 'newline'
}

/** 玩家名 */
interface DialoguePlayerNameComponent {
  type: 'playerName'
  colorHex?: string
}

/** Ruby 注音 */
interface DialogueRubyComponent {
  type: 'ruby'
  text: string
  ruby: string
  colorHex?: string
}

/** 隐藏名 (Spoiler) */
interface DialogueHiddenNameComponent {
  type: 'hiddenName'
  svtId: number
  hiddenName: string
  trueName: string
  colorHex?: string
}

/** 性别分支 */
interface DialogueGenderComponent {
  type: 'gender'
  male: DialogueComponent[]
  female: DialogueComponent[]
  colorHex?: string
}

/** 空行 */
interface DialogueLineComponent {
  type: 'line'
  length: number
  colorHex?: string
}

/** 联合类型 */
type DialogueComponent =
  | DialogueTextComponent
  | DialogueNewLineComponent
  | DialoguePlayerNameComponent
  | DialogueRubyComponent
  | DialogueHiddenNameComponent
  | DialogueGenderComponent
  | DialogueLineComponent
```

### 4.3 运行时渲染状态

```typescript
/** 角色槽位状态 */
interface CharacterSlot {
  // 基础数据 (来自 charaSet)
  slot: string
  charaGraphId: string
  displayName: string
  baseFace: number
  
  // 运行时状态
  visible: boolean          // ⚠️ 关键：是否可见
  position: number          // 舞台位置 (0/1/2)
  currentFace: number       // 当前表情
  isActive: boolean         // 是否高亮 (正在说话)
  isSilhouette: boolean     // 是否剪影
  scale: number             // 缩放
  
  // 资源 URL
  imageUrl: string          // merged.png URL
  svtScript?: {
    faceX: number
    faceY: number
    offsetX: number
    faceSize?: number
  }
}

/** 音频状态 */
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
    played: boolean
  }[]
  
  voice: {
    id: string
    url: string
  } | null
  
  bgmMuted: boolean
  seMuted: boolean
  voiceMuted: boolean
}

/** 对话渲染状态 */
interface DialogueState {
  speaker?: string
  speakerSlot?: string
  components: DialogueComponent[][]
  currentLineIndex: number
  isTyping: boolean
  voice?: string
}

/** 选项状态 */
interface ChoicesState {
  choices: {
    id: number
    text: string
    selected: boolean
  }[]
  waitingForSelection: boolean
}

/** 完整渲染状态 */
interface RenderState {
  // 场景
  background: string | null
  fadeState: {
    type: 'in' | 'out' | 'none'
    color: string
    progress: number
  }
  
  // 角色
  slots: Map<string, CharacterSlot>
  visibleCharacters: CharacterSlot[]  // 只包含 visible=true 的角色
  
  // 对话
  dialogue: DialogueState | null
  choices: ChoicesState | null
  
  // 音频
  audio: AudioState
  
  // 场景类型
  sceneType: 'dialogue' | 'choice' | 'choice-only' | 'transition'
  
  // 交互
  canAdvance: boolean       // 可以前进到下一个场景
  canGoBack: boolean        // 可以返回上一个场景
  dialogueClickable: boolean
  backgroundClickable: boolean
}
```

---

## 五、数据转换流程

### 5.1 完整转换链路

```
┌─────────────────────────────────────────────────────────────┐
│                    Step 1: 原始脚本获取                      │
│                                                              │
│  fetch(`/JP/Script/01/0100000110.txt`)                      │
│       ↓                                                      │
│  "＄01-00-00-00-1-1\n[scene 10000]\n..."                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Step 2: 词法分析                          │
│                                                              │
│  tokenize(rawScript)                                         │
│       ↓                                                      │
│  [                                                           │
│    { type: 'SCRIPT_ID', value: '01-00-00-00-1-1', ... },   │
│    { type: 'COMMAND', value: '[scene 10000]', ... },        │
│    { type: 'COMMAND', value: '[charaSet A 98001000 ...]' }, │
│    { type: 'SPEAKER', value: 'A：？？？', ... },            │
│    { type: 'TEXT', value: 'フォウ……？', ... },              │
│    { type: 'COMMAND', value: '[k]', ... },                  │
│    ...                                                       │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Step 3: 语法分析                          │
│                                                              │
│  parse(tokens)                                               │
│       ↓                                                      │
│  {                                                           │
│    id: '01-00-00-00-1-1',                                   │
│    region: 'JP',                                             │
│    components: [                                             │
│      { type: 'BACKGROUND', sceneId: '10000', ... },         │
│      { type: 'CHARA_SET', slot: 'A', charaGraphId: '...' }, │
│      { type: 'CHARA_FADE_IN', slot: 'A', duration: 0 },     │
│      { type: 'DIALOGUE', speaker: {...}, components: [...] },│
│      { type: 'CHOICES', choices: [...] },                   │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Step 4: 状态机处理 (逐个组件)                   │
│                                                              │
│  const manager = new ScriptStateManager()                   │
│  for (const comp of script.components) {                    │
│    manager.processComponent(comp)                           │
│  }                                                           │
│       ↓                                                      │
│  每个 [k] 之后生成一个 RenderState 快照                      │
│  {                                                           │
│    background: 'back10000.png',                             │
│    visibleCharacters: [{ slot: 'A', visible: true, ... }],  │
│    dialogue: { speaker: '？？？', components: [...] },      │
│    sceneType: 'dialogue'                                    │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Step 5: 场景序列生成                           │
│                                                              │
│  RenderState[] - 所有可渲染的场景快照                        │
│  [                                                           │
│    { index: 0, background: '...', dialogue: {...}, ... },   │
│    { index: 1, background: '...', dialogue: {...}, ... },   │
│    { index: 2, background: '...', choices: [...], ... },    │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Step 6: Vue 组件渲染                           │
│                                                              │
│  <StoryLayout :renderState="currentState">                  │
│    <SceneStage :background="state.background">              │
│      <SceneCharacter                                        │
│        v-for="char in state.visibleCharacters"              │
│        :character="char"                                    │
│      />                                                      │
│    </SceneStage>                                             │
│    <DialogueBox v-if="state.dialogue" ... />                │
│    <DialogueChoices v-if="state.choices" ... />             │
│    <AudioControls :audio="state.audio" />                   │
│  </StoryLayout>                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 ScriptStateManager 实现

```typescript
class ScriptStateManager {
  private region: string
  private slots = new Map<string, CharacterSlot>()
  private background: string | null = null
  private audio: AudioState
  private dialogue: DialogueState | null = null
  private choices: ChoicesState | null = null
  private scenes: RenderState[] = []
  
  constructor(region: string = 'JP') {
    this.region = region
    this.audio = this.createEmptyAudioState()
  }
  
  /** 处理单个组件 */
  processComponent(comp: ScriptComponent): void {
    switch (comp.type) {
      case ScriptComponentType.CHARA_SET:
        this.handleCharaSet(comp)
        break
        
      case ScriptComponentType.CHARA_FADE_IN:
        this.handleCharaFadeIn(comp)
        break
        
      case ScriptComponentType.CHARA_FADE_OUT:
        this.handleCharaFadeOut(comp)
        break
        
      case ScriptComponentType.CHARA_FACE:
        this.handleCharaFace(comp)
        break
        
      case ScriptComponentType.CHARA_CLEAR:
        this.handleCharaClear()
        break
        
      case ScriptComponentType.BACKGROUND:
        this.handleBackground(comp)
        break
        
      case ScriptComponentType.BGM:
        this.handleBgm(comp)
        break
        
      case ScriptComponentType.SOUND_EFFECT:
        this.handleSoundEffect(comp)
        break
        
      case ScriptComponentType.VOICE:
        this.handleVoice(comp)
        break
        
      case ScriptComponentType.DIALOGUE:
        this.handleDialogue(comp)
        this.commitScene()  // 对话自动提交场景
        break
        
      case ScriptComponentType.CHOICES:
        this.handleChoices(comp)
        this.commitScene()  // 选项自动提交场景
        break
    }
  }
  
  /** charaSet: 预加载角色 (不可见) */
  private handleCharaSet(comp: ScriptCharaSet): void {
    const imageUrl = this.buildCharaFigureUrl(comp.charaGraphId)
    
    this.slots.set(comp.slot, {
      slot: comp.slot,
      charaGraphId: comp.charaGraphId,
      displayName: comp.displayName,
      baseFace: 0,
      
      visible: false,      // ⚠️ 关键：预加载时不可见
      position: comp.position,
      currentFace: 0,
      isActive: false,
      isSilhouette: false,
      scale: 1,
      
      imageUrl
    })
  }
  
  /** charaFadein: 显示角色 */
  private handleCharaFadeIn(comp: ScriptCharaFadeIn): void {
    const char = this.slots.get(comp.slot)
    if (!char) return
    
    char.visible = true    // ⚠️ 关键：fadein 使角色可见
    
    if (comp.position !== undefined) {
      char.position = comp.position
    }
    if (comp.face !== undefined) {
      char.currentFace = comp.face
    }
  }
  
  /** charaFadeout: 隐藏角色 */
  private handleCharaFadeOut(comp: ScriptCharaFadeOut): void {
    const char = this.slots.get(comp.slot)
    if (char) {
      char.visible = false  // ⚠️ 隐藏角色
    }
  }
  
  /** charaFace: 设置表情 */
  private handleCharaFace(comp: ScriptCharaFace): void {
    const char = this.slots.get(comp.slot)
    if (char) {
      char.currentFace = comp.face
    }
  }
  
  /** charaClear: 隐藏所有角色 */
  private handleCharaClear(): void {
    this.slots.forEach(char => {
      char.visible = false
    })
  }
  
  /** 设置说话者为活跃状态 */
  private setActiveSpeaker(slot?: string): void {
    this.slots.forEach(char => {
      char.isActive = char.slot === slot
    })
  }
  
  /** 提交当前状态为一个场景 */
  private commitScene(): void {
    const visibleCharacters = Array.from(this.slots.values())
      .filter(c => c.visible)
      .sort((a, b) => a.position - b.position)
    
    const sceneType = this.determineSceneType()
    
    this.scenes.push({
      background: this.background,
      fadeState: { type: 'none', color: '', progress: 0 },
      slots: new Map(this.slots),
      visibleCharacters: visibleCharacters.map(c => ({ ...c })),
      dialogue: this.dialogue ? { ...this.dialogue } : null,
      choices: this.choices ? { ...this.choices } : null,
      audio: { ...this.audio },
      sceneType,
      canAdvance: sceneType !== 'choice' && sceneType !== 'choice-only',
      canGoBack: this.scenes.length > 0,
      dialogueClickable: sceneType === 'dialogue',
      backgroundClickable: sceneType === 'transition'
    })
    
    // 重置音效 (音效不跨场景)
    this.audio.se = []
    this.audio.voice = null
  }
  
  /** 确定场景类型 */
  private determineSceneType(): RenderState['sceneType'] {
    if (this.choices) {
      return this.dialogue ? 'choice' : 'choice-only'
    }
    if (this.dialogue) {
      return 'dialogue'
    }
    return 'transition'
  }
  
  /** 获取所有场景 */
  getScenes(): RenderState[] {
    return this.scenes
  }
  
  /** 构建角色立绘 URL */
  private buildCharaFigureUrl(charaGraphId: string): string {
    return `https://static.atlasacademy.io/${this.region}/CharaFigure/${charaGraphId}/${charaGraphId}_merged.png`
  }
  
  // ... 其他方法
}
```

---

## 六、渲染状态管理

### 6.1 场景切换

```typescript
interface ScenePlayer {
  scenes: RenderState[]
  currentIndex: number
  history: number[]  // 用于回退
  
  // 方法
  next(): boolean
  prev(): boolean
  goTo(index: number): void
  selectChoice(choiceId: number): void
}

function createScenePlayer(scenes: RenderState[]): ScenePlayer {
  return {
    scenes,
    currentIndex: 0,
    history: [0],
    
    next() {
      const current = this.scenes[this.currentIndex]
      if (!current.canAdvance) return false
      
      if (this.currentIndex < this.scenes.length - 1) {
        this.history.push(++this.currentIndex)
        return true
      }
      return false
    },
    
    prev() {
      if (this.history.length > 1) {
        this.history.pop()
        this.currentIndex = this.history[this.history.length - 1]
        return true
      }
      return false
    },
    
    goTo(index: number) {
      if (index >= 0 && index < this.scenes.length) {
        this.currentIndex = index
        this.history.push(index)
      }
    },
    
    selectChoice(choiceId: number) {
      // 选项处理逻辑
      this.next()
    }
  }
}
```

### 6.2 Vue Composable

```typescript
export function useStoryPlayer(script: ParsedScript) {
  const manager = new ScriptStateManager(script.region)
  
  // 处理所有组件
  for (const comp of script.components) {
    manager.processComponent(comp)
  }
  
  const scenes = manager.getScenes()
  const player = createScenePlayer(scenes)
  
  const currentScene = computed(() => scenes[player.currentIndex])
  const canNext = computed(() => currentScene.value?.canAdvance ?? false)
  const canPrev = computed(() => player.history.length > 1)
  
  function next() {
    return player.next()
  }
  
  function prev() {
    return player.prev()
  }
  
  function selectChoice(choiceId: number) {
    player.selectChoice(choiceId)
  }
  
  return {
    scenes,
    currentScene,
    currentIndex: computed(() => player.currentIndex),
    canNext,
    canPrev,
    next,
    prev,
    selectChoice
  }
}
```

---

## 七、GalGame 交互逻辑

### 7.1 场景类型与交互

| 场景类型 | 对话框 | 选项 | 点击对话框 | 点击背景 |
|----------|--------|------|-----------|----------|
| `dialogue` | 显示当前对话 | 无 | ✅ 下一句 | ❌ |
| `choice` | 显示上一句 | 显示选项 | ❌ 禁用 | ❌ |
| `choice-only` | 隐藏 | 显示选项 | - | ❌ |
| `transition` | 隐藏 | 无 | - | ✅ 下一幕 |

### 7.2 选项处理

```typescript
interface ChoiceState {
  sceneIndex: number       // 选项出现的场景
  choiceId: number         // 已选择的选项
  previousDialogue: string // 选项前的对话内容
}

class ChoiceManager {
  private choiceHistory: ChoiceState[] = []
  
  /** 记录选择 */
  recordChoice(sceneIndex: number, choiceId: number, prevDialogue: string) {
    this.choiceHistory.push({
      sceneIndex,
      choiceId,
      previousDialogue: prevDialogue
    })
  }
  
  /** 回退到选项前 (允许重新选择) */
  undoChoice(sceneIndex: number): ChoiceState | null {
    const idx = this.choiceHistory.findIndex(c => c.sceneIndex === sceneIndex)
    if (idx >= 0) {
      const removed = this.choiceHistory.splice(idx)
      return removed[0]
    }
    return null
  }
  
  /** 获取选择历史 */
  getHistory(): ChoiceState[] {
    return [...this.choiceHistory]
  }
}
```

### 7.3 对话打字效果

```typescript
interface TypewriterState {
  fullText: string
  displayedText: string
  isTyping: boolean
  speed: number  // 字/秒
}

function useTypewriter(options: { speed?: number } = {}) {
  const state = reactive<TypewriterState>({
    fullText: '',
    displayedText: '',
    isTyping: false,
    speed: options.speed ?? 30
  })
  
  let timer: number | null = null
  
  function start(text: string) {
    stop()
    state.fullText = text
    state.displayedText = ''
    state.isTyping = true
    
    const interval = 1000 / state.speed
    let index = 0
    
    timer = window.setInterval(() => {
      if (index < state.fullText.length) {
        state.displayedText += state.fullText[index]
        index++
      } else {
        complete()
      }
    }, interval)
  }
  
  function complete() {
    stop()
    state.displayedText = state.fullText
  }
  
  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    state.isTyping = false
  }
  
  return {
    state,
    start,
    complete,
    stop
  }
}
```

---

## 八、测试用例

### 8.1 Tokenizer 测试

```typescript
describe('Tokenizer', () => {
  test('识别脚本 ID', () => {
    const tokens = tokenize('＄01-00-00-00-1-1')
    expect(tokens[0]).toEqual({
      type: 'SCRIPT_ID',
      value: '01-00-00-00-1-1',
      line: 0,
      raw: '＄01-00-00-00-1-1'
    })
  })
  
  test('识别命令', () => {
    const tokens = tokenize('[charaSet A 98001000 0 マシュ]')
    expect(tokens[0].type).toBe('COMMAND')
    expect(tokens[0].value).toBe('[charaSet A 98001000 0 マシュ]')
  })
  
  test('识别说话者 (带槽位)', () => {
    const tokens = tokenize('＠A：マシュ')
    expect(tokens[0].type).toBe('SPEAKER')
    expect(tokens[0].value).toBe('A：マシュ')
  })
  
  test('识别选项', () => {
    const tokens = tokenize('？1：选项文本')
    expect(tokens[0].type).toBe('CHOICE')
  })
  
  test('识别选项结束', () => {
    const tokens = tokenize('？！')
    expect(tokens[0].type).toBe('CHOICE_END')
  })
})
```

### 8.2 命令解析测试

```typescript
describe('Command Parser', () => {
  test('charaSet', () => {
    const cmd = parseCommand({ 
      type: 'COMMAND', 
      value: '[charaSet A 98001000 0 マシュ]',
      line: 0,
      raw: ''
    })
    expect(cmd).toEqual({
      name: 'charaset',
      args: ['A', '98001000', '0', 'マシュ'],
      raw: '[charaSet A 98001000 0 マシュ]'
    })
  })
  
  test('bgm with volume', () => {
    const cmd = parseCommand({
      type: 'COMMAND',
      value: '[bgm BGM_EVENT_01 0.8 1.0]',
      line: 0,
      raw: ''
    })
    expect(cmd).toEqual({
      name: 'bgm',
      args: ['BGM_EVENT_01', '0.8', '1.0'],
      raw: '[bgm BGM_EVENT_01 0.8 1.0]'
    })
  })
  
  test('scene with crossfade', () => {
    const cmd = parseCommand({
      type: 'COMMAND',
      value: '[scene 10000 ? 0.5]',
      line: 0,
      raw: ''
    })
    expect(cmd?.args).toEqual(['10000', '?', '0.5'])
  })
})
```

### 8.3 角色生命周期测试

```typescript
describe('Character Lifecycle', () => {
  test('charaSet 不显示角色', () => {
    const manager = new ScriptStateManager()
    
    manager.processComponent({
      type: ScriptComponentType.CHARA_SET,
      slot: 'A',
      charaGraphId: '98001000',
      position: 0,
      displayName: 'マシュ'
    })
    
    const state = manager.getCurrentState()
    expect(state.visibleCharacters.length).toBe(0)
    expect(state.slots.get('A')?.visible).toBe(false)
  })
  
  test('charaFadein 显示角色', () => {
    const manager = new ScriptStateManager()
    
    // 先预加载
    manager.processComponent({
      type: ScriptComponentType.CHARA_SET,
      slot: 'A',
      charaGraphId: '98001000',
      position: 0,
      displayName: 'マシュ'
    })
    
    // 再显示
    manager.processComponent({
      type: ScriptComponentType.CHARA_FADE_IN,
      slot: 'A',
      duration: 0
    })
    
    const state = manager.getCurrentState()
    expect(state.visibleCharacters.length).toBe(1)
    expect(state.visibleCharacters[0].slot).toBe('A')
    expect(state.visibleCharacters[0].visible).toBe(true)
  })
  
  test('charaFadeout 隐藏角色', () => {
    const manager = new ScriptStateManager()
    
    manager.processComponent({
      type: ScriptComponentType.CHARA_SET,
      slot: 'A',
      charaGraphId: '98001000',
      position: 0,
      displayName: 'マシュ'
    })
    
    manager.processComponent({
      type: ScriptComponentType.CHARA_FADE_IN,
      slot: 'A',
      duration: 0
    })
    
    manager.processComponent({
      type: ScriptComponentType.CHARA_FADE_OUT,
      slot: 'A',
      duration: 0.3
    })
    
    const state = manager.getCurrentState()
    expect(state.visibleCharacters.length).toBe(0)
    expect(state.slots.get('A')?.visible).toBe(false)
  })
})
```

### 8.4 对话文本解析测试

```typescript
describe('Dialogue Text Parser', () => {
  test('普通文本', () => {
    const components = parseDialogueText('こんにちは')
    expect(components).toEqual([
      { type: 'text', text: 'こんにちは' }
    ])
  })
  
  test('换行', () => {
    const components = parseDialogueText('一行目[r]二行目')
    expect(components).toEqual([
      { type: 'text', text: '一行目' },
      { type: 'newline' },
      { type: 'text', text: '二行目' }
    ])
  })
  
  test('玩家名', () => {
    const components = parseDialogueText('[%1]さん')
    expect(components).toEqual([
      { type: 'playerName' },
      { type: 'text', text: 'さん' }
    ])
  })
  
  test('Ruby 注音', () => {
    const components = parseDialogueText('[#魔力:マナ]が足りない')
    expect(components).toEqual([
      { type: 'ruby', text: '魔力', ruby: 'マナ' },
      { type: 'text', text: 'が足りない' }
    ])
  })
  
  test('颜色', () => {
    const components = parseDialogueText('普通[ff0000]赤色[-]普通')
    expect(components).toEqual([
      { type: 'text', text: '普通' },
      { type: 'text', text: '赤色', colorHex: 'ff0000' },
      { type: 'text', text: '普通' }
    ])
  })
  
  test('隐藏名', () => {
    const components = parseDialogueText('[servantName 100100:セイバー:アルトリア]が現れた')
    expect(components).toEqual([
      { 
        type: 'hiddenName', 
        svtId: 100100, 
        hiddenName: 'セイバー', 
        trueName: 'アルトリア' 
      },
      { type: 'text', text: 'が現れた' }
    ])
  })
})
```

### 8.5 完整脚本解析测试

```typescript
describe('Full Script Parsing', () => {
  const testScript = `＄01-00-00-00-1-1

[soundStopAll]
[scene 10000]
[charaSet A 98001000 0 ？？？]
[charaFadein A 0]

＠A：？？？
フォウ……？[r]キュウ……キュウ？
[k]

？1：無事なのか！？
？2：殺しますよ、とか言わなかった！？
？！

[end]`

  test('解析场景数量正确', () => {
    const parsed = parseScript(testScript)
    const manager = new ScriptStateManager()
    
    for (const comp of parsed.components) {
      manager.processComponent(comp)
    }
    
    const scenes = manager.getScenes()
    expect(scenes.length).toBe(2)  // 1 对话 + 1 选项
  })
  
  test('第一个场景是对话', () => {
    const parsed = parseScript(testScript)
    const manager = new ScriptStateManager()
    
    for (const comp of parsed.components) {
      manager.processComponent(comp)
    }
    
    const scenes = manager.getScenes()
    expect(scenes[0].sceneType).toBe('dialogue')
    expect(scenes[0].dialogue?.speaker).toBe('？？？')
    expect(scenes[0].visibleCharacters.length).toBe(1)
  })
  
  test('第二个场景是选项', () => {
    const parsed = parseScript(testScript)
    const manager = new ScriptStateManager()
    
    for (const comp of parsed.components) {
      manager.processComponent(comp)
    }
    
    const scenes = manager.getScenes()
    expect(scenes[1].sceneType).toBe('choice')
    expect(scenes[1].choices?.choices.length).toBe(2)
  })
})
```

---

## 九、已知问题与解决方案

### 9.1 charaSet vs charaFadein 混淆

**问题**: 早期实现错误地将 charaSet 当作显示角色的指令。

**解决方案**:
- charaSet: 只预加载角色数据，设置 `visible: false`
- charaFadein: 才是真正显示角色，设置 `visible: true`
- commitScene 时只返回 `visible: true` 的角色

### 9.2 多行对话处理

**问题**: 对话可能跨越多行，直到遇到 [k]。

**解决方案**:
```typescript
// 累积对话行
let dialogueLines: string[] = []
let currentSpeaker: ParsedSpeaker | null = null

for (const token of tokens) {
  if (token.type === 'SPEAKER') {
    currentSpeaker = parseSpeaker(token.value)
  } else if (token.type === 'TEXT') {
    dialogueLines.push(token.value)
  } else if (token.type === 'COMMAND') {
    const cmd = parseCommand(token)
    if (cmd?.name === 'k') {
      // 提交对话
      if (dialogueLines.length > 0) {
        commitDialogue(currentSpeaker, dialogueLines)
        dialogueLines = []
      }
    }
  }
}
```

### 9.3 选项后的分支处理

**问题**: 选项可能导致不同的分支路径。

**解决方案**:
- 使用 label/branch 指令追踪分支
- 每个选项记录其导向的 label
- 选择后跳转到对应分支

### 9.4 性能优化

**问题**: 大型脚本可能导致解析缓慢。

**解决方案**:
- 使用 Web Worker 进行后台解析
- 实现增量解析 (只解析可见范围)
- 缓存解析结果

---

## 附录 A: 常见脚本模式

### A.1 单人对话

```
[charaSet A 98001000 0 マシュ]
[charaFadein A 0]

＠A：マシュ
こんにちは、[%1]。
[k]
```

### A.2 双人对话

```
[charaSet A 98001000 0 マシュ]
[charaSet B 98003000 1 Dr.ロマン]
[charaFadein A 0]
[charaFadein B 0]

＠A：マシュ
センパイ、大丈夫ですか？
[k]

[charaTalk B]
＠B：Dr.ロマン
よかった、無事だったんだね。
[k]
```

### A.3 选项分支

```
＠マシュ
どちらにしますか？
[k]

？1：Aを選ぶ
？2：Bを選ぶ
？！

[label choice_a]
＠マシュ
Aですね。
[k]
[branch end]

[label choice_b]
＠マシュ
Bですね。
[k]

[label end]
```

### A.4 角色切换

```
[charaSet A 98001000 0 マシュ]
[charaFadein A 0]

＠A：マシュ
最初の台詞。
[k]

[charaFadeout A 0.3]
[charaSet B 98003000 1 ロマン]
[charaFadein B 0.3]

＠B：ロマン
次の台詞。
[k]
```

---

*文档完*
