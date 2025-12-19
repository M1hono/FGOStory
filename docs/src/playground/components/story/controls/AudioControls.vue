<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  bgmPlaying?: boolean
  sePlaying?: boolean
}

interface Emits {
  (e: 'toggleBgm', muted: boolean): void
  (e: 'toggleSe', muted: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  bgmPlaying: false,
  sePlaying: false
})

const emit = defineEmits<Emits>()

const bgmMuted = ref(false)
const seMuted = ref(false)

function toggleBgm() {
  bgmMuted.value = !bgmMuted.value
  emit('toggleBgm', bgmMuted.value)
}

function toggleSe() {
  seMuted.value = !seMuted.value
  emit('toggleSe', seMuted.value)
}
</script>

<template>
  <div class="audio-controls">
    <button 
      class="audio-btn bgm-btn"
      :class="{ muted: bgmMuted, playing: bgmPlaying && !bgmMuted }"
      @click.stop="toggleBgm"
      :title="bgmMuted ? 'BGM: 关闭' : 'BGM: 开启'"
    >
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
        <path v-if="!bgmMuted" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        <path v-else d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73L19.73 21 21 19.73 4.27 3zM14 7h4V3h-6v5.18l2 2V7z"/>
      </svg>
    </button>
    
    <button 
      class="audio-btn se-btn"
      :class="{ muted: seMuted }"
      @click.stop="toggleSe"
      :title="seMuted ? '音效: 关闭' : '音效: 开启'"
    >
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
        <path v-if="!seMuted" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        <path v-else d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.audio-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.audio-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.audio-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  transform: scale(1.1);
}

.audio-btn.muted {
  color: rgba(255, 100, 100, 0.8);
}

.audio-btn.muted:hover {
  color: #ff6666;
}

.audio-btn.playing {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(100, 200, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(100, 200, 255, 0);
  }
}

.icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .audio-controls {
    top: 8px;
    right: 8px;
    gap: 6px;
  }
  
  .audio-btn {
    width: 32px;
    height: 32px;
  }
  
  .icon {
    width: 16px;
    height: 16px;
  }
}
</style>

