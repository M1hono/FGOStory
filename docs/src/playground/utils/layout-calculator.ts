import type { Character, CharacterLayout, SceneRendererOptions, SvtScript } from '../types'

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

/**
 * Calculate character layout based on stage dimensions and SVT script data
 */
export function calculateCharacterLayout(
  char: Character,
  stageWidth: number,
  stageHeight: number,
  config: Partial<SceneRendererOptions> = {},
  script?: SvtScript
): CharacterLayout {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const svtScript = script || { offsetX: 0, offsetY: 0, faceX: 0, faceY: 0, faceSize: 256 }
  
  const scale = (stageWidth / cfg.baseWidth) * char.charScale
  const figureWidth = char.imgWidth || cfg.resolutionWidth
  
  // Wrapper dimensions
  const wrapperWidth = cfg.resolutionWidth * scale
  const wrapperHeight = cfg.displayHeight * scale
  const charCenterX = stageWidth * char.posX
  const wrapperLeft = charCenterX - wrapperWidth / 2
  
  // Figure (body) positioning
  const figureLeft = ((cfg.resolutionWidth - figureWidth) / 2 + (svtScript.offsetX || 0)) * scale
  const figureBackgroundSize = scale * figureWidth
  
  // Face (expression) positioning
  let face: CharacterLayout['face'] = undefined
  if (char.face > 0 && svtScript.faceX !== undefined) {
    const faceIndex = char.face - 1
    const faceSize = svtScript.faceSize || cfg.defaultFaceSize || 256
    const perRow = Math.floor((cfg.facePageWidth || 1024) / faceSize)
    const col = faceIndex % perRow
    const row = Math.floor(faceIndex / perRow)
    
    const srcOffsetY = cfg.displayHeight + row * faceSize
    const srcOffsetX = col * faceSize
    
    face = {
      backgroundPositionX: -srcOffsetX * scale,
      backgroundPositionY: -srcOffsetY * scale,
      backgroundSize: figureBackgroundSize,
      width: faceSize * scale,
      height: faceSize * scale,
      left: svtScript.faceX * scale + figureLeft,
      top: svtScript.faceY * scale
    }
  }
  
  return {
    wrapper: {
      width: wrapperWidth,
      height: wrapperHeight,
      left: wrapperLeft,
      bottom: 0
    },
    figure: {
      left: figureLeft,
      backgroundSize: figureBackgroundSize
    },
    face
  }
}

/**
 * Calculate stage dimensions maintaining aspect ratio
 */
export function calculateStageDimensions(
  containerWidth: number,
  containerHeight: number,
  config: Partial<SceneRendererOptions> = {}
): { width: number; height: number; scale: number } {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const aspectRatio = cfg.baseWidth / cfg.baseHeight
  
  let width: number
  let height: number
  
  if (cfg.maintainAspectRatio) {
    if (containerWidth / containerHeight > aspectRatio) {
      height = containerHeight
      width = height * aspectRatio
    } else {
      width = containerWidth
      height = width / aspectRatio
    }
  } else {
    width = containerWidth
    height = containerHeight
  }
  
  return {
    width,
    height,
    scale: width / cfg.baseWidth
  }
}

