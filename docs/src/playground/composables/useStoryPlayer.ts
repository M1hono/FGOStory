import { ref, computed, readonly, watch } from 'vue'
import type { 
  ParsedScript, 
  ParsedScene, 
  PlayerState, 
  HistoryEntry,
  ChoiceDisplayConfig 
} from '../types'

type PlayerAction = 
  | { type: 'CLICK_DIALOGUE' }
  | { type: 'CLICK_BACKGROUND' }
  | { type: 'SELECT_CHOICE'; optionId: string }
  | { type: 'GO_BACK' }

/** 获取场景显示配置 */
function getChoiceDisplayConfig(state: PlayerState): ChoiceDisplayConfig {
  const scene = state.script.scenes[state.currentSceneIndex]
  if (!scene) {
    return { showDialogueBox: false, dialogueContent: null, allowDialogueClick: false, allowBackgroundClick: true }
  }
  
  if (!state.showChoices) {
    return {
      showDialogueBox: scene.dialogues.length > 0,
      dialogueContent: scene.dialogues[state.currentDialogueIndex]?.text || null,
      allowDialogueClick: true,
      allowBackgroundClick: scene.sceneType === 'transition'
    }
  }
  
  const hasDialogue = scene.dialogues.length > 0
  const lastDialogue = hasDialogue ? scene.dialogues[scene.dialogues.length - 1] : null
  
  return {
    showDialogueBox: hasDialogue,
    dialogueContent: lastDialogue?.text || null,
    allowDialogueClick: false,
    allowBackgroundClick: false
  }
}

/** 推进对话 */
function advanceDialogue(state: PlayerState): PlayerState {
  const scene = state.script.scenes[state.currentSceneIndex]
  const nextDialogueIndex = state.currentDialogueIndex + 1
  
  if (nextDialogueIndex < scene.dialogues.length) {
    return {
      ...state,
      currentDialogueIndex: nextDialogueIndex,
      isTyping: true,
      history: [...state.history, {
        sceneIndex: state.currentSceneIndex,
        dialogueIndex: state.currentDialogueIndex,
        timestamp: Date.now()
      }]
    }
  }
  
  if (scene.choices?.length) {
    return { ...state, showChoices: true }
  }
  
  return advanceScene(state)
}

/** 推进场景 */
function advanceScene(state: PlayerState): PlayerState {
  const nextIndex = state.currentSceneIndex + 1
  
  if (nextIndex >= state.script.scenes.length) {
    return { ...state, currentSceneIndex: -1 }
  }
  
  return {
    ...state,
    currentSceneIndex: nextIndex,
    currentDialogueIndex: 0,
    isTyping: true,
    showChoices: false
  }
}

/** 查找分支场景 */
function findBranchScene(script: ParsedScript, branchId: string): number {
  for (let i = 0; i < script.scenes.length; i++) {
    if (script.scenes[i].id.includes(branchId)) {
      return i
    }
  }
  return 0
}

/** 回退一步 */
function goBack(state: PlayerState): PlayerState {
  if (state.history.length === 0) return state
  
  const lastEntry = state.history[state.history.length - 1]
  
  return {
    ...state,
    currentSceneIndex: lastEntry.sceneIndex,
    currentDialogueIndex: lastEntry.dialogueIndex,
    isTyping: false,
    showChoices: false,
    history: state.history.slice(0, -1)
  }
}

/** 状态机 reducer */
function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const scene = state.script.scenes[state.currentSceneIndex]
  if (!scene) return state
  
  switch (action.type) {
    case 'CLICK_DIALOGUE':
      if (state.showChoices) return state
      if (state.isTyping) return { ...state, isTyping: false }
      return advanceDialogue(state)
      
    case 'CLICK_BACKGROUND':
      if (scene.sceneType !== 'transition') return state
      return advanceScene(state)
      
    case 'SELECT_CHOICE':
      const newChoices = new Map(state.choicesMade)
      newChoices.set(scene.id, action.optionId)
      
      return {
        ...state,
        choicesMade: newChoices,
        history: [...state.history, {
          sceneIndex: state.currentSceneIndex,
          dialogueIndex: state.currentDialogueIndex,
          timestamp: Date.now()
        }],
        showChoices: false,
        currentSceneIndex: findBranchScene(state.script, action.optionId),
        currentDialogueIndex: 0,
        isTyping: true
      }
      
    case 'GO_BACK':
      return goBack(state)
      
    default:
      return state
  }
}

/** GalGame 风格剧情播放器 */
export function useStoryPlayer(script: ParsedScript) {
  const state = ref<PlayerState>({
    script,
    currentSceneIndex: 0,
    currentDialogueIndex: 0,
    isTyping: true,
    showChoices: false,
    history: [],
    choicesMade: new Map()
  })
  
  const currentScene = computed<ParsedScene | null>(() => 
    state.value.script.scenes[state.value.currentSceneIndex] ?? null
  )
  
  const currentDialogue = computed(() => 
    currentScene.value?.dialogues[state.value.currentDialogueIndex] ?? null
  )
  
  const currentSpeaker = computed(() =>
    currentDialogue.value?.speaker ?? null
  )
  
  const displayConfig = computed(() => 
    getChoiceDisplayConfig(state.value)
  )
  
  const isComplete = computed(() => 
    state.value.currentSceneIndex === -1
  )
  
  const progress = computed(() => ({
    current: state.value.currentSceneIndex + 1,
    total: state.value.script.scenes.length
  }))
  
  function dispatch(action: PlayerAction) {
    state.value = playerReducer(state.value, action)
  }
  
  function handleClick() {
    dispatch({ type: 'CLICK_DIALOGUE' })
  }
  
  function handleBackgroundClick() {
    dispatch({ type: 'CLICK_BACKGROUND' })
  }
  
  function selectChoice(optionId: string) {
    dispatch({ type: 'SELECT_CHOICE', optionId })
  }
  
  function goBackStep() {
    dispatch({ type: 'GO_BACK' })
  }
  
  function copyText(): string | null {
    const text = currentDialogue.value?.text
    if (text) {
      const plain = text
        .replace(/\{([^|]+)\|[^}]+\}/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(red|blue|gold):(.+?)\]/g, '$2')
      navigator.clipboard.writeText(plain)
      return plain
    }
    return null
  }
  
  function jumpToScene(index: number) {
    if (index >= 0 && index < state.value.script.scenes.length) {
      state.value = {
        ...state.value,
        currentSceneIndex: index,
        currentDialogueIndex: 0,
        isTyping: true,
        showChoices: false
      }
    }
  }
  
  function reset() {
    state.value = {
      script: state.value.script,
      currentSceneIndex: 0,
      currentDialogueIndex: 0,
      isTyping: true,
      showChoices: false,
      history: [],
      choicesMade: new Map()
    }
  }
  
  return {
    state: readonly(state),
    currentScene,
    currentDialogue,
    currentSpeaker,
    displayConfig,
    isComplete,
    progress,
    handleClick,
    handleBackgroundClick,
    selectChoice,
    goBack: goBackStep,
    copyText,
    jumpToScene,
    reset
  }
}

