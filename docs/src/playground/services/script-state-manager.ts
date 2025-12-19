import type { 
  CharacterSlot, 
  RenderState, 
  DialogueRenderState, 
  AudioRenderState,
  ChoiceOption,
  SceneType,
  DialogueComponent
} from '../types'

const AssetHost = 'https://assets.atlasacademy.io/GameData'
const PLAYER_NAME = '藤丸立香'

type Region = 'JP' | 'NA' | 'CN' | 'TW' | 'KR'

interface ScriptComponent {
  type: string
  [key: string]: unknown
}

/**
 * 管理脚本解析后的运行时状态
 * 核心职责：将 ScriptComponent[] 转换为 RenderState
 */
export class ScriptStateManager {
  private region: Region
  private slots = new Map<string, CharacterSlot>()
  private background: string | null = null
  private audio: AudioRenderState = {
    bgm: null,
    se: [],
    voice: null,
    bgmMuted: false,
    seMuted: false
  }
  private currentDialogue: DialogueRenderState | null = null
  private currentChoices: ChoiceOption[] | null = null
  private sceneType: SceneType = 'dialogue'

  constructor(region: Region = 'JP') {
    this.region = region
  }

  /**
   * 处理单个脚本组件，更新状态
   */
  processComponent(comp: ScriptComponent): void {
    switch (comp.type) {
      case 'CHARA_SET':
        this.handleCharaSet(comp)
        break
      case 'CHARA_FADE_IN':
        this.handleCharaFadeIn(comp)
        break
      case 'CHARA_FADE_OUT':
        this.handleCharaFadeOut(comp)
        break
      case 'CHARA_FACE':
        this.handleCharaFace(comp)
        break
      case 'CHARA_CLEAR':
        this.handleCharaClear()
        break
      case 'BACKGROUND':
        this.handleBackground(comp)
        break
      case 'BGM':
        this.handleBgm(comp)
        break
      case 'BGM_STOP':
        this.handleBgmStop()
        break
      case 'SOUND_EFFECT':
        this.handleSoundEffect(comp)
        break
      case 'VOICE':
        this.handleVoice(comp)
        break
      case 'DIALOGUE':
        this.handleDialogue(comp)
        break
      case 'CHOICES':
        this.handleChoices(comp)
        break
    }
  }

  /**
   * 预加载角色到槽位（不显示）
   */
  private handleCharaSet(comp: ScriptComponent): void {
    const slot = comp.speakerCode as string
    this.slots.set(slot, {
      slot,
      charaGraphId: String(comp.charaGraphId),
      baseFace: Number(comp.baseFace) || 0,
      displayName: String(comp.baseName) || '???',
      visible: false,      // 关键：默认不可见
      position: -1,
      currentFace: Number(comp.baseFace) || 0,
      isActive: false,
      isSilhouette: false
    })
  }

  /**
   * 显示角色（淡入）
   */
  private handleCharaFadeIn(comp: ScriptComponent): void {
    const slot = comp.speakerCode as string
    const char = this.slots.get(slot)
    if (char) {
      char.visible = true   // 关键：fadein 使角色可见
      char.position = Number(comp.position) ?? 1
      if (comp.face !== undefined) {
        char.currentFace = Number(comp.face)
      }
    }
  }

  /**
   * 隐藏角色（淡出）
   */
  private handleCharaFadeOut(comp: ScriptComponent): void {
    const slot = comp.speakerCode as string
    const char = this.slots.get(slot)
    if (char) {
      char.visible = false  // fadeout 隐藏角色
    }
  }

  /**
   * 设置角色表情
   */
  private handleCharaFace(comp: ScriptComponent): void {
    const slot = comp.speakerCode as string
    const char = this.slots.get(slot)
    if (char) {
      char.currentFace = Number(comp.face) || 0
    }
  }

  /**
   * 清除所有角色
   */
  private handleCharaClear(): void {
    this.slots.forEach(char => {
      char.visible = false
    })
  }

  /**
   * 设置背景
   */
  private handleBackground(comp: ScriptComponent): void {
    this.background = String(comp.backgroundAsset)
  }

  /**
   * 播放 BGM
   */
  private handleBgm(comp: ScriptComponent): void {
    const bgm = comp.bgm as { name: string; audioAsset: string }
    this.audio.bgm = {
      id: bgm.name,
      url: bgm.audioAsset,
      volume: Number(comp.volumne) || 1,
      playing: true
    }
  }

  /**
   * 停止 BGM
   */
  private handleBgmStop(): void {
    if (this.audio.bgm) {
      this.audio.bgm.playing = false
    }
  }

  /**
   * 播放音效
   */
  private handleSoundEffect(comp: ScriptComponent): void {
    const se = comp.soundEffect as { name: string; audioAsset: string }
    this.audio.se.push({
      id: se.name,
      url: se.audioAsset
    })
  }

  /**
   * 播放语音
   */
  private handleVoice(comp: ScriptComponent): void {
    const voice = comp.voice as { name: string; audioAsset: string }
    this.audio.voice = {
      id: voice.name,
      url: voice.audioAsset
    }
  }

  /**
   * 处理对话
   */
  private handleDialogue(comp: ScriptComponent): void {
    const speaker = comp.speaker as { name: string; speakerCode?: string } | undefined
    const components = comp.components as unknown[][]
    
    // 设置当前说话者为活跃状态
    if (speaker?.speakerCode) {
      this.setActiveSpeaker(speaker.speakerCode)
    }
    
    this.currentDialogue = {
      speaker: speaker?.name,
      speakerSlot: speaker?.speakerCode,
      components: components.map(line => this.parseDialogueComponents(line)),
      voice: this.audio.voice?.url
    }
    
    this.sceneType = 'dialogue'
    this.currentChoices = null
  }

  /**
   * 处理选项
   */
  private handleChoices(comp: ScriptComponent): void {
    const choices = comp.choices as { id: number; option: unknown[] }[]
    
    this.currentChoices = choices.map(choice => ({
      id: String(choice.id),
      text: this.renderDialogueToText(choice.option),
      targetBranch: String(choice.id)
    }))
    
    // 有对话时显示上一句，无对话时只显示选项
    this.sceneType = this.currentDialogue ? 'choice' : 'choice-only'
  }

  /**
   * 设置活跃说话者
   */
  private setActiveSpeaker(slot: string): void {
    this.slots.forEach(char => {
      char.isActive = char.slot === slot
    })
  }

  /**
   * 解析对话组件
   */
  private parseDialogueComponents(components: unknown[]): DialogueComponent[] {
    return (components as Array<{ type: string; [key: string]: unknown }>).map(comp => {
      switch (comp.type) {
        case 'DIALOGUE_TEXT':
          return { type: 'text' as const, text: String(comp.text), colorHex: comp.colorHex as string | undefined }
        case 'DIALOGUE_NEW_LINE':
          return { type: 'newline' as const }
        case 'DIALOGUE_PLAYER_NAME':
          return { type: 'playerName' as const, colorHex: comp.colorHex as string | undefined }
        case 'DIALOGUE_RUBY':
          return { 
            type: 'ruby' as const, 
            text: String(comp.text), 
            ruby: String(comp.ruby),
            colorHex: comp.colorHex as string | undefined 
          }
        case 'DIALOGUE_HIDDEN_NAME':
          return {
            type: 'hiddenName' as const,
            svtId: Number(comp.svtId),
            hiddenName: String(comp.hiddenName),
            trueName: String(comp.trueName),
            colorHex: comp.colorHex as string | undefined
          }
        case 'DIALOGUE_GENDER':
          return {
            type: 'gender' as const,
            male: this.parseDialogueComponents(comp.male as unknown[]),
            female: this.parseDialogueComponents(comp.female as unknown[]),
            colorHex: comp.colorHex as string | undefined
          }
        case 'DIALOGUE_LINE':
          return {
            type: 'line' as const,
            length: Number(comp.length),
            colorHex: comp.colorHex as string | undefined
          }
        default:
          return { type: 'text' as const, text: '' }
      }
    })
  }

  /**
   * 将对话组件渲染为纯文本
   */
  private renderDialogueToText(components: unknown[]): string {
    return (components as Array<{ type: string; [key: string]: unknown }>).map(comp => {
      switch (comp.type) {
        case 'DIALOGUE_TEXT':
          return String(comp.text)
        case 'DIALOGUE_NEW_LINE':
          return '\n'
        case 'DIALOGUE_PLAYER_NAME':
          return PLAYER_NAME
        case 'DIALOGUE_RUBY':
          return String(comp.text)
        case 'DIALOGUE_HIDDEN_NAME':
          return String(comp.hiddenName)
        default:
          return ''
      }
    }).join('')
  }

  /**
   * 清除音效队列
   */
  clearSoundEffects(): void {
    this.audio.se = []
    this.audio.voice = null
  }

  /**
   * 设置 BGM 静音
   */
  setBgmMuted(muted: boolean): void {
    this.audio.bgmMuted = muted
  }

  /**
   * 设置音效静音
   */
  setSeMuted(muted: boolean): void {
    this.audio.seMuted = muted
  }

  /**
   * 获取当前渲染状态
   */
  getCurrentRenderState(): RenderState {
    return {
      background: this.background,
      slots: new Map(this.slots),
      visibleCharacters: Array.from(this.slots.values())
        .filter(c => c.visible)
        .sort((a, b) => a.position - b.position),
      currentDialogue: this.currentDialogue,
      currentChoices: this.currentChoices,
      audio: { ...this.audio, se: [...this.audio.se] },
      sceneType: this.sceneType
    }
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.slots.clear()
    this.background = null
    this.audio = {
      bgm: null,
      se: [],
      voice: null,
      bgmMuted: false,
      seMuted: false
    }
    this.currentDialogue = null
    this.currentChoices = null
    this.sceneType = 'dialogue'
  }
}

/**
 * 将 DialogueComponent 数组渲染为 HTML
 */
export function renderDialogueToHtml(components: DialogueComponent[]): string {
  return components.map(comp => {
    switch (comp.type) {
      case 'text':
        const style = comp.colorHex ? `style="color:#${comp.colorHex}"` : ''
        return `<span ${style}>${escapeHtml(comp.text)}</span>`
      case 'newline':
        return '<br>'
      case 'playerName':
        const pStyle = comp.colorHex ? `style="color:#${comp.colorHex}"` : ''
        return `<span class="player-name" ${pStyle}>${PLAYER_NAME}</span>`
      case 'ruby':
        const rStyle = comp.colorHex ? `style="color:#${comp.colorHex}"` : ''
        return `<ruby ${rStyle}>${escapeHtml(comp.text)}<rt>${escapeHtml(comp.ruby)}</rt></ruby>`
      case 'hiddenName':
        return `<span class="spoiler-text" data-svt-id="${comp.svtId}" data-true-name="${escapeHtml(comp.trueName)}">${escapeHtml(comp.hiddenName)}</span>`
      case 'line':
        return '<span class="dialogue-line"></span>'.repeat(comp.length)
      case 'gender':
        // 默认使用女性文本（可根据设置切换）
        return renderDialogueToHtml(comp.female)
      default:
        return ''
    }
  }).join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export { PLAYER_NAME }

