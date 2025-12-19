# 脚本系统

> FGO 原始脚本格式、解析器实现、GalGame 交互逻辑

---

## 一、原始脚本格式

### 获取 URL

```
https://static.atlasacademy.io/{region}/Script/{prefix}/{scriptId}.txt
```

### 脚本结构

```
＄01-00-00-01-1-0          ← 脚本 ID (全角$)
│  │  │  │  │ └─ 序号
│  │  │  │  └─── 阶段
│  │  │  └────── 任务
│  │  └───────── 子章节
│  └──────────── 章节
└─────────────── 前缀 (01)

[soundStopAll]
[bgm BGM_NAME VOLUME]
[scene 背景ID]
[charaSet SLOT ID POS NAME]
[fadein black 1]
[wait fade]

＠角色名                    ← 说话者 (全角@)
对话内容[r]换行内容
[k]                         ← 等待点击

？1：选项一文本              ← 选项 (全角?)
？2：选项二文本
？！                        ← 选项结束标记

[end]
```

---

## 二、指令详解

### 说话者格式

| 格式 | 示例 | 说明 |
|------|------|------|
| `＠角色名` | `＠マシュ` | 已知角色 |
| `＠SLOT：名称` | `＠A：？？？` | 未知角色 (槽位标识) |
| `＠[%1]` | - | 玩家名称占位符 |

### 文本标记

| 标记 | 用途 | 示例 |
|------|------|------|
| `[r]` | 换行 | `こんにちは。[r]元気？` |
| `[k]` | 等待点击 | 场景分割点 |
| `[line N]` | 空 N 行 | `[line 3]` |
| `[#汉字:注音]` | Ruby | `[#魔力:マナ]` |
| `[%1]` | 玩家名 | 替换为「藤丸立香」|

### 场景控制

```
[scene 10710]                # 背景 ID
[fadein black/white N]       # 淡入
[fadeout black/white N]      # 淡出
[wipein TYPE N M]            # 擦入 (circleIn/downToUp/leftToRight)
[wipeout TYPE N M]           # 擦出
```

### 角色控制

```
[charaSet SLOT ID POS NAME]  # 设置角色 (A-H, charaGraphId, 0/1/2, 名称)
[charaFace SLOT FACE_ID]     # 切换表情
[charaFadein SLOT N POS?]    # 淡入
[charaFadeout SLOT N]        # 淡出
[charaTalk SLOT/on/off]      # 标记说话者
[charaShake SLOT ...]        # 震动
```

### 通信窗口

```
[communicationChara ID A B C D]    # 显示通信角色
[communicationCharaLoop ...]       # 循环
[communicationCharaFace FACE_ID]   # 表情
[communicationCharaClear]          # 关闭
```

### 音频

```
[bgm BGM_NAME VOLUME]        # 播放 BGM
[bgmStop BGM_NAME FADE]      # 停止 BGM
[se SE_NAME]                 # 音效
[soundStopAll]               # 停止全部
```

---

## 三、角色 ID 规律

### 特殊 NPC (98xxxxxx)

| ID | 角色 |
|----|------|
| 98001000 | 玛修 (便服) |
| 8001000 | 玛修 (战斗服) |
| 98002000 | フォウ |
| 98003000 | Dr.ロマン |
| 98003003 | Dr.ロマン (通信) |
| 98005000 | オルガマリー |
| 98007000 | ジャンヌ・オルタ |

### 从者 ID

```
格式: [collectionNo][ascension]001
示例: 5002001 = No.50 ジル (第1灵基)
```

---

## 四、解析器实现

### 数据结构

```typescript
interface ParsedScript {
  id: string
  region: string
  scenes: ParsedScene[]
}

interface ParsedScene {
  id: string
  index: number
  background?: string
  characters: CharacterState[]
  dialogues: DialogueLine[]
  choices?: ChoiceOption[]
  audio: { bgm?: string; se?: string[] }
  sceneType: 'dialogue' | 'choice' | 'choice-only' | 'transition'
}

interface CharacterState {
  slot: 'A' | 'B' | 'C'
  charaGraphId: number
  position: 0 | 1 | 2
  displayName: string
  face: number
  isActive: boolean
}

interface DialogueLine {
  speaker?: string
  text: string
  slot?: string
}

interface ChoiceOption {
  id: string
  text: string
  targetBranch: string
}
```

### 核心逻辑

```typescript
const PLAYER_NAME = '藤丸立香'

function tokenize(script: string): Token[] {
  // ＄ → SCRIPT_ID
  // [ → COMMAND
  // ＠ → SPEAKER
  // ？数字： → CHOICE
  // ？！ → CHOICE_END
  // 其他 → TEXT
}

function parseScript(raw: string): ParsedScript {
  const tokens = tokenize(raw)
  const builder = new SceneBuilder()
  
  for (const token of tokens) {
    switch (token.type) {
      case 'COMMAND': builder.handleCommand(...)
      case 'SPEAKER': builder.setSpeaker(...)
      case 'CHOICE': builder.addChoice(...)
      case 'CHOICE_END': builder.commitChoices()
      case 'TEXT': builder.addDialogue(...)
    }
  }
  
  return { scenes: builder.build() }
}
```

### 文本处理

```typescript
function formatText(text: string): string {
  return text
    .replace(/\[r\]/g, '\n')
    .replace(/\[line\s*\d*\]/g, '')
    .replace(/\[#([^:]+):([^\]]+)\]/g, '{$1|$2}')  // Ruby
    .replace(/\[%1\]/g, PLAYER_NAME)
}
```

---

## 五、GalGame 交互逻辑

### 状态机

```typescript
interface PlayerState {
  script: ParsedScript
  currentSceneIndex: number
  currentDialogueIndex: number
  isTyping: boolean
  showChoices: boolean
  history: HistoryEntry[]
  choicesMade: Map<string, string>
}

type PlayerAction = 
  | { type: 'CLICK_DIALOGUE' }
  | { type: 'CLICK_BACKGROUND' }
  | { type: 'SELECT_CHOICE'; optionId: string }
  | { type: 'GO_BACK' }
```

### 场景流转规则

| 场景类型 | 对话框 | 点击行为 |
|---------|--------|---------|
| dialogue | 显示当前对话 | 下一句 |
| choice | 显示上一句 | 禁用，等待选择 |
| choice-only | 隐藏 | 禁用 |
| transition | 隐藏 | 背景点击进入下一幕 |

### 选项逻辑

1. **显示时机**: 当前场景所有对话播放完毕后
2. **对话框内容**: 显示选项前的最后一句对话
3. **点击禁用**: 选项显示时禁用对话框和背景点击
4. **FGO 特性**: 选项不产生真正分支，只是不同对话反应

### 历史回退

```typescript
function goBack(state: PlayerState): PlayerState {
  if (state.history.length === 0) return state
  
  const last = state.history.pop()
  return {
    ...state,
    currentSceneIndex: last.sceneIndex,
    currentDialogueIndex: last.dialogueIndex,
    showChoices: false
  }
}
```

---

## 六、示例解析

### 输入

```
＄01-00-00-01-1-0

[scene 10000]
[charaSet A 8001000 0 マシュ]
[charaFace A 1]

＠マシュ
良かった。[r]目が覚めましたね先輩。
[k]

？1：無事なのか!?
？2：殺しますよ、とか言わなかった!?
？！

[charaFace A 7]
＠マシュ
……それについては後ほど説明します。
[k]
```

### 输出

```json
{
  "id": "01-00-00-01-1-0",
  "scenes": [
    {
      "id": "scene-0",
      "background": "10000",
      "characters": [{ "slot": "A", "charaGraphId": 8001000, "face": 1 }],
      "dialogues": [{ "speaker": "マシュ", "text": "良かった。\n目が覚めましたね先輩。" }],
      "sceneType": "dialogue"
    },
    {
      "id": "scene-1",
      "characters": [{ "slot": "A", "charaGraphId": 8001000, "face": 7 }],
      "dialogues": [{ "speaker": "マシュ", "text": "……それについては後ほど説明します。" }],
      "choices": [
        { "id": "1", "text": "無事なのか!?" },
        { "id": "2", "text": "殺しますよ、とか言わなかった!?" }
      ],
      "sceneType": "choice"
    }
  ]
}
```

