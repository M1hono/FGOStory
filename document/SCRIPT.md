# 脚本系统

> FGO 原始脚本格式、解析器实现、GalGame 交互逻辑
> 
> 参考: [cipherallies/fgo-scripts-parser](https://github.com/cipherallies/fgo-scripts-parser)

---

## 一、原始脚本格式

### 获取 URL

```
https://static.atlasacademy.io/{region}/Script/{prefix}/{scriptId}.txt
https://assets.atlasacademy.io/GameData/{region}/Script/{prefix}/{scriptId}.txt
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
[bgm BGM_NAME VOLUME FADEIN]
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

## 二、组件类型枚举

```typescript
enum ScriptComponentType {
  UN_PARSED,
  // 角色
  CHARA_SET,
  CHARA_FACE,
  CHARA_FADE_IN,
  CHARA_FADE_OUT,
  // 对话
  DIALOGUE,
  CHOICES,
  // 音频
  SOUND_EFFECT,
  BGM,
  BGM_STOP,
  VOICE,
  // 场景
  BACKGROUND,
  WAIT,
  // 流程
  LABEL,
  BRANCH,
  BRANCH_QUEST_NOT_CLEAR,
  FLAG,
  // 对话文本子组件
  DIALOGUE_TEXT,
  DIALOGUE_NEW_LINE,
  DIALOGUE_PLAYER_NAME,
  DIALOGUE_LINE,
  DIALOGUE_GENDER,
  DIALOGUE_RUBY,
  DIALOGUE_HIDDEN_NAME,
}
```

---

## 三、类型定义

### 角色组件

```typescript
interface ScriptCharaSet {
  type: ScriptComponentType.CHARA_SET
  speakerCode: string       // "A", "B", "C"
  charaGraphId: string      // "8001000", "98003003"
  baseFace: number          // 初始表情
  baseName: string          // "マシュ", "Dr.ロマン"
}

interface ScriptCharaFace {
  type: ScriptComponentType.CHARA_FACE
  speakerCode: string
  face: number
}

interface ScriptCharaFadeIn {
  type: ScriptComponentType.CHARA_FADE_IN
  speakerCode: string
  durationSec: number
  face: number
}

interface ScriptCharaFadeOut {
  type: ScriptComponentType.CHARA_FADE_OUT
  speakerCode: string
  durationSec: number
}
```

### 对话组件

```typescript
interface DialogueSpeaker {
  name: string
  speakerCode?: string
  components: DialogueChildComponent[]
}

interface ScriptDialogue {
  type: ScriptComponentType.DIALOGUE
  speaker?: DialogueSpeaker
  lines: string[]
  components: DialogueChildComponent[][]
  voice?: ScriptSound
}

interface ScriptChoices {
  type: ScriptComponentType.CHOICES
  choices: ScriptChoice[]
}

interface ScriptChoice {
  id: number
  option: DialogueChildComponent[]
  results: ScriptChoiceChildComponent[]
}
```

### 对话文本子组件

```typescript
interface DialogueText {
  type: ScriptComponentType.DIALOGUE_TEXT
  text: string
  colorHex?: string
}

interface DialogueNewLine {
  type: ScriptComponentType.DIALOGUE_NEW_LINE
}

interface DialoguePlayerName {
  type: ScriptComponentType.DIALOGUE_PLAYER_NAME
  colorHex?: string
}

interface DialogueLine {
  type: ScriptComponentType.DIALOGUE_LINE
  length: number
  colorHex?: string
}

interface DialogueRuby {
  type: ScriptComponentType.DIALOGUE_RUBY
  text: string
  ruby?: string
  colorHex?: string
}

interface DialogueSpeakerHiddenName {
  type: ScriptComponentType.DIALOGUE_HIDDEN_NAME
  svtId: number
  hiddenName: string
  trueName: string
  colorHex?: string
}

interface DialogueGender {
  type: ScriptComponentType.DIALOGUE_GENDER
  male: DialogueBasicComponent[]
  female: DialogueBasicComponent[]
  colorHex?: string
}
```

### 音频组件

```typescript
interface ScriptSound {
  id: number
  name: string
  fileName: string
  notReleased: boolean
  audioAsset: string
}

interface ScriptSoundEffect {
  type: ScriptComponentType.SOUND_EFFECT
  soundEffect: ScriptSound
}

interface ScriptBgm {
  type: ScriptComponentType.BGM
  bgm: ScriptSound
  volumne?: number
  fadeinTime?: number
}

interface ScriptBgmStop {
  type: ScriptComponentType.BGM_STOP
  bgm: ScriptSound
  fadeoutTime: number
}

interface ScriptVoice {
  type: ScriptComponentType.VOICE
  voice: ScriptSound
}
```

### 场景组件

```typescript
interface ScriptBackground {
  type: ScriptComponentType.BACKGROUND
  backgroundAsset: string
  crossFadeDurationSec?: number
}

interface ScriptWait {
  type: ScriptComponentType.WAIT
  durationSec: number
}
```

---

## 四、解析器实现

### 参数解析

```typescript
function parseParameter(line: string): string[] {
  const noNewLine = line.replace(/[\r\n]/g, ' ').trim()
  return noNewLine
    .slice(1, -1)
    .match(/[^\s"]+|"([^"]*)"/g) ?? []
}

function splitLine(line: string): string[] {
  let word = '', wordList: string[] = [], openBracket = 0
  for (const char of line) {
    if (char === '[') {
      if (openBracket === 0) {
        if (word) wordList.push(word)
        word = '['
      } else word += '['
      openBracket++
    } else if (char === ']') {
      openBracket--
      if (openBracket === 0) {
        wordList.push(word + ']')
        word = ''
      } else word += ']'
    } else word += char
  }
  if (word) wordList.push(word)
  return wordList
}
```

### 对话行解析

```typescript
function parseDialogueLine(region: Region, line: string): DialogueChildComponent[] {
  let components: DialogueChildComponent[] = []
  let colorHex: string | undefined
  
  for (const word of splitLine(line)) {
    if (word[0] === '[') {
      // 颜色标记 [ff0000]
      const colorMatch = word.match(/\[([0-9a-f]{6})\]/)
      if (colorMatch) {
        colorHex = colorMatch[1]
        continue
      }
      // 重置颜色 [-]
      if (word[1] === '-') {
        colorHex = undefined
        continue
      }
    }
    components.push(parseDialogueWord(region, word, colorHex))
  }
  return components
}

function parseDialogueWord(region: Region, word: string, colorHex?: string): DialogueChildComponent {
  if (word[0] !== '[') {
    return { type: ScriptComponentType.DIALOGUE_TEXT, text: word, colorHex }
  }
  
  const params = parseParameter(word)
  switch (params[0]) {
    case 'r':
    case 'sr':
      return { type: ScriptComponentType.DIALOGUE_NEW_LINE }
    case '%1':
      return { type: ScriptComponentType.DIALOGUE_PLAYER_NAME, colorHex }
    case 'line':
      return { type: ScriptComponentType.DIALOGUE_LINE, length: parseInt(params[1]), colorHex }
  }
  
  // Ruby [#汉字:注音]
  if (word[1] === '#') {
    const [text, ruby] = word.slice(2, -1).split(':')
    return { type: ScriptComponentType.DIALOGUE_RUBY, text, ruby, colorHex }
  }
  
  // Gender [&male:female]
  if (word[1] === '&') {
    const [male, female] = word.slice(2, -1).split(/:(?=[^\]]*(?:\[|$))/)
    return {
      type: ScriptComponentType.DIALOGUE_GENDER,
      male: splitLine(male).map(w => parseDialogueBasic(w)),
      female: splitLine(female).map(w => parseDialogueBasic(w)),
      colorHex
    }
  }
  
  return parseBracketComponent(region, params)
}
```

### 括号组件解析

```typescript
function parseBracketComponent(region: Region, params: string[]): ScriptBracketComponent {
  switch (params[0]) {
    case 'charaSet':
      return {
        type: ScriptComponentType.CHARA_SET,
        speakerCode: params[1],
        charaGraphId: params[2],
        baseFace: parseInt(params[3]),
        baseName: params[4]
      }
    case 'charaFace':
      return {
        type: ScriptComponentType.CHARA_FACE,
        speakerCode: params[1],
        face: parseInt(params[2])
      }
    case 'scene':
      return {
        type: ScriptComponentType.BACKGROUND,
        backgroundAsset: `${AssetHost}/${region}/Back/back${params[1]}.png`,
        crossFadeDurationSec: params[3] ? parseFloat(params[3]) : undefined
      }
    case 'bgm':
      return {
        type: ScriptComponentType.BGM,
        bgm: getBgmObject(params[1], `${AssetHost}/${region}/Audio/${params[1]}/${params[1]}.mp3`),
        volumne: params[2] ? parseFloat(params[2]) : undefined,
        fadeinTime: params[3] ? parseFloat(params[3]) : undefined
      }
    case 'se':
      return {
        type: ScriptComponentType.SOUND_EFFECT,
        soundEffect: getBgmObject(params[1], getSoundEffectUrl(region, params[1]))
      }
    case 'wt':
      return {
        type: ScriptComponentType.WAIT,
        durationSec: parseFloat(params[1])
      }
    default:
      return { type: ScriptComponentType.UN_PARSED, parameters: params }
  }
}
```

### 音效 URL 构建

```typescript
function getSoundEffectUrl(region: Region, fileName: string): string {
  let folder = 'SE'
  switch (fileName.slice(0, 2)) {
    case 'ba': folder = 'Battle'; break
    case 'ad': folder = 'SE'; break
    case 'ar': folder = 'ResidentSE'; break
    case '21': folder = 'SE_21'; break
  }
  return `${AssetHost}/${region}/Audio/${folder}/${fileName}.mp3`
}
```

### 主解析函数

```typescript
function parseScript(region: Region, script: string): ScriptInfo {
  const components: ScriptComponent[] = []
  let dialogue: ScriptDialogue = createEmptyDialogue()
  let choices: ScriptChoice[] = []
  let choice: ScriptChoice = createEmptyChoice()
  let state = { choice: false, dialogue: false }
  
  const lineEnding = script.includes('\r\n') ? '\r\n' : '\n'
  
  for (const line of script.split(lineEnding)) {
    switch (line[0]) {
      case '＄': break  // 脚本 ID 行
      
      case '[':
        const params = parseParameter(line)
        if (params[0] === 'k') {
          // 等待点击 → 提交对话
          dialogue.components = dialogue.lines.map(l => parseDialogueLine(region, l))
          if (state.choice) choice.results.push({ ...dialogue })
          else components.push({ ...dialogue })
          state.dialogue = false
          resetDialogue(dialogue)
        } else if (params[0] === 'tVoice') {
          // 语音
          dialogue.voice = getBgmObject(params[2], `${AssetHost}/${region}/Audio/${params[1]}/${params[2]}.mp3`)
        } else if (state.dialogue) {
          dialogue.lines.push(line)
        } else {
          const comp = parseBracketComponent(region, params)
          if (state.choice) choice.results.push(comp)
          else components.push(comp)
        }
        break
      
      case '＠':  // 说话者
        state.dialogue = true
        dialogue.speaker = parseDialogueSpeaker(region, line)
        break
      
      case '？':  // 选项
        if (line[1] === '！') {
          // 选项结束
          choices.push({ ...choice })
          components.push({ type: ScriptComponentType.CHOICES, choices })
          resetChoice(choice)
          choices = []
          state.choice = false
        } else {
          const choiceId = parseInt(line[1])
          if (choiceId !== choice.id && choice.id !== -1) {
            choices.push({ ...choice })
          }
          choice.id = choiceId
          choice.option = parseDialogueLine(region, line.slice(3))
          choice.results = []
          state.choice = true
        }
        break
      
      default:
        if (line) dialogue.lines.push(line)
    }
  }
  
  return { components }
}
```

---

## 五、GalGame 交互逻辑

### 状态机

```typescript
interface PlayerState {
  script: ScriptInfo
  componentIndex: number
  dialogueLineIndex: number
  isTyping: boolean
  showChoices: boolean
  history: HistoryEntry[]
}

type PlayerAction = 
  | { type: 'CLICK_DIALOGUE' }
  | { type: 'CLICK_BACKGROUND' }
  | { type: 'SELECT_CHOICE'; choiceId: number }
  | { type: 'GO_BACK' }
```

### 场景流转

| 场景类型 | 对话框 | 点击行为 |
|---------|--------|---------|
| DIALOGUE | 显示当前对话 | 下一句/完成打字 |
| CHOICES | 显示上一句 | 禁用，等待选择 |
| BACKGROUND | 隐藏 | 背景点击进入下一幕 |

### 玩家名称

```typescript
const PLAYER_NAME = '藤丸立香'

function renderDialogue(components: DialogueChildComponent[]): string {
  return components.map(c => {
    switch (c.type) {
      case ScriptComponentType.DIALOGUE_TEXT:
        return c.text
      case ScriptComponentType.DIALOGUE_NEW_LINE:
        return '\n'
      case ScriptComponentType.DIALOGUE_PLAYER_NAME:
        return PLAYER_NAME
      case ScriptComponentType.DIALOGUE_RUBY:
        return `{${c.text}|${c.ruby}}`
      default:
        return ''
    }
  }).join('')
}
```

---

## 六、测试用例

### 输入

```
＄01-00-00-01-1-0

[scene 10000]
[charaSet A 8001000 0 マシュ]
[charaFace A 1]
[bgm BGM_EVENT_1 0.8]

＠マシュ
良かった。[r]目が覚めましたね[%1]。
[k]

？1：無事なのか!?
？2：殺しますよ、とか言わなかった!?
？！
```

### 输出

```json
{
  "components": [
    {
      "type": "BACKGROUND",
      "backgroundAsset": "https://assets.atlasacademy.io/GameData/JP/Back/back10000.png"
    },
    {
      "type": "CHARA_SET",
      "speakerCode": "A",
      "charaGraphId": "8001000",
      "baseFace": 0,
      "baseName": "マシュ"
    },
    {
      "type": "BGM",
      "bgm": { "name": "BGM_EVENT_1", "audioAsset": "..." },
      "volumne": 0.8
    },
    {
      "type": "DIALOGUE",
      "speaker": { "name": "マシュ" },
      "components": [[
        { "type": "DIALOGUE_TEXT", "text": "良かった。" },
        { "type": "DIALOGUE_NEW_LINE" },
        { "type": "DIALOGUE_TEXT", "text": "目が覚めましたね" },
        { "type": "DIALOGUE_PLAYER_NAME" },
        { "type": "DIALOGUE_TEXT", "text": "。" }
      ]]
    },
    {
      "type": "CHOICES",
      "choices": [
        { "id": 1, "option": [{ "type": "DIALOGUE_TEXT", "text": "無事なのか!?" }] },
        { "id": 2, "option": [{ "type": "DIALOGUE_TEXT", "text": "殺しますよ、とか言わなかった!?" }] }
      ]
    }
  ]
}
```
