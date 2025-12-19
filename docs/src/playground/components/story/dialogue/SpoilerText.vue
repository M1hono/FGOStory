<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  hiddenName: string
  trueName: string
  svtId?: number
}

const props = defineProps<Props>()
const revealed = ref(false)

function toggle() {
  revealed.value = !revealed.value
}
</script>

<template>
  <span 
    class="spoiler" 
    :class="{ revealed }"
    @click.stop="toggle"
    :title="revealed ? `点击隐藏 (${props.hiddenName})` : '点击查看真名'"
  >
    <span class="spoiler-text">{{ revealed ? trueName : hiddenName }}</span>
  </span>
</template>

<style scoped>
.spoiler {
  position: relative;
  display: inline-block;
  cursor: pointer;
  padding: 0 6px;
  border-radius: 3px;
  background: linear-gradient(135deg, #2a2a3a 0%, #3a3a4a 100%);
  transition: all 0.3s ease;
}

.spoiler:not(.revealed) {
  color: transparent;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.spoiler:not(.revealed):hover {
  background: linear-gradient(135deg, #3a3a4a 0%, #4a4a5a 100%);
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
}

.spoiler:not(.revealed)::after {
  content: '???';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9em;
  letter-spacing: 2px;
}

.spoiler.revealed {
  background: transparent;
  color: #ffcc00;
  text-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.spoiler.revealed::after {
  content: none;
}

.spoiler-text {
  transition: opacity 0.3s ease;
}

.spoiler:not(.revealed) .spoiler-text {
  opacity: 0;
}

.spoiler.revealed .spoiler-text {
  opacity: 1;
}
</style>

