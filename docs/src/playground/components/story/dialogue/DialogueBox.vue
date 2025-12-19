<template>
  <div class="dialogue-box" :class="boxClasses" @click="handleClick">
    <DialogueSpeaker :speaker="speaker" />
    <div class="dialogue-text-area">
      <DialogueText :text="displayText" :show-cursor="showCursor && isTyping" />
    </div>
    <DialogueControls :dialogue-text="props.content" @prev="$emit('prev')" @copy-text="handleCopyText" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import DialogueSpeaker from './DialogueSpeaker.vue'
import DialogueText from './DialogueText.vue'
import DialogueControls from './DialogueControls.vue'

interface Props {
  speaker?: string
  content?: string
  isTyping?: boolean
  isAuto?: boolean
  typingSpeed?: number
}

interface Emits {
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'typingComplete'): void
}

const props = withDefaults(defineProps<Props>(), {
  speaker: '',
  content: '',
  isTyping: false,
  isAuto: false,
  typingSpeed: 50
})

const emit = defineEmits<Emits>()

function handleCopyText(text: string) {
  console.log('已复制:', text)
}

const displayText = ref('')
const currentIndex = ref(0)
const showCursor = ref(false)
const typingTimer = ref<number | undefined>()

const boxClasses = computed(() => ({
  'dialogue-box--typing': props.isTyping,
  'dialogue-box--auto': props.isAuto,
  'dialogue-box--empty': !props.content
}))

function startTyping() {
  if (!props.content) return
  displayText.value = ''
  currentIndex.value = 0
  showCursor.value = true
  
  const typeNextChar = () => {
    if (currentIndex.value < props.content.length) {
      displayText.value += props.content[currentIndex.value]
      currentIndex.value++
      typingTimer.value = window.setTimeout(typeNextChar, props.typingSpeed)
    } else {
      showCursor.value = false
      emit('typingComplete')
    }
  }
  typeNextChar()
}

function stopTyping() {
  if (typingTimer.value !== undefined) {
    clearTimeout(typingTimer.value)
    typingTimer.value = undefined
  }
  displayText.value = props.content
  showCursor.value = false
}

function handleClick() {
  if (props.isTyping && currentIndex.value < props.content.length) {
    stopTyping()
  } else if (!props.isAuto) {
    emit('next')
  }
}

watch(() => props.content, (newContent) => {
  if (newContent && props.isTyping) {
    startTyping()
  } else {
    displayText.value = newContent
  }
}, { immediate: true })

watch(() => props.isTyping, (isTyping) => {
  if (isTyping && props.content) {
    startTyping()
  } else if (!isTyping) {
    stopTyping()
  }
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    handleClick()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (typingTimer.value !== undefined) {
    clearTimeout(typingTimer.value)
  }
})
</script>

<style scoped>
.dialogue-box {
  position: relative;
  min-height: 170px;
  background: url('/SystemUI/img_talk_textbg.png') center center / 100% 100% no-repeat;
  cursor: pointer;
}

.dialogue-box:active {
  filter: brightness(0.98);
}

.dialogue-text-area {
  position: absolute;
  width: 877px;
  height: 130px;
  top: 32px;
  left: 48px;
  overflow: hidden;
}

.dialogue-box--empty {
  opacity: 0.6;
  cursor: default;
}

.dialogue-box--empty:active {
  filter: none;
}
</style>
