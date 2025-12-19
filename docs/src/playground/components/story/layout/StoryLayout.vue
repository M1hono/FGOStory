<template>
  <div class="story-app" :class="{ 'menu-open': menuOpen }">
    <!-- 左侧边栏: 主导航 (桌面端) -->
    <aside class="main-nav desktop-only">
      <div class="nav-header">
        <div class="nav-logo">FGO Story</div>
      </div>
      <div class="nav-sections">
        <div class="nav-section">
          <div class="nav-section-title">主线剧情</div>
          <div class="nav-section-list">
            <div 
              v-for="(chapter, index) in chapters" 
              :key="chapter.id"
              class="nav-item"
              :class="{ active: currentChapterIndex === index }"
              @click="$emit('selectChapter', index)"
            >
              {{ chapter.name }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="story-main">
      <!-- Header -->
      <header class="story-header">
        <span class="header-btn back" @click="$emit('back')">← 返回</span>
        <span class="header-title">{{ title }}</span>
        <span class="header-btn menu mobile-only" @click="menuOpen = !menuOpen">☰</span>
        <span class="header-btn settings desktop-only" @click="$emit('settings')">⚙</span>
      </header>

      <!-- 舞台容器 -->
      <div class="stage-wrapper">
        <div class="stage" ref="stageRef">
          <div class="stage-background" :style="{ backgroundImage: `url('${backgroundUrl}')` }" />
          <div class="stage-characters"><slot name="characters" /></div>
          <div class="stage-effects"><slot name="effects" /></div>
          
          <!-- 选项界面 -->
          <DialogueChoices
            v-if="choices && choices.length > 0"
            :choices="choices"
            :has-dialogue="!!dialogueText"
            @select="$emit('selectChoice', $event)"
          />
          
          <div class="stage-dialogue" v-show="dialogueText">
            <DialogueBox
              :speaker="speaker"
              :content="dialogueText"
              :is-auto="false"
              @next="$emit('next')"
              @prev="$emit('prev')"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- 右侧边栏: 集数列表 (桌面端) -->
    <aside class="episode-nav desktop-only">
      <div class="nav-header">
        <div class="nav-section-title">{{ sidebarTitle }}</div>
      </div>
      <div class="nav-section-list">
        <div 
          v-for="(episode, index) in episodes" 
          :key="episode.id"
          class="nav-item"
          :class="{ active: currentEpisodeIndex === index }"
          @click="$emit('selectEpisode', index)"
        >
          {{ episode.name }}
        </div>
      </div>
    </aside>

    <!-- 移动端菜单 (滑出面板) -->
    <div class="mobile-menu mobile-only" :class="{ open: menuOpen }">
      <div class="mobile-menu-overlay" @click="menuOpen = false" />
      <div class="mobile-menu-panel">
        <div class="mobile-menu-header">
          <span>导航</span>
          <span class="close-btn" @click="menuOpen = false">✕</span>
        </div>
        
        <div class="mobile-menu-section">
          <div class="mobile-menu-title">{{ sidebarTitle }}</div>
          <div class="mobile-menu-items">
            <div 
              v-for="(chapter, index) in chapters" 
              :key="chapter.id"
              class="mobile-menu-item"
              :class="{ active: currentChapterIndex === index }"
              @click="$emit('selectChapter', index); menuOpen = false"
            >
              {{ chapter.name }}
            </div>
          </div>
        </div>
        
        <div class="mobile-menu-section">
          <div class="mobile-menu-title">Episodes</div>
          <div class="mobile-menu-items">
            <div 
              v-for="(episode, index) in episodes" 
              :key="episode.id"
              class="mobile-menu-item"
              :class="{ active: currentEpisodeIndex === index }"
              @click="$emit('selectEpisode', index); menuOpen = false"
            >
              {{ episode.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端横屏提示 -->
    <div class="rotate-hint mobile-only">
      <div class="rotate-icon">📱↻</div>
      <div class="rotate-text">横屏获得最佳体验</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DialogueBox from '../dialogue/DialogueBox.vue'
import DialogueChoices from '../dialogue/DialogueChoices.vue'

interface Chapter { id: number | string; name: string }
interface Episode { id: number | string; name: string }

withDefaults(defineProps<{
  title?: string
  sidebarTitle?: string
  backgroundUrl?: string
  speaker?: string
  dialogueText?: string
  choices?: string[]
  chapters?: Chapter[]
  episodes?: Episode[]
  currentChapterIndex?: number
  currentEpisodeIndex?: number
}>(), {
  title: 'Story Reader',
  sidebarTitle: 'Chapters',
  backgroundUrl: '',
  speaker: '',
  dialogueText: '',
  choices: () => [],
  chapters: () => [],
  episodes: () => [],
  currentChapterIndex: 0,
  currentEpisodeIndex: 0
})

defineEmits<{
  back: []
  settings: []
  next: []
  prev: []
  selectChapter: [index: number]
  selectEpisode: [index: number]
  selectChoice: [index: number]
}>()

const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(0)
const stageHeight = ref(0)
const menuOpen = ref(false)

const BASE_WIDTH = 1024
const BASE_HEIGHT = 626
const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT

function updateStageDimensions() {
  requestAnimationFrame(() => {
    if (!stageRef.value) return
    const wrapper = stageRef.value.parentElement
    if (!wrapper) return
    
    const rect = wrapper.getBoundingClientRect()
    const maxWidth = rect.width || window.innerWidth
    const maxHeight = rect.height || window.innerHeight - 80
    
    if (maxWidth <= 0 || maxHeight <= 0) return
    
    let width: number, height: number
    if (maxWidth / maxHeight > ASPECT_RATIO) {
      height = maxHeight
      width = height * ASPECT_RATIO
    } else {
      width = maxWidth
      height = width / ASPECT_RATIO
    }
    
    stageRef.value.style.width = `${width}px`
    stageRef.value.style.height = `${height}px`
    stageWidth.value = width
    stageHeight.value = height
    
    const scale = width / BASE_WIDTH
    stageRef.value.style.setProperty('--dialogue-scale', `${scale}`)
  })
}

let resizeTimer: number | undefined
function handleResize() {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(updateStageDimensions, 50)
}

onMounted(() => {
  setTimeout(updateStageDimensions, 0)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
})

defineExpose({ stageRef, stageWidth, stageHeight })
</script>

<style scoped>
.story-app {
  --accent-gold: #c9a227;
  --accent-blue: #4a8abf;
  --border-glow: rgba(74, 138, 191, 0.4);
  --nav-width: 200px;
  --episode-width: 180px;
  
  display: flex;
  position: fixed !important;
  inset: 0;
  background: #08080a;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  color: #e8e8e8;
  overflow: hidden;
  z-index: 9999;
}

.desktop-only { display: flex; }
.mobile-only { display: none; }

/* 左侧主导航 */
.main-nav {
  width: var(--nav-width);
  background: linear-gradient(180deg, #0c0e12 0%, #08080a 100%);
  border-right: 1px solid var(--border-glow);
  flex-direction: column;
  flex-shrink: 0;
}

.nav-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.nav-logo {
  font-size: 1rem;
  font-weight: bold;
  color: var(--accent-gold);
  letter-spacing: 2px;
}

.nav-sections {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.nav-section { margin-bottom: 16px; }

.nav-section-title {
  padding: 8px 16px;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-section-list { padding: 0 8px; }

.nav-item {
  padding: 10px 12px;
  margin-bottom: 2px;
  font-size: 0.85rem;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
  color: #ccc;
}

.nav-item.active {
  background: rgba(74, 138, 191, 0.15);
  color: var(--accent-blue);
  border-left: 2px solid var(--accent-blue);
}

/* 主内容区 */
.story-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* Header */
.story-header {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(90deg, #0c0e12, #12141a, #0c0e12);
  border-bottom: 1px solid var(--border-glow);
}

.header-title {
  font-size: 0.95rem;
  color: #fff;
}

.header-btn {
  color: #888;
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s;
}

.header-btn:hover { color: var(--accent-gold); }

/* 舞台 */
.stage-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-height: 0;
}

.stage {
  position: relative;
  background: #000;
  border: 2px solid var(--border-glow);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0,0,0,0.8);
}

.stage-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.stage-characters {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 10;
}

.stage-effects {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.stage-dialogue {
  position: absolute;
  left: 10px;
  bottom: 20px;
  width: 1004px;
  z-index: 30;
  transform-origin: bottom left;
  transform: scale(var(--dialogue-scale, 1));
}

/* 右侧集数导航 */
.episode-nav {
  width: var(--episode-width);
  background: linear-gradient(180deg, #0c0e12 0%, #08080a 100%);
  border-left: 1px solid var(--border-glow);
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.episode-nav .nav-header {
  padding: 12px 16px;
}

.episode-nav .nav-section-list {
  padding: 0 8px;
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.mobile-menu.open {
  pointer-events: auto;
  opacity: 1;
}

.mobile-menu-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
}

.mobile-menu-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: #0c0e12;
  border-left: 1px solid var(--border-glow);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.mobile-menu.open .mobile-menu-panel {
  transform: translateX(0);
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: var(--accent-gold);
  font-weight: bold;
}

.close-btn {
  cursor: pointer;
  padding: 4px 8px;
}

.mobile-menu-section {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.mobile-menu-title {
  padding: 8px 16px;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
}

.mobile-menu-items {
  padding: 0 12px;
}

.mobile-menu-item {
  padding: 12px;
  font-size: 0.9rem;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
}

.mobile-menu-item:hover {
  background: rgba(255,255,255,0.05);
  color: #ccc;
}

.mobile-menu-item.active {
  background: rgba(74, 138, 191, 0.15);
  color: var(--accent-blue);
}

/* 横屏提示 */
.rotate-hint {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 2000;
}

.rotate-icon { font-size: 48px; }
.rotate-text { color: #888; font-size: 14px; }

/* 响应式 */
@media (max-width: 1024px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: flex !important; }
  
  .story-app { flex-direction: column; }
  
  .story-main { padding: 0; }
  
  .stage-wrapper { padding: 8px; }
  
  .story-header {
    height: 44px;
    padding: 0 12px;
  }
}

/* 移动端横屏 */
@media (max-width: 1024px) and (orientation: landscape) {
  .rotate-hint { display: none !important; }
  
  .story-header { height: 36px; }
  
  .stage-wrapper { padding: 4px; }
}

/* 移动端竖屏 */
@media (max-width: 1024px) and (orientation: portrait) {
  .rotate-hint { display: flex !important; }
}

/* 小屏幕竖屏隐藏提示让用户可以使用 */
@media (max-width: 600px) and (orientation: portrait) {
  .rotate-hint {
    display: none !important;
  }
}
</style>
