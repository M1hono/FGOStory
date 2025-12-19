<template>
  <div class="story-layout" :class="layoutClasses">
    <!-- 顶部导航栏 -->
    <header class="story-header">
      <div class="story-header-content" :style="headerContentStyles">
        <div class="story-header-left">
          <button class="back-button" @click="goBack">
            ← 返回首页
          </button>
        </div>
        <div class="story-header-center">
          <h1 class="story-title">{{ storyTitle }}</h1>
        </div>
        <div class="story-header-right">
          <button 
            v-if="!isMobile" 
            class="settings-button" 
            @click="showSettings = true"
          >
            设置
          </button>
        </div>
      </div>
    </header>
    
    <!-- 主体内容区 -->
    <main class="story-main">
      <div class="story-container" :class="{ mobile: isMobile }">
        
        <!-- 左侧边栏 - 章节导航 -->
        <aside v-if="!isMobile" class="story-war-sidebar">
          <StoryWarSidebar 
            :wars="wars"
            :current-war-id="currentWarId"
            @war-select="onWarSelect"
          />
        </aside>
        
        <!-- 中央场景区域 -->
        <div class="story-scene-area">
          <!-- 场景舞台 -->
          <div class="scene-stage-wrapper" :style="sceneWrapperStyles">
            <SceneStage
              ref="sceneStageRef"
              :characters="currentCharacters" 
              :background="currentBackground"
              :debug-mode="debugMode"
              @character-click="onCharacterClick"
              @ready="onSceneReady"
            />
          </div>
          
          <!-- 对话框 -->
          <div class="dialogue-wrapper" :style="dialogueWrapperStyles">
            <DialogueBox
              :speaker="currentDialogue.speaker"
              :content="currentDialogue.content"
              :is-typing="isDialogueTyping"
              @next="onDialogueNext"
              @auto-toggle="onAutoToggle"
            />
          </div>
          
          <!-- 控制栏 -->
          <div class="controls-wrapper" :style="controlsWrapperStyles">
            <StoryControls
              :is-auto="isAuto"
              :is-skip="isSkip"
              :volume="volume"
              @auto-toggle="onAutoToggle"
              @skip-toggle="onSkipToggle"
              @volume-change="onVolumeChange"
              @menu-toggle="onMenuToggle"
            />
          </div>
        </div>
        
        <!-- 右侧边栏 - 小节导航 -->
        <aside v-if="!isMobile" class="story-quest-sidebar">
          <StoryQuestSidebar
            :quests="currentQuests"
            :current-quest-id="currentQuestId"
            @quest-select="onQuestSelect"
          />
        </aside>
        
      </div>
    </main>
    
    <!-- 移动端底部导航 -->
    <footer v-if="isMobile" class="story-mobile-nav">
      <button class="nav-item" @click="showChapterDrawer = true">章节</button>
      <button class="nav-item" @click="onAutoToggle">{{ isAuto ? '停止' : '自动' }}</button>
      <button class="nav-item" @click="showSettings = true">设置</button>
      <button class="nav-item" @click="showLogDrawer = true">Log</button>
    </footer>
    
    <!-- 移动端抽屉 -->
    <MobileDrawers
      v-if="isMobile"
      v-model:chapter-drawer="showChapterDrawer"
      v-model:log-drawer="showLogDrawer" 
      v-model:settings-drawer="showSettings"
      :wars="wars"
      :quests="currentQuests"
      :dialogue-log="dialogueLog"
      @war-select="onWarSelect"
      @quest-select="onQuestSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'
import type { Character, DialogueMessage, WarInfo, QuestInfo } from '../../types'

// 组件导入
import SceneStage from './scene/SceneStage.vue'
import DialogueBox from './dialogue/DialogueBox.vue'
import StoryControls from './controls/StoryControls.vue'
import StoryWarSidebar from './sidebars/StoryWarSidebar.vue'
import StoryQuestSidebar from './sidebars/StoryQuestSidebar.vue'
import MobileDrawers from './MobileDrawers.vue'

// 响应式数据
const route = useRoute()
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const isMobile = computed(() => windowWidth.value < 1100)

// 组件引用
const sceneStageRef = ref()

// UI 状态
const showSettings = ref(false)
const showChapterDrawer = ref(false)
const showLogDrawer = ref(false)
const debugMode = ref(false) // 可手动切换调试模式

// 故事状态
const storyTitle = ref('Fate/Grand Order - 剧情阅读器')
const currentWarId = ref(100)
const currentQuestId = ref(1000101)
const isAuto = ref(false)
const isSkip = ref(false)
const volume = ref(70)
const isDialogueTyping = ref(false)

// 模拟数据
const wars = ref<WarInfo[]>([
  { id: 100, name: '第一特异点 - 邪龙百年战争 奥尔良' },
  { id: 200, name: '第二特异点 - 永续疯狂帝国 七丘之城' }
])

const currentQuests = ref<QuestInfo[]>([
  { id: 1000101, name: '序幕', warId: 100, type: 'main' },
  { id: 1000102, name: '遭遇', warId: 100, type: 'main' }
])

// 当前场景数据
const currentCharacters = ref<Character[]>([
  {
    id: 'mashu',
    name: '玛修',
    charaGraphId: 98001000,
    src: 'https://static.atlasacademy.io/JP/CharaFigure/98001000/98001000_merged.png',
    posX: 0.28,
    charScale: 1.0,
    active: false,
    face: 1
  },
  {
    id: 'davinci',
    name: '达芬奇',
    charaGraphId: 50040000, 
    src: 'https://static.atlasacademy.io/JP/CharaFigure/50040000/50040000_merged.png',
    posX: 0.72,
    charScale: 1.0,
    active: true,
    face: 2
  }
])

const currentBackground = ref('https://static.atlasacademy.io/JP/Back/back10400.png')

const currentDialogue = reactive<DialogueMessage>({
  speaker: '达芬奇',
  content: '欢迎来到 Fate/Grand Order 的世界！这是一个测试对话。',
  characterId: 'davinci'
})

const dialogueLog = ref<DialogueMessage[]>([])

// 计算样式
const headerContentStyles = computed(() => ({
  maxWidth: 'calc(var(--stage-width, 1024px) + 4px)',
  margin: '0 auto'
}))

const sceneWrapperStyles = computed(() => ({
  maxWidth: 'calc(var(--stage-width, 1024px) + 4px)',
  margin: '0 auto'
}))

const dialogueWrapperStyles = computed(() => ({
  maxWidth: 'calc(var(--stage-width, 1024px) + 4px)', 
  margin: '0 auto'
}))

const controlsWrapperStyles = computed(() => ({
  maxWidth: 'calc(var(--stage-width, 1024px) + 4px)',
  margin: '0 auto'
}))

const layoutClasses = computed(() => [
  'story-layout',
  {
    'story-layout--mobile': isMobile.value,
    'story-layout--debug': debugMode.value
  }
])

// 事件处理
function onWarSelect(warId: number) {
  currentWarId.value = warId
  // TODO: 加载对应战争的任务列表
}

function onQuestSelect(questId: number) {
  currentQuestId.value = questId
  // TODO: 加载对应任务的剧情数据
}

function onCharacterClick(character: Character) {
  currentDialogue.speaker = character.name
  currentDialogue.characterId = character.id
  // 设置角色为激活状态
  sceneStageRef.value?.setCharacterActive(character.id)
}

function onDialogueNext() {
  // TODO: 加载下一句对话
  dialogueLog.value.push({ ...currentDialogue })
}

function onAutoToggle() {
  isAuto.value = !isAuto.value
}

function onSkipToggle() {
  isSkip.value = !isSkip.value
}

function onVolumeChange(newVolume: number) {
  volume.value = newVolume
}

function onMenuToggle() {
  // TODO: 显示主菜单
}

function onSceneReady() {
  console.log('Scene ready!')
}

function goBack() {
  // 简单的返回首页逻辑
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

// 窗口大小监听
function updateWindowSize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  // 初始化窗口大小
  updateWindowSize()
  
  // 添加窗口 resize 监听
  window.addEventListener('resize', updateWindowSize)
  
  // 初始化时设置默认激活角色
  setTimeout(() => {
    sceneStageRef.value?.setCharacterActive('davinci')
  }, 100)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', updateWindowSize)
})
</script>

<style scoped>
.story-layout {
  width: 100%;
  height: 100vh;
  background: radial-gradient(ellipse at center, rgba(10, 15, 30, 1) 0%, rgba(5, 8, 15, 1) 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Noto Sans SC', sans-serif;
}

.story-header {
  flex-shrink: 0;
  background: rgba(8, 12, 24, 0.95);
  border-bottom: 1px solid rgba(60, 120, 180, 0.3);
  padding: 12px 20px;
}

.story-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.story-title {
  font-size: 18px;
  color: #ffd700;
  font-weight: 600;
  margin: 0;
}

.story-main {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.story-container {
  height: 100%;
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  gap: 16px;
}

.story-container.mobile {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
  gap: 12px;
}

.story-war-sidebar,
.story-quest-sidebar {
  background: rgba(8, 20, 45, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(60, 120, 180, 0.2);
  overflow: hidden;
}

.story-scene-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.scene-stage-wrapper {
  flex: 1;
  min-height: 400px;
}

.dialogue-wrapper,
.controls-wrapper {
  flex-shrink: 0;
}

.story-mobile-nav {
  flex-shrink: 0;
  background: rgba(8, 12, 24, 0.98);
  border-top: 1px solid rgba(60, 120, 180, 0.3);
  padding: 8px 12px;
  display: flex;
  justify-content: space-around;
}

/* 按钮基础样式 */
.back-button,
.settings-button {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e8f4f8;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-button:hover,
.settings-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.nav-item {
  padding: 8px 16px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e8f4f8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 调试模式样式 */
.story-layout--debug .story-container {
  border: 2px dashed #ffd700;
}

/* 响应式调整 */
@media (max-width: 1100px) {
  .story-war-sidebar,
  .story-quest-sidebar {
    display: none;
  }
  
  .story-main {
    padding: 12px;
  }
  
  .scene-stage-wrapper {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .story-header {
    padding: 8px 16px;
  }
  
  .story-title {
    font-size: 16px;
  }
  
  .story-main {
    padding: 8px;
  }
}
</style>
