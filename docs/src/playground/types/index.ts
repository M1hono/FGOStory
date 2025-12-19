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
