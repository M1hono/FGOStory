<template>
  <div 
    ref="containerRef"
    class="dialogue-text-container"
    :style="{ fontSize: `${currentFontSize}px`, opacity: isReady ? 1 : 0 }"
  >
    <div ref="contentRef" class="dialogue-text-content" v-html="formattedText" />
    <span v-if="showCursor" class="dialogue-cursor" :style="{ fontSize: `${currentFontSize}px` }">▎</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  text?: string
  showCursor?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const MAX_FONT_SIZE = 26
const MIN_FONT_SIZE = 14
const currentFontSize = ref(MAX_FONT_SIZE)
const isReady = ref(false)

const hasRuby = computed(() => props.text?.includes('{') && props.text?.includes('|'))
const hasEmphasis = computed(() => props.text?.includes('**'))

/** 将格式标记转换为 HTML */
const formattedText = computed(() => {
  if (!props.text) return ''
  return props.text
    .replace(/\{([^|]+)\|([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>')
    .replace(/\*\*(.+?)\*\*/g, '<span class="emphasis-dots">$1</span>')
    .replace(/\[red:(.+?)\]/g, '<span class="color-red">$1</span>')
    .replace(/\[blue:(.+?)\]/g, '<span class="color-blue">$1</span>')
    .replace(/\[gold:(.+?)\]/g, '<span class="color-gold">$1</span>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
})

/** 离屏测量最佳字体大小 */
function findBestFontSize(): number {
  if (!containerRef.value || !props.text) return MAX_FONT_SIZE
  
  const container = containerRef.value
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const extraHeight = (hasRuby.value || hasEmphasis.value) ? 16 : 0
  const availableHeight = containerHeight - extraHeight
  
  const measure = document.createElement('div')
  measure.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${containerWidth}px;
    font-family: 'FGO-Main', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-weight: 700;
    line-height: 1.75;
    white-space: pre-wrap;
    word-wrap: break-word;
  `
  measure.innerHTML = formattedText.value
  document.body.appendChild(measure)
  
  let bestSize = MIN_FONT_SIZE
  for (let size = MAX_FONT_SIZE; size >= MIN_FONT_SIZE; size--) {
    measure.style.fontSize = `${size}px`
    if (measure.offsetHeight <= availableHeight) {
      bestSize = size
      break
    }
  }
  
  document.body.removeChild(measure)
  return bestSize
}

/** 根据内容调整字体大小以适应容器 */
async function adjustFontSize() {
  if (!containerRef.value || !props.text) {
    currentFontSize.value = MAX_FONT_SIZE
    isReady.value = true
    return
  }
  
  isReady.value = false
  await nextTick()
  
  requestAnimationFrame(() => {
    currentFontSize.value = findBestFontSize()
    isReady.value = true
  })
}

watch(() => props.text, () => {
  adjustFontSize()
}, { immediate: true })

onMounted(() => {
  adjustFontSize()
})
</script>

<style scoped>
.dialogue-text-container {
  width: 100%;
  height: 100%;
  font-family: 'FGO-Main', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 700;
  line-height: 1.75;
  color: #ffffff;
  text-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  transition: opacity 0.1s ease;
  /* font-size 通过 :style 动态设置 */
}

.dialogue-text-content {
  display: block;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.dialogue-text-content :deep(ruby) {
  ruby-position: over;
  ruby-align: center;
}

.dialogue-text-content :deep(rt) {
  font-family: 'FGO-Main', 'Noto Sans SC', sans-serif;
  font-size: 0.5em;
  color: #ffffff; /* 与主文字相同颜色 */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* 傍点强调 - 日式上方小圆点 */
.dialogue-text-content :deep(.emphasis-dots) {
  text-emphasis: filled dot;
  text-emphasis-position: over right;
  text-emphasis-color: #ffffff;
  -webkit-text-emphasis: filled dot;
  -webkit-text-emphasis-position: over right;
  -webkit-text-emphasis-color: #ffffff;
  font-size: 0.95em;
}

/* 颜色变体 */
.dialogue-text-content :deep(.color-red) {
  color: #ff6b6b;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95);
}

.dialogue-text-content :deep(.color-blue) {
  color: #6bcfff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95);
}

.dialogue-text-content :deep(.color-gold) {
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(255, 215, 0, 0.4);
}

.dialogue-text-content :deep(em) {
  font-style: normal;
  color: #c0e0ff;
}

.dialogue-cursor {
  color: #ffd700;
  animation: blink 1s infinite;
  margin-left: 4px;
  /* font-size 通过 :style 动态设置 */
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
