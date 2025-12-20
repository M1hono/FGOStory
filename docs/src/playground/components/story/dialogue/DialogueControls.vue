<template>
  <div class="dialogue-controls">
    <button class="ctrl-btn btn-log" @click.stop="handleCopyText" :title="t.copySuccess">
      <img src="/SystemUI/btn_log.png" alt="copy" />
    </button>
    <button class="ctrl-btn btn-back" @click.stop="$emit('prev')" :title="t.back">
      <img src="/SystemUI/btn_ff.png" alt="back" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSafeI18n } from '../../../../.vitepress/utils/i18n/locale'

const { t } = useSafeI18n('story/StoryReader', {
  copySuccess: '复制对话',
  copyFailed: '复制失败',
  back: '上一句'
})

const props = defineProps<{
  dialogueText?: string
}>()

const emit = defineEmits<{
  prev: []
  copyText: [text: string]
}>()

/** 复制对话文本 (移除格式标记) */
function handleCopyText() {
  if (!props.dialogueText) return
  
  const plainText = props.dialogueText
    .replace(/\{([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(red|blue|gold):(.+?)\]/g, '$2')
  
  navigator.clipboard.writeText(plainText).then(() => {
    emit('copyText', plainText)
  })
}
</script>

<style scoped>
.dialogue-controls {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ctrl-btn {
  position: absolute;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.15s ease;
}

.ctrl-btn:hover {
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5)) brightness(1.1);
  transform: scale(1.05);
}

.ctrl-btn:active {
  transform: scale(0.95);
}

.ctrl-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.btn-log {
  width: 40px;
  height: 40px;
  top: 32px;
  right: 30px;
}

.btn-back {
  width: 44px;
  height: 44px;
  top: 84px;
  right: 28px;
  opacity: 0.7;
}

.btn-back:hover { opacity: 1; }
.btn-back img { transform: scaleX(-1); }
</style>
