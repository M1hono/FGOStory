<template>
  <div class="scene-character-wrapper" :class="wrapperClasses" :style="wrapperStyles">
    <div class="scene-character-figure" :style="figureStyles" :data-char-id="character.id" />
    <div v-if="faceStyles && character.face > 0" class="scene-character-face" :style="faceStyles" :data-face-index="character.face" />
    <div v-if="showNameTag && character.active" class="character-name-tag">{{ character.name }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Character, CharacterLayout } from '../../../types'

interface Props {
  character: Character
  layout: CharacterLayout
  showNameTag?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showNameTag: false
})

/** 角色容器样式 */
const wrapperStyles = computed(() => ({
  position: 'absolute' as const,
  width: `${props.layout.wrapper.width}px`,
  height: `${props.layout.wrapper.height}px`,
  left: `${props.layout.wrapper.left}px`,
  bottom: `${props.layout.wrapper.bottom}px`,
  overflow: 'hidden' as const,
  willChange: 'transform, filter',
  transition: 'filter 0.3s ease'
}))

const wrapperClasses = computed(() => [
  'scene-character-wrapper',
  {
    'scene-character-wrapper--active': props.character.active,
    'scene-character-wrapper--inactive': !props.character.active
  }
])

/** 身体图层样式 */
const figureStyles = computed(() => ({
  position: 'absolute' as const,
  top: '0',
  bottom: '0',
  left: `${props.layout.figure.left}px`,
  right: '0',
  backgroundImage: `url(${props.character.src})`,
  backgroundSize: `${props.layout.figure.backgroundSize}px auto`,
  backgroundPosition: 'left top',
  backgroundRepeat: 'no-repeat' as const
}))

/** 表情图层样式 */
const faceStyles = computed(() => {
  if (!props.layout.face) return null
  
  return {
    position: 'absolute' as const,
    width: `${props.layout.face.width}px`,
    height: `${props.layout.face.height}px`,
    left: `${props.layout.face.left}px`,
    top: `${props.layout.face.top}px`,
    backgroundImage: `url(${props.character.src})`,
    backgroundSize: `${props.layout.face.backgroundSize}px auto`,
    backgroundPosition: `${props.layout.face.backgroundPositionX}px ${props.layout.face.backgroundPositionY}px`,
    backgroundRepeat: 'no-repeat' as const,
    pointerEvents: 'none' as const
  }
})

</script>

<style scoped>
.scene-character-wrapper--active { filter: brightness(1.0) contrast(1.0); }
.scene-character-wrapper--inactive { filter: brightness(0.7) contrast(0.8); }
.scene-character-face { z-index: 2; }

.character-name-tag {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;
  z-index: 3;
}
</style>
