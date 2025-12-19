<template>
  <div v-if="speaker" class="dialogue-speaker">
    <img src="/SystemUI/img_talk_namebg.png" class="speaker-bg" />
    <span class="speaker-text">{{ speaker }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  speaker?: string
}>()
</script>

<style scoped>
.dialogue-speaker {
  position: absolute;
  width: 262px;
  height: 51px;
  top: -31px;
  left: 1px;
  z-index: 10;
}

.speaker-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.speaker-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 20px;
  font-family: 'FGO-Main', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.95),
    0 0 8px rgba(0, 0, 0, 0.7);
  letter-spacing: 2px;
  white-space: nowrap;
}
</style>
