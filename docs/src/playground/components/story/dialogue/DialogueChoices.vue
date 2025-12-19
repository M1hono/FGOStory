<template>
  <div 
    v-if="choices && choices.length > 0" 
    class="dialogue-choices"
    :class="{ 'with-dialogue': hasDialogue }"
  >
    <button
      v-for="(choice, index) in choices"
      :key="index"
      class="choice-item"
      @click="$emit('select', index)"
    >
      <span class="choice-text">{{ choice }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  choices?: string[]
  hasDialogue?: boolean
}>()

defineEmits<{
  select: [index: number]
}>()
</script>

<style scoped>
.dialogue-choices {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 50;
  width: 88%;
  max-width: 980px;
}

.dialogue-choices.with-dialogue { top: 38%; }

.choice-item {
  position: relative;
  height: 64px;
  padding: 0 56px;
  background: url('/SystemUI/img_talk_selectbg.png') center center / 100% 100% no-repeat;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.choice-item:hover {
  filter: brightness(1.15);
  transform: scale(1.01);
}

.choice-item:active {
  transform: scale(0.99);
  filter: brightness(0.95);
}

.choice-text {
  font-family: 'FGO-Main', 'Noto Sans SC', 'PingFang SC', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.95),
    0 0 8px rgba(0, 0, 0, 0.6);
  letter-spacing: 4px;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .dialogue-choices {
    width: 90%;
    gap: 16px;
  }
  
  .choice-item {
    height: 56px;
    padding: 0 40px;
  }
  
  .choice-text {
    font-size: 22px;
    letter-spacing: 3px;
  }
}

@media (max-width: 600px) {
  .dialogue-choices {
    width: 94%;
    gap: 12px;
  }
  
  .choice-item {
    height: 48px;
    padding: 0 24px;
  }
  
  .choice-text {
    font-size: 18px;
    letter-spacing: 2px;
  }
}
</style>

