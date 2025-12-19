import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { Character, CharacterLayout, SceneRendererOptions, SceneState, SvtScript } from '../types'

const DEFAULT_CONFIG: SceneRendererOptions = {
  baseWidth: 1024,
  baseHeight: 626,
  resolutionWidth: 1024,
  resolutionHeight: 768,
  displayHeight: 768,
  defaultFaceSize: 256,
  facePageWidth: 1024,
  maintainAspectRatio: true
}

export function useSceneRenderer(
  stageRef: Ref<HTMLElement | undefined>,
  options?: Partial<SceneRendererOptions>
) {
  const config = { ...DEFAULT_CONFIG, ...options }
  
  const stageWidth = ref(config.baseWidth)
  const stageHeight = ref(config.baseHeight)
  const isReady = ref(false)
  const characterLayouts = ref<Map<string, CharacterLayout>>(new Map())
  
  const sceneState = ref<SceneState>({
    characters: [],
    background: undefined,
    stageWidth: config.baseWidth,
    stageHeight: config.baseHeight,
    scale: 1
  })
  
  const scale = computed(() => stageWidth.value / config.baseWidth)
  
  const stageStyles = computed(() => ({
    width: `${stageWidth.value}px`,
    height: `${stageHeight.value}px`,
    '--stage-width': `${stageWidth.value}px`,
    '--stage-height': `${stageHeight.value}px`
  }))
  
  function updateStageDimensions() {
    if (!stageRef.value) return
    
    const container = stageRef.value.parentElement
    if (!container) return
    
    const maxWidth = container.clientWidth
    const maxHeight = container.clientHeight
    const aspectRatio = config.baseWidth / config.baseHeight
    
    if (config.maintainAspectRatio) {
      if (maxWidth / maxHeight > aspectRatio) {
        stageHeight.value = maxHeight
        stageWidth.value = maxHeight * aspectRatio
      } else {
        stageWidth.value = maxWidth
        stageHeight.value = maxWidth / aspectRatio
      }
    } else {
      stageWidth.value = maxWidth
      stageHeight.value = maxHeight
    }
    
    sceneState.value.stageWidth = stageWidth.value
    sceneState.value.stageHeight = stageHeight.value
    sceneState.value.scale = scale.value
    
    updateAllLayouts()
    isReady.value = true
  }
  
  function calculateLayout(char: Character, script?: SvtScript): CharacterLayout {
    const svtScript = script || { offsetX: 0, offsetY: 0, faceX: 0, faceY: 0, faceSize: 256 }
    const charScale = (stageWidth.value / config.baseWidth) * char.charScale
    const figureWidth = char.imgWidth || config.resolutionWidth
    
    const wrapperWidth = config.resolutionWidth * charScale
    const wrapperHeight = config.displayHeight * charScale
    const charCenterX = stageWidth.value * char.posX
    const wrapperLeft = charCenterX - wrapperWidth / 2
    
    const figureLeft = ((config.resolutionWidth - figureWidth) / 2 + (svtScript.offsetX || 0)) * charScale
    const figureBackgroundSize = charScale * figureWidth
    
    let face: CharacterLayout['face'] = undefined
    if (char.face > 0 && svtScript.faceX !== undefined) {
      const faceIndex = char.face - 1
      const faceSize = svtScript.faceSize || config.defaultFaceSize || 256
      const perRow = Math.floor((config.facePageWidth || 1024) / faceSize)
      const col = faceIndex % perRow
      const row = Math.floor(faceIndex / perRow)
      
      const srcOffsetY = config.displayHeight + row * faceSize
      const srcOffsetX = col * faceSize
      
      face = {
        backgroundPositionX: -srcOffsetX * charScale,
        backgroundPositionY: -srcOffsetY * charScale,
        backgroundSize: figureBackgroundSize,
        width: faceSize * charScale,
        height: faceSize * charScale,
        left: svtScript.faceX * charScale + figureLeft,
        top: svtScript.faceY * charScale
      }
    }
    
    return {
      wrapper: { width: wrapperWidth, height: wrapperHeight, left: wrapperLeft, bottom: 0 },
      figure: { left: figureLeft, backgroundSize: figureBackgroundSize },
      face
    }
  }
  
  function updateAllLayouts() {
    const newLayouts = new Map<string, CharacterLayout>()
    sceneState.value.characters.forEach(char => {
      newLayouts.set(char.id, calculateLayout(char))
    })
    characterLayouts.value = newLayouts
  }
  
  function setCharacters(characters: Character[]) {
    sceneState.value.characters = characters
    updateAllLayouts()
  }
  
  function setBackground(url: string) {
    sceneState.value.background = url
  }
  
  function handleResize() {
    updateStageDimensions()
  }
  
  onMounted(() => {
    updateStageDimensions()
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
  
  return {
    sceneState,
    stageWidth,
    stageHeight,
    scale,
    isReady,
    characterLayouts,
    stageStyles,
    calculateLayout,
    setCharacters,
    setBackground,
    updateStageDimensions
  }
}

