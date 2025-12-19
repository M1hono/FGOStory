<template>
  <StoryLayout
    :title="currentScene.title"
    sidebar-title="Part I"
    :background-url="currentScene.background"
    :speaker="currentScene.speaker"
    :dialogue-text="currentScene.dialogue"
    :choices="currentScene.choices"
    :chapters="chapters"
    :episodes="episodes"
    :current-chapter-index="currentChapterIndex"
    :current-episode-index="currentEpisodeIndex"
    ref="layoutRef"
    @back="handleBack"
    @prev="handlePrev"
    @next="handleNext"
    @select-chapter="handleSelectChapter"
    @select-episode="handleSelectEpisode"
    @select-choice="handleSelectChoice"
  >
    <template #characters>
      <SceneCharacter
        v-for="char in currentScene.characters"
        :key="char.id"
        :character="char"
        :layout="calculateLayout(char, stageWidth, stageHeight)"
      />
    </template>
  </StoryLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import StoryLayout from './StoryLayout.vue'
import SceneCharacter from '../scene/SceneCharacter.vue'
import type { Character, CharacterLayout, SvtScript } from '../../../types'

const CONFIG = {
  baseWidth: 1024,
  baseHeight: 626,
  resolutionWidth: 1024,
  displayHeight: 768,
  defaultFaceSize: 256,
  facePageWidth: 1024
}

const SVT_SCRIPTS: Record<number, SvtScript> = {
  98001000: { offsetX: 0, offsetY: 125, faceX: 384, faceY: 149, faceSize: 256 },
  98003000: { offsetX: -2, offsetY: 151, faceX: 384, faceY: 149, faceSize: 256 },
  10003000: { offsetX: 13, offsetY: 136, faceX: 382, faceY: 153, faceSize: 256 },
}

const getSvtScript = (id: number): SvtScript => SVT_SCRIPTS[id] || { offsetX: 0, offsetY: 0, faceX: 0, faceY: 0, faceSize: 256 }

function calculateLayout(char: Character, stageW: number, stageH: number): CharacterLayout {
  const script = getSvtScript(char.charaGraphId)
  const scale = (stageW / CONFIG.baseWidth) * char.charScale
  const figureWidth = char.imgWidth || CONFIG.resolutionWidth
  
  const wrapperWidth = CONFIG.resolutionWidth * scale
  const wrapperHeight = CONFIG.displayHeight * scale
  const charCenterX = stageW * char.posX
  const wrapperLeft = charCenterX - wrapperWidth / 2
  
  const figureLeft = ((CONFIG.resolutionWidth - figureWidth) / 2 + (script.offsetX || 0)) * scale
  const figureBackgroundSize = scale * figureWidth
  
  let face: CharacterLayout['face'] = undefined
  if (char.face > 0 && script.faceX !== undefined) {
    const faceIndex = char.face - 1
    const faceSize = script.faceSize || CONFIG.defaultFaceSize
    const perRow = Math.floor(CONFIG.facePageWidth / faceSize)
    const col = faceIndex % perRow
    const row = Math.floor(faceIndex / perRow)
    
    const srcOffsetY = CONFIG.displayHeight + row * faceSize
    const srcOffsetX = col * faceSize
    
    face = {
      backgroundPositionX: -srcOffsetX * scale,
      backgroundPositionY: -srcOffsetY * scale,
      backgroundSize: figureBackgroundSize,
      width: faceSize * scale,
      height: faceSize * scale,
      left: script.faceX * scale + figureLeft,
      top: script.faceY * scale
    }
  }
  
  return {
    wrapper: { width: wrapperWidth, height: wrapperHeight, left: wrapperLeft, bottom: 0 },
    figure: { left: figureLeft, backgroundSize: figureBackgroundSize },
    face
  }
}

interface Scene {
  id: number
  title: string
  background: string
  speaker?: string
  dialogue?: string
  choices?: string[]
  characters: Character[]
}

const scenes: Scene[] = [
  {
    id: 1,
    title: '中文 - Ruby注音测试',
    background: 'https://static.atlasacademy.io/JP/Back/back10400.png',
    speaker: '玛修',
    dialogue: '前辈，这是{迦勒底|カルデア}的{人理继续保障机关|フィニス・カルデア}。\n我是{盾兵|シールダー}职阶的从者，玛修·{基列莱特|キリエライト}。',
    characters: [
      {
        id: 'mashu',
        name: '玛修',
        charaGraphId: 98001000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/98001000/98001000_merged.png',
        posX: 0.5,
        charScale: 1.0,
        active: true,
        face: 1,
      },
    ],
  },
  {
    id: 2,
    title: '日本語 - 傍点強調テスト',
    background: 'https://static.atlasacademy.io/JP/Back/back10400.png',
    speaker: '?',
    dialogue: 'これは**とても重要**な任務だよ！\n必ず**慎重に行動**してね、私たちの**マスター**。',
    characters: [
      {
        id: 'Romani',
        name: '?',
        charaGraphId: 98003000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/98003000/98003000_merged.png',
        posX: 0.28,
        charScale: 1.0,
        active: true,
        face: 2,
      },
      {
        id: 'mashu',
        name: '玛修',
        charaGraphId: 98001000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/98001000/98001000_merged.png',
        posX: 0.72,
        charScale: 0.95,
        active: false,
        face: 1,
      },
    ],
  },
  {
    id: 3,
    title: 'English - Color Test',
    background: 'https://static.atlasacademy.io/JP/Back/back10400.png',
    speaker: 'Kiara Sessyoin',
    dialogue: 'Ufufu... This is the power of [gold:Beast].\n[red:Danger], **salvation**—all exists for the [blue:sake of all living beings].',
    characters: [
      {
        id: 'da_vinci',
        name: '达芬奇',
        charaGraphId: 98003000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/98003000/98003000_merged.png',
        posX: 0.18,
        charScale: 0.9,
        active: false,
        face: 1,
      },
      {
        id: 'kiara',
        name: '祈荒',
        charaGraphId: 10003000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/10003000/10003000_merged.png',
        posX: 0.5,
        charScale: 1.0,
        active: true,
        face: 1,
      },
      {
        id: 'mashu',
        name: '玛修',
        charaGraphId: 98001000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/98001000/98001000_merged.png',
        posX: 0.82,
        charScale: 0.9,
        active: false,
        face: 1,
      },
    ],
  },
  {
    id: 4,
    title: '한국어 - 선택지 테스트',
    background: 'https://static.atlasacademy.io/JP/Back/back10610.png',
    speaker: '카마',
    dialogue: '어, 잠, 잠깐만요.\n……이렇게 하면, 혹시 위험한 건가요?',
    choices: ['매우 위험해요.', '전혀 위험하지 않아요.', '한번 해볼까요?'],
    characters: [
      {
        id: 'kama',
        name: '迦摩',
        charaGraphId: 98001000,
        src: 'https://static.atlasacademy.io/JP/CharaFigure/98001000/98001000_merged.png',
        posX: 0.5,
        charScale: 1.0,
        active: true,
        face: 2,
      },
    ],
  },
]

const chapters = [
  { id: 1, name: '中文' },
  { id: 2, name: '日本語' },
  { id: 3, name: 'English' },
  { id: 4, name: '한국어' },
]

const episodes = computed(() => [
  { id: currentSceneIndex.value + 1, name: `${currentSceneIndex.value + 1}人场景` },
])

const currentSceneIndex = ref(0)
const currentChapterIndex = ref(0)
const currentEpisodeIndex = ref(0)

const currentScene = computed(() => scenes[currentSceneIndex.value])

// URL 同步: 更新 URL hash 当 scene 变化时
function updateUrlHash() {
  if (typeof window === 'undefined') return
  const scene = currentScene.value
  const newHash = `#scene-${scene.id}`
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', newHash)
  }
}

// 从 URL hash 读取初始 scene
function initFromUrl() {
  if (typeof window === 'undefined') return
  const hash = window.location.hash
  const match = hash.match(/#scene-(\d+)/)
  if (match) {
    const sceneId = parseInt(match[1])
    const index = scenes.findIndex(s => s.id === sceneId)
    if (index >= 0) {
      currentSceneIndex.value = index
      currentChapterIndex.value = index
    }
  }
}

onMounted(() => {
  initFromUrl()
})

watch(currentSceneIndex, () => {
  updateUrlHash()
})

const layoutRef = ref<InstanceType<typeof StoryLayout> | null>(null)

const stageWidth = computed(() => layoutRef.value?.stageWidth || 1024)
const stageHeight = computed(() => layoutRef.value?.stageHeight || 626)

watch(currentChapterIndex, (index) => {
  currentSceneIndex.value = index
})

function handleBack() {
  console.log('Back clicked')
}

function handlePrev() {
  if (currentSceneIndex.value > 0) {
    currentSceneIndex.value--
    currentChapterIndex.value = currentSceneIndex.value
  }
}

function handleNext() {
  if (currentSceneIndex.value < scenes.length - 1) {
    currentSceneIndex.value++
    currentChapterIndex.value = currentSceneIndex.value
  }
}

function handleSelectChapter(index: number) {
  currentChapterIndex.value = index
  currentSceneIndex.value = index
}

function handleSelectEpisode(index: number) {
  currentEpisodeIndex.value = index
}

function handleSelectChoice(index: number) {
  console.log('Selected choice:', index, currentScene.value.choices?.[index])
  // 选择后进入下一场景
  handleNext()
}
</script>

