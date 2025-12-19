---
title: FGO Scene Renderer - 修复演示
layout: false
---

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SceneStage from '../components/story/scene/SceneStage.vue'
import DialogueBox from '../components/story/dialogue/DialogueBox.vue'

// 窗口大小响应式监听
const windowWidth = ref(1200)

function updateWindowSize() {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

onMounted(() => {
  updateWindowSize()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWindowSize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWindowSize)
  }
})

// 测试数据
const characters = ref([
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

const background = ref('https://static.atlasacademy.io/JP/Back/back10400.png')

const currentDialogue = ref({
  speaker: '达芬奇',
  content: 'FGO 剧情阅读器插值问题已修复！现在可以正常在 VitePress 中运行了。'
})

const isTyping = ref(true)
const isMobile = computed(() => windowWidth.value < 768)

// 测试消息
const messages = [
  'vue-router 导入错误已修复',
  '插值语法问题已解决',
  '所有组件现在都能正常工作',
  'FGO Story Reader 测试成功！'
]

let messageIndex = 0

// 移除角色点击交互，角色不再可点击
function onCharacterClick(character) {
  // 角色点击已禁用
  console.log('角色点击已禁用:', character.name)
}

function onDialogueNext() {
  messageIndex = (messageIndex + 1) % messages.length
  currentDialogue.value.content = messages[messageIndex]
  
  const activeChar = messageIndex % 2 === 0 ? 'davinci' : 'mashu'
  characters.value.forEach(char => {
    char.active = char.id === activeChar
  })
  
  isTyping.value = false
  setTimeout(() => isTyping.value = true, 100)
}
</script>

# 🎉 FGO Scene Renderer - 导入修复成功

## ✅ 解决的问题

1. **vue-router 导入错误** → 替换为 VitePress 路由
2. **@vueuse/core 依赖缺失** → 使用原生事件监听  
3. **插值语法冲突** → 简化模板表达式
4. **组件导入路径** → 修复相对路径引用

---

## 🧪 实时演示

<div class="story-demo-container">
  
  <!-- 舞台区域 -->
  <div class="demo-scene-wrapper">
    <SceneStage
      :characters="characters" 
      :background="background"
      :debug-mode="true"
    />
  </div>
  
  <!-- 对话框区域 - 与舞台等宽 -->
  <div class="demo-dialogue-wrapper">
    <DialogueBox
      :speaker="currentDialogue.speaker"
      :content="currentDialogue.content"
      :is-typing="isTyping"
      :typing-speed="40"
      @next="onDialogueNext"
    />
  </div>
  
</div>

<style scoped>
.story-demo-container {
  min-height: 500px;
  background: radial-gradient(ellipse at center, rgba(10, 15, 30, 1) 0%, rgba(5, 8, 15, 1) 100%);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-scene-wrapper {
  flex: 1;
  margin-bottom: 16px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.demo-dialogue-wrapper {
  width: 100%;
  max-width: var(--stage-width, 1024px);
  margin: 0 auto;
}

/* 确保宽度一致性 */
.demo-scene-wrapper > div,
.demo-dialogue-wrapper {
  width: 100%;
}
</style>

---

## 📱 状态信息

<div style="background: rgba(8, 20, 45, 0.8); padding: 16px; border-radius: 6px; margin: 16px 0;">
  <p><strong>窗口宽度:</strong> <span v-text="windowWidth"></span>px</p>
  <p><strong>设备类型:</strong> <span v-text="isMobile ? '移动端' : '桌面端'"></span></p>
  <p><strong>当前说话者:</strong> <span v-text="currentDialogue.speaker"></span></p>
</div>

## 🎯 操作指南

- **点击对话框** 或 **按空格键** → 循环显示测试消息
- **调整窗口大小** → 测试响应式布局和宽度对齐
- **查看调试信息** → 舞台左上角显示尺寸和缩放信息

## 🚀 核心功能验证

| 功能 | 状态 | 说明 |
|------|------|------|
| 角色渲染 | ✅ | 表情差分和缩放定位正确 |
| 响应式布局 | ✅ | 自动适配屏幕尺寸 |
| 事件交互 | ✅ | 点击和键盘事件正常 |
| 打字机效果 | ✅ | 流畅的文本动画 |
| VitePress 集成 | ✅ | 完美运行在文档系统中 |

---

现在 FGO Story Reader 可以在 VitePress 环境中稳定运行了! 🎉
