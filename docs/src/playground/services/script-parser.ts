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

class SceneBuilder {
  private scenes: ParsedScene[] = []
  private current: Partial<ParsedScene>
  private characters: Map<string, CharacterState> = new Map()
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
        this.setCharacter(args)
        break
        
      case 'charaface':
        this.setFace(args[0], parseInt(args[1]) || 0)
        break
        
      case 'charatalk':
        if (args[0] === 'off') {
          this.characters.forEach(c => c.isActive = false)
        } else if (args[0] === 'on') {
          // do nothing
        } else {
          this.setActiveSpeaker(args[0])
        }
        break
        
      case 'charafadein':
        // 角色淡入，更新位置
        if (args[2]) {
          const char = this.characters.get(args[0])
          if (char) char.position = parseInt(args[2]) as 0 | 1 | 2
        }
        break
        
      case 'charafadeout':
        // 角色淡出，但不移除
        break
        
      case 'characlear':
        this.characters.clear()
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
    
    // 设置说话者为活跃
    if (slot) {
      this.setActiveSpeaker(slot)
    } else {
      // 尝试通过名称匹配
      this.characters.forEach((char, s) => {
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
  
  private setCharacter(args: string[]): void {
    const [slot, id, pos, name] = args
    this.characters.set(slot, {
      slot: slot as 'A' | 'B' | 'C',
      charaGraphId: parseInt(id),
      position: parseInt(pos) as 0 | 1 | 2,
      displayName: name,
      face: 0,
      isActive: false
    })
  }
  
  private setFace(slot: string, face: number): void {
    const char = this.characters.get(slot)
    if (char) char.face = face
  }
  
  private setActiveSpeaker(slot: string): void {
    this.characters.forEach(char => char.isActive = false)
    const char = this.characters.get(slot)
    if (char) char.isActive = true
  }
  
  private commitScene(): void {
    // 提交待处理的选项
    if (this.pendingChoices.length > 0) {
      this.commitChoices()
    }
    
    // 只有有内容的场景才提交
    const hasContent = (this.current.dialogues?.length ?? 0) > 0 || (this.current.choices?.length ?? 0) > 0
    
    if (hasContent) {
      this.current.characters = Array.from(this.characters.values()).map(c => ({ ...c }))
      this.scenes.push(this.current as ParsedScene)
      this.sceneIndex++
    }
    
    // 重置当前场景
    this.current = this.createEmptyScene()
    this.currentSpeaker = undefined
    this.currentSpeakerSlot = undefined
  }
  
  build(): ParsedScene[] {
    // 确保最后一个场景被提交
    if ((this.current.dialogues?.length ?? 0) > 0 || this.pendingChoices.length > 0) {
      this.commitScene()
    }
    
    // 设置总场景数
    this.scenes.forEach(scene => {
      scene.index = this.scenes.indexOf(scene)
    })
    
    return this.scenes
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
