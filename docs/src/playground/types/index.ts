/** FGO Story Reader - Core Types */

export interface SceneRendererOptions {
  baseWidth: number        // 舞台基础宽度 (1024)
  baseHeight: number       // 舞台基础高度 (626) 
  resolutionWidth: number  // 渲染分辨率宽度 (1024)
  resolutionHeight: number // 渲染分辨率高度 (768)
  displayHeight: number    // 角色显示高度 (768)
  defaultFaceSize?: number // 默认表情尺寸 (256)
  facePageWidth?: number   // 表情页宽度 (1024)
  maintainAspectRatio?: boolean
}

export interface Character {
  id: string
  name: string
  charaGraphId: number
  src: string
  posX: number              // 舞台位置 (0-1)
  charScale: number         // 缩放比例
  active: boolean           // 是否高亮
  face: number             // 表情编号 (0=无表情)
  imgWidth?: number        // 图片实际宽度
}

export interface SvtScript {
  offsetX: number          // 身体水平偏移
  offsetY: number          // 身体垂直偏移
  faceX: number           // 表情水平位置
  faceY: number           // 表情垂直位置
  faceSize?: number       // 表情尺寸 (fallback: 256)
}

export interface CharacterLayout {
  wrapper: {
    width: number
    height: number  
    left: number
    bottom: number
  }
  figure: {
    left: number
    backgroundSize: number
  }
  face?: {
    width: number
    height: number
    left: number
    top: number
    backgroundPositionX: number
    backgroundPositionY: number
    backgroundSize: number
  }
}

export interface SceneState {
  characters: Character[]
  background?: string
  stageWidth: number
  stageHeight: number
  scale: number
}

export interface DialogueMessage {
  speaker: string
  content: string
  voice?: string
  characterId?: string
}

export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
}

export interface WarInfo {
  id: number
  name: string
  banner?: string
}

export interface QuestInfo {
  id: number
  name: string
  warId: number
  type: 'main' | 'free' | 'interlude'
}

export interface AudioTrack {
  id: string
  url: string
  volume: number
  loop?: boolean
}

export interface FGOWar {
  id: number
  name: string
  longName: string
  banner?: string
  eventId: number
  startType: number
  status: string
}

export interface FGOQuest {
  id: number
  name: string
  type: string
  warId: number
  chapter: string | number
  placeName?: string
  phase: number
}

export interface FGOScript {
  scriptId?: string
  sceneType?: string
  speaker?: string
  content?: string
  voiceId?: string
  characterId?: string
  raw?: string
}

/** === Script Parser Types === */

export type SceneType = 'dialogue' | 'choice' | 'choice-only' | 'transition'

/** 角色槽位 - 区分预加载和可见状态 */
export interface CharacterSlot {
  slot: string                    // "A", "B", "C"...
  charaGraphId: string
  baseFace: number
  displayName: string
  // 运行时状态
  visible: boolean                // 是否可见 (charaFadein 后为 true)
  position: number                // 舞台位置 (0/1/2), -1 表示未设置
  currentFace: number             // 当前表情
  isActive: boolean               // 是否高亮（说话中）
  isSilhouette: boolean           // 是否剪影效果
}

/** 旧版兼容 - 已废弃，使用 CharacterSlot */
export interface CharacterState {
  slot: 'A' | 'B' | 'C'
  charaGraphId: number
  position: 0 | 1 | 2
  displayName: string
  face: number
  isActive: boolean
  isSilhouette?: boolean
}

export interface DialogueLine {
  speaker?: string
  text: string
  voice?: string
  slot?: string
}

export interface ChoiceOption {
  id: string
  text: string
  targetBranch: string
}

export interface AudioState {
  bgm?: string
  se?: string[]
}

export interface ParsedScene {
  id: string
  index: number
  background?: string
  characters: CharacterState[]
  dialogues: DialogueLine[]
  audio: AudioState
  choices?: ChoiceOption[]
  sceneType: SceneType
}

export interface ScriptMetadata {
  questId: number
  questPhase: number
  totalScenes: number
}

export interface ParsedScript {
  id: string
  region: string
  scenes: ParsedScene[]
  metadata: ScriptMetadata
}

/** === Story Player Types === */

export interface HistoryEntry {
  sceneIndex: number
  dialogueIndex: number
  timestamp: number
}

export interface PlayerState {
  script: ParsedScript
  currentSceneIndex: number
  currentDialogueIndex: number
  isTyping: boolean
  showChoices: boolean
  history: HistoryEntry[]
  choicesMade: Map<string, string>
}

export interface ChoiceDisplayConfig {
  showDialogueBox: boolean
  dialogueContent: string | null
  allowDialogueClick: boolean
  allowBackgroundClick: boolean
}

export interface FGOCharacterData {
  id: string
  name: string
  svtId: number
  charaGraphId: number
  src: string
  posX: number
  charScale: number
  active: boolean
  face: number
}

/** === Dialogue Component Types === */

export type DialogueComponentType =
  | 'text'
  | 'newline'
  | 'playerName'
  | 'ruby'
  | 'hiddenName'
  | 'gender'
  | 'line'
  | 'color'

export interface DialogueTextComponent {
  type: 'text'
  text: string
  colorHex?: string
}

export interface DialogueNewLineComponent {
  type: 'newline'
}

export interface DialoguePlayerNameComponent {
  type: 'playerName'
  colorHex?: string
}

export interface DialogueRubyComponent {
  type: 'ruby'
  text: string
  ruby: string
  colorHex?: string
}

/** Spoiler 效果 - 隐藏真名 */
export interface DialogueHiddenNameComponent {
  type: 'hiddenName'
  svtId: number
  hiddenName: string    // 显示的名字（伪名）
  trueName: string      // 真名（点击后显示）
  colorHex?: string
}

export interface DialogueGenderComponent {
  type: 'gender'
  male: DialogueComponent[]
  female: DialogueComponent[]
  colorHex?: string
}

export interface DialogueLineComponent {
  type: 'line'
  length: number
  colorHex?: string
}

export type DialogueComponent =
  | DialogueTextComponent
  | DialogueNewLineComponent
  | DialoguePlayerNameComponent
  | DialogueRubyComponent
  | DialogueHiddenNameComponent
  | DialogueGenderComponent
  | DialogueLineComponent

/** === Render State Types === */

export interface AudioRenderState {
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
  bgmMuted: boolean
  seMuted: boolean
}

export interface DialogueRenderState {
  speaker?: string
  speakerSlot?: string
  components: DialogueComponent[][]  // 多行对话
  voice?: string
}

export interface RenderState {
  background: string | null
  slots: Map<string, CharacterSlot>     // 所有预加载的角色
  visibleCharacters: CharacterSlot[]    // 当前可见的角色（已排序）
  currentDialogue: DialogueRenderState | null
  currentChoices: ChoiceOption[] | null
  audio: AudioRenderState
  sceneType: SceneType
}

/** === Interaction Config === */

export interface InteractionConfig {
  dialogueBoxVisible: boolean
  dialogueBoxClickable: boolean
  backgroundClickable: boolean
  choicesVisible: boolean
}

export const INTERACTION_MAP: Record<SceneType, InteractionConfig> = {
  'dialogue': {
    dialogueBoxVisible: true,
    dialogueBoxClickable: true,
    backgroundClickable: false,
    choicesVisible: false
  },
  'choice': {
    dialogueBoxVisible: true,
    dialogueBoxClickable: false,
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
    backgroundClickable: true,
    choicesVisible: false
  }
}
