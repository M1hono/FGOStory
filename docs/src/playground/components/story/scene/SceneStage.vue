<template>
  <div class="scene-stage-container" :class="containerClasses">
    <div 
      ref="stageRef" 
      class="scene-stage"
      :style="stageStyles"
    >
      <!-- 背景层 -->
      <div v-if="background" class="scene-background" />
      
      <!-- 角色层 -->
      <SceneCharacter
        v-for="character in characters"
        :key="character.id"
        :character="character"
        :layout="characterLayouts.get(character.id)!"
        :show-name-tag="showNameTags"
      />
      
      <!-- 调试信息 (开发模式) -->
      <div v-if="debugMode" class="debug-info">
        <div>Stage: {{ Math.round(stageWidth) }}×{{ Math.round(stageHeight) }}</div>
        <div>Scale: {{ scale.toFixed(2) }}</div>
        <div>Characters: {{ characters.length }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Character } from '../../../types'
import { useSceneRenderer } from '../../../composables/useSceneRenderer'
import SceneCharacter from './SceneCharacter.vue'

interface Props {
  characters?: Character[]
  background?: string
  showNameTags?: boolean
  debugMode?: boolean
  maintainAspectRatio?: boolean
}

interface Emits {
  (e: 'ready'): void
}

const props = withDefaults(defineProps<Props>(), {
  characters: () => [],
  background: '',
  showNameTags: false,
  debugMode: false,
  maintainAspectRatio: true
})

const emit = defineEmits<Emits>()

// Stage DOM 引用
const stageRef = ref<HTMLElement>()

// 使用 Scene Renderer
const {
  sceneState,
  stageWidth,
  stageHeight,
  isReady,
  characterLayouts,
  stageStyles,
  setCharacters,
  setBackground
} = useSceneRenderer(stageRef, {
  maintainAspectRatio: props.maintainAspectRatio
})

// 计算属性
const scale = computed(() => stageWidth.value / 1024)

const containerClasses = computed(() => [
  'scene-stage-container',
  {
    'scene-stage-container--ready': isReady.value,
    'scene-stage-container--debug': props.debugMode
  }
])

// 监听 props 变化并同步到 scene state
watch(
  () => props.characters,
  (newCharacters) => {
    setCharacters(newCharacters)
  },
  { immediate: true, deep: true }
)

watch(
  () => props.background,
  (newBackground) => {
    if (newBackground) {
      setBackground(newBackground)
    }
  },
  { immediate: true }
)

// 监听就绪状态
watch(isReady, (ready) => {
  if (ready) {
    emit('ready')
  }
})

// 角色点击功能已移除

// 暴露方法给父组件
defineExpose({
  updateCharacterFace: (characterId: string, faceIndex: number) => {
    const char = sceneState.characters.find(c => c.id === characterId)
    if (char) {
      char.face = faceIndex
    }
  },
  setCharacterActive: (characterId: string) => {
    sceneState.characters.forEach(char => {
      char.active = char.id === characterId
    })
  },
  getStageRef: () => stageRef.value,
  getStageSize: () => ({ width: stageWidth.value, height: stageHeight.value })
})
</script>

<style scoped>
.scene-stage-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  min-height: 300px;
}

.scene-stage {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.scene-stage-container--ready .scene-stage {
  opacity: 1;
  transform: scale(1);
}

.scene-stage-container:not(.scene-stage-container--ready) .scene-stage {
  opacity: 0;
  transform: scale(0.95);
}

.scene-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

/* 调试信息样式 */
.debug-info {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  z-index: 100;
  pointer-events: none;
}

.debug-info div {
  margin-bottom: 2px;
}

.debug-info div:last-child {
  margin-bottom: 0;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .scene-stage-container {
    min-height: 200px;
  }
  
  .scene-stage {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .debug-info {
    font-size: 11px;
    padding: 6px 8px;
  }
}

/* 高 DPI 屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .scene-stage {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
</style>
