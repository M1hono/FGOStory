import type { ParsedScript, ParsedScene, CharacterState, DialogueLine, ChoiceOption, SceneType, AudioState } from '../types'

const PLAYER_NAME = '藤丸立香'

type TokenType = 'SCRIPT_ID' | 'COMMAND' | 'SPEAKER' | 'CHOICE' | 'CHOICE_END' | 'TEXT'

interface Token {
  type: TokenType
  value: string
  line: number
}

/** 将原始脚本分词 */
function tokenize(script: string): Token[] {
  const lines = script.split('\n')
  const tokens: Token[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // 脚本 ID: ＄01-00-00-01-1-0
    if (line.startsWith('＄') || line.startsWith('$')) {
      tokens.push({ type: 'SCRIPT_ID', value: line.slice(1), line: i })
      continue
    }
    
    // 命令: [command args]
    if (line.startsWith('[')) {
      tokens.push({ type: 'COMMAND', value: line, line: i })
      continue
    }
    
    // 说话者: ＠角色名 或 ＠A：名称
    if (line.startsWith('＠') || line.startsWith('@')) {
      tokens.push({ type: 'SPEAKER', value: line.slice(1), line: i })
      continue
    }
    
    // 选项: ？1：文本
    if (line.match(/^[？?]\d+[：:]/)) {
      tokens.push({ type: 'CHOICE', value: line, line: i })
      continue
    }
    
    // 选项结束: ？！
    if (line === '？！' || line === '?!') {
      tokens.push({ type: 'CHOICE_END', value: line, line: i })
      continue
    }
    
    // 普通文本
    tokens.push({ type: 'TEXT', value: line, line: i })
  }
  
  return tokens
}

/** 解析命令 */
function parseCommand(value: string): { name: string; args: string[] } | null {
  const match = value.match(/\[(\w+)\s*(.*?)\]/)
  if (!match) return null
  return { name: match[1].toLowerCase(), args: match[2].trim().split(/\s+/).filter(Boolean) }
}

/** 解析说话者 */
function parseSpeaker(value: string): { speaker: string; slot?: string } {
  // 格式: A：名称 (带槽位)
  const slotMatch = value.match(/^([A-H])[：:](.+)$/)
  if (slotMatch) {
    return { speaker: slotMatch[2], slot: slotMatch[1] }
  }
  
  // 格式: [%1] (玩家名称)
  if (value === '[%1]' || value.includes('[%1]')) {
    return { speaker: PLAYER_NAME }
  }
  
  return { speaker: value }
}

/** 解析选项 */
function parseChoice(value: string): { id: string; text: string } | null {
  const match = value.match(/^[？?](\d+)[：:](.+)$/)
  if (!match) return null
  return { id: match[1], text: match[2] }
}

/** 处理文本格式 */
function formatText(text: string): string {
  return text
    .replace(/\[r\]/g, '\n')
    .replace(/\[line\s*\d*\]/g, '')
    .replace(/\[k\]/g, '')
    .replace(/\[#([^:]+):([^\]]+)\]/g, '{$1|$2}')
    .replace(/\[%1\]/g, PLAYER_NAME)
    .trim()
}

interface CharacterSlotInternal {
  slot: string
  charaGraphId: number
  position: number
  displayName: string
  baseFace: number
  currentFace: number
  visible: boolean        // 是否可见 (charaFadein 后为 true)
  isActive: boolean
  isSilhouette: boolean
}

class SceneBuilder {
  private scenes: ParsedScene[] = []
  private current: Partial<ParsedScene>
  private slots: Map<string, CharacterSlotInternal> = new Map()  // 预加载的角色槽位
  private sceneIndex = 0
  private lastBackground = ''
  private pendingChoices: ChoiceOption[] = []
  private currentSpeaker: string | undefined
  private currentSpeakerSlot: string | undefined
  
  constructor() {
    this.current = this.createEmptyScene()
  }
  
  private createEmptyScene(): Partial<ParsedScene> {
    return {
      id: `scene-${this.sceneIndex}`,
      index: this.sceneIndex,
      background: this.lastBackground,
      characters: [],
      dialogues: [],
      audio: {},
      sceneType: 'dialogue'
    }
  }
  
  handleCommand(name: string, args: string[]): void {
    switch (name) {
      case 'scene':
      case 'sceneset':
        this.current.background = args[0]
        this.lastBackground = args[0]
        break
        
      case 'charaset':
        // 预加载角色到槽位（不显示）
        this.preloadCharacter(args)
        break
        
      case 'charaface':
        this.setFace(args[0], parseInt(args[1]) || 0)
        break
        
      case 'charatalk':
        if (args[0] === 'off') {
          this.slots.forEach(c => c.isActive = false)
        } else if (args[0] === 'on') {
          // do nothing
        } else {
          this.setActiveSpeaker(args[0])
        }
        break
        
      case 'charafadein':
        // 显示角色（淡入）- 这才是真正让角色可见的指令
        this.showCharacter(args[0], parseInt(args[1]) || 0, parseInt(args[2]) || undefined)
        break
        
      case 'charafadeout':
        // 隐藏角色（淡出）
        this.hideCharacter(args[0])
        break
        
      case 'characlear':
        // 隐藏所有角色
        this.slots.forEach(c => c.visible = false)
        break
        
      case 'bgm':
        if (!this.current.audio) this.current.audio = {}
        this.current.audio.bgm = args[0]
        break
        
      case 'se':
        if (!this.current.audio) this.current.audio = {}
        if (!this.current.audio.se) this.current.audio.se = []
        this.current.audio.se.push(args[0])
        break
        
      case 'k':
      case 'page':
        this.commitScene()
        break
        
      case 'messageoff':
        // 消息关闭，可能进入过渡
        break
        
      case 'end':
        this.commitScene()
        break
    }
  }
  
  setSpeaker(speaker: string, slot?: string): void {
    this.currentSpeaker = speaker
    this.currentSpeakerSlot = slot
    
    if (slot) {
      this.setActiveSpeaker(slot)
    } else {
      this.slots.forEach((char) => {
        char.isActive = char.displayName === speaker
      })
    }
  }
  
  addDialogue(text: string): void {
    const formatted = formatText(text)
    if (!formatted) return
    
    if (!this.current.dialogues) this.current.dialogues = []
    this.current.dialogues.push({
      speaker: this.currentSpeaker,
      text: formatted,
      slot: this.currentSpeakerSlot
    })
  }
  
  addChoice(choice: ChoiceOption): void {
    this.pendingChoices.push(choice)
  }
  
  commitChoices(): void {
    if (this.pendingChoices.length === 0) return
    
    this.current.choices = [...this.pendingChoices]
    this.current.sceneType = (this.current.dialogues?.length ?? 0) > 0 ? 'choice' : 'choice-only'
    this.pendingChoices = []
  }
  
  /** 预加载角色到槽位（不显示） */
  private preloadCharacter(args: string[]): void {
    const [slot, id, pos, name] = args
    this.slots.set(slot, {
      slot,
      charaGraphId: parseInt(id),
      position: parseInt(pos),   // 保存初始位置，但不代表可见
      displayName: name,
      baseFace: 0,
      currentFace: 0,
      visible: false,            // 关键：预加载时不可见
      isActive: false,
      isSilhouette: false
    })
  }
  
  /** 显示角色（淡入） */
  private showCharacter(slot: string, duration: number, position?: number): void {
    const char = this.slots.get(slot)
    if (char) {
      char.visible = true        // 关键：fadein 使角色可见
      if (position !== undefined) {
        char.position = position
      }
    }
  }
  
  /** 隐藏角色（淡出） */
  private hideCharacter(slot: string): void {
    const char = this.slots.get(slot)
    if (char) {
      char.visible = false       // fadeout 隐藏角色
    }
  }
  
  private setFace(slot: string, face: number): void {
    const char = this.slots.get(slot)
    if (char) char.currentFace = face
  }
  
  private setActiveSpeaker(slot: string): void {
    this.slots.forEach(char => char.isActive = false)
    const char = this.slots.get(slot)
    if (char) char.isActive = true
  }
  
  private commitScene(): void {
    if (this.pendingChoices.length > 0) {
      this.commitChoices()
    }
    
    const hasContent = (this.current.dialogues?.length ?? 0) > 0 || (this.current.choices?.length ?? 0) > 0
    
    if (hasContent) {
      // 只包含可见的角色
      this.current.characters = Array.from(this.slots.values())
        .filter(c => c.visible)  // 关键：只返回可见角色
        .map(c => ({
          slot: c.slot as 'A' | 'B' | 'C',
          charaGraphId: c.charaGraphId,
          position: c.position as 0 | 1 | 2,
          displayName: c.displayName,
          face: c.currentFace,
          isActive: c.isActive,
          isSilhouette: c.isSilhouette
        }))
      this.scenes.push(this.current as ParsedScene)
      this.sceneIndex++
    }
    
    this.current = this.createEmptyScene()
    this.currentSpeaker = undefined
    this.currentSpeakerSlot = undefined
  }
  
  build(): ParsedScene[] {
    if ((this.current.dialogues?.length ?? 0) > 0 || this.pendingChoices.length > 0) {
      this.commitScene()
    }
    
    this.scenes.forEach((scene, i) => {
      scene.index = i
    })
    
    return this.scenes
  }
  
  /** 获取所有预加载的角色槽位（包括不可见的） */
  getAllSlots(): Map<string, CharacterSlotInternal> {
    return new Map(this.slots)
  }
}

/** 解析 FGO 原始脚本为结构化数据 */
export function parseScript(raw: string, scriptId?: string): ParsedScript {
  const tokens = tokenize(raw)
  const builder = new SceneBuilder()
  let detectedScriptId = scriptId || 'unknown'
  let textBuffer = ''
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    
    switch (token.type) {
      case 'SCRIPT_ID':
        detectedScriptId = token.value
        break
        
      case 'COMMAND':
        // 提交缓冲文本
        if (textBuffer) {
          builder.addDialogue(textBuffer)
          textBuffer = ''
        }
        
        const cmd = parseCommand(token.value)
        if (cmd) builder.handleCommand(cmd.name, cmd.args)
        break
        
      case 'SPEAKER':
        // 提交缓冲文本
        if (textBuffer) {
          builder.addDialogue(textBuffer)
          textBuffer = ''
        }
        
        const { speaker, slot } = parseSpeaker(token.value)
        builder.setSpeaker(speaker, slot)
        break
        
      case 'CHOICE':
        const choice = parseChoice(token.value)
        if (choice) {
          builder.addChoice({ ...choice, targetBranch: choice.id })
        }
        break
        
      case 'CHOICE_END':
        builder.commitChoices()
        break
        
      case 'TEXT':
        // 累积文本
        textBuffer += (textBuffer ? '\n' : '') + token.value
        break
    }
  }
  
  // 提交最后的文本
  if (textBuffer) {
    builder.addDialogue(textBuffer)
  }
  
  const scenes = builder.build()
  
  return {
    id: detectedScriptId,
    region: 'JP',
    scenes,
    metadata: {
      questId: 0,
      questPhase: 0,
      totalScenes: scenes.length
    }
  }
}

/** 加载并解析远程脚本 */
export async function loadScript(region: string, scriptId: string): Promise<ParsedScript> {
  const prefix = scriptId.slice(0, 2)
  const url = `https://static.atlasacademy.io/${region}/Script/${prefix}/${scriptId}.txt`
  
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Script not found: ${scriptId}`)
  
  const raw = await response.text()
  return parseScript(raw, scriptId)
}

export type { ParsedScript, ParsedScene, CharacterState, DialogueLine, ChoiceOption }
