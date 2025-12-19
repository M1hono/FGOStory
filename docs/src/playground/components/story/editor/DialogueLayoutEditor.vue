<template>
  <div class="editor-container">
    <div class="editor-header">
      <h2>Dialogue Layout Editor</h2>
      <div class="header-actions">
        <button class="btn reset" @click="resetAll">Reset All</button>
        <button class="btn export" @click="exportConfig">Export CSS</button>
      </div>
    </div>
    
    <div class="editor-body">
      <!-- 左侧：预览区 -->
      <div class="preview-panel">
        <div class="stage-preview" ref="stageRef">
          <img 
            src="https://static.atlasacademy.io/JP/Back/back10400.png" 
            class="stage-bg"
            alt="background"
          />
          
          <!-- 对话框（可拖拽调整位置和大小） -->
          <div 
            class="dialogue-preview"
            :style="dialogueStyle"
            @mousedown="startDrag('dialogue', $event)"
          >
            <!-- 上边缘拖拽 -->
            <div class="resize-edge top" @mousedown.stop="startResize('dialogue', 'top', $event)" />
            
            <!-- 名字标签（可拖拽） -->
            <div 
              class="speaker-preview"
              :style="speakerStyle"
              @mousedown.stop="startDrag('speaker', $event)"
            >
              <div class="resize-corner" @mousedown.stop="startResize('speaker', 'se', $event)" />
              迦摩
            </div>
            
            <!-- 文本区域（显示边界） -->
            <div class="text-area-preview" :style="textAreaStyle">
              ——你是不是，真的想要，更进一步的东西？
            </div>
            
            <!-- 控制按钮区域（可拖拽） -->
            <div 
              class="controls-preview"
              :style="controlsStyle"
              @mousedown.stop="startDrag('controls', $event)"
            >
              <div class="ctrl-btn">记录</div>
              <div class="ctrl-btn">自动</div>
              <div class="ctrl-btn">⚙</div>
            </div>
          </div>
        </div>
        
        <div class="stage-info">
          Stage: 1024 × 626 | Dialogue position is relative to stage bottom
        </div>
      </div>
      
      <!-- 右侧：配置面板 -->
      <div class="config-panel">
        <!-- 对话框配置 -->
        <div class="config-section">
          <h3>📦 Dialogue Box (相对于舞台)</h3>
          <div class="config-grid">
            <label>Left:</label>
            <input type="number" v-model.number="layout.dialogue.left" /> px
            
            <label>Right:</label>
            <input type="number" v-model.number="layout.dialogue.right" /> px
            
            <label>Bottom:</label>
            <input type="number" v-model.number="layout.dialogue.bottom" /> px
            
            <label>Height:</label>
            <input type="number" v-model.number="layout.dialogue.height" /> px
          </div>
        </div>
        
        <!-- 名字标签配置 -->
        <div class="config-section">
          <h3>🏷️ Speaker Tag (相对于对话框)</h3>
          <div class="config-grid">
            <label>Top:</label>
            <input type="number" v-model.number="layout.speaker.top" /> px
            
            <label>Left:</label>
            <input type="number" v-model.number="layout.speaker.left" /> px
            
            <label>Width:</label>
            <input type="number" v-model.number="layout.speaker.width" /> px
            
            <label>Height:</label>
            <input type="number" v-model.number="layout.speaker.height" /> px
          </div>
        </div>
        
        <!-- 文本区域配置 -->
        <div class="config-section">
          <h3>📝 Text Area (相对于对话框)</h3>
          <div class="config-grid">
            <label>Top:</label>
            <input type="number" v-model.number="layout.textArea.top" /> px
            
            <label>Left:</label>
            <input type="number" v-model.number="layout.textArea.left" /> px
            
            <label>Right:</label>
            <input type="number" v-model.number="layout.textArea.right" /> px
            
            <label>Bottom:</label>
            <input type="number" v-model.number="layout.textArea.bottom" /> px
          </div>
        </div>
        
        <!-- 控制按钮配置 -->
        <div class="config-section">
          <h3>🎮 Controls (相对于对话框)</h3>
          <div class="config-grid">
            <label>Top:</label>
            <input type="number" v-model.number="layout.controls.top" /> px
            
            <label>Right:</label>
            <input type="number" v-model.number="layout.controls.right" /> px
            
            <label>Width:</label>
            <input type="number" v-model.number="layout.controls.width" /> px
            
            <label>Gap:</label>
            <input type="number" v-model.number="layout.controls.gap" /> px
          </div>
        </div>
        
        <!-- 导出结果 -->
        <div v-if="exportedCSS" class="export-section">
          <h3>📋 Exported CSS</h3>
          <pre>{{ exportedCSS }}</pre>
          <button class="btn copy" @click="copyCSS">Copy to Clipboard</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const stageRef = ref<HTMLElement>()
const exportedCSS = ref('')

const defaultLayout = {
  dialogue: { left: 0, right: 0, bottom: 0, height: 200 },
  speaker: { top: 8, left: 24, width: 140, height: 48 },
  textArea: { top: 72, left: 48, right: 100, bottom: 40 },
  controls: { top: 50, right: 16, width: 56, gap: 8 }
}

const layout = reactive(JSON.parse(JSON.stringify(defaultLayout)))

// 对话框样式（相对于舞台）
const dialogueStyle = computed(() => ({
  position: 'absolute',
  left: `${layout.dialogue.left}px`,
  right: `${layout.dialogue.right}px`,
  bottom: `${layout.dialogue.bottom}px`,
  height: `${layout.dialogue.height}px`,
  background: 'url(/SystemUI/img_talk_textbg.png) center / 100% 100% no-repeat',
  cursor: 'move'
}))

// 名字标签样式（相对于对话框）
const speakerStyle = computed(() => ({
  position: 'absolute',
  top: `${layout.speaker.top}px`,
  left: `${layout.speaker.left}px`,
  width: `${layout.speaker.width}px`,
  height: `${layout.speaker.height}px`,
  background: 'url(/SystemUI/img_talk_namebg.png) left center / 100% 100% no-repeat',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '20px',
  color: '#fff',
  fontSize: '20px',
  fontWeight: 'bold',
  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
  cursor: 'move'
}))

// 文本区域样式
const textAreaStyle = computed(() => ({
  position: 'absolute',
  top: `${layout.textArea.top}px`,
  left: `${layout.textArea.left}px`,
  right: `${layout.textArea.right}px`,
  bottom: `${layout.textArea.bottom}px`,
  border: '2px dashed rgba(255,215,0,0.5)',
  color: '#fff',
  fontSize: '22px',
  lineHeight: '1.8',
  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
  padding: '8px',
  overflow: 'hidden'
}))

// 控制按钮样式
const controlsStyle = computed(() => ({
  position: 'absolute',
  top: `${layout.controls.top}%`,
  right: `${layout.controls.right}px`,
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  gap: `${layout.controls.gap}px`,
  width: `${layout.controls.width}px`,
  cursor: 'move'
}))

// 拖拽状态
let dragTarget: string | null = null
let dragStart = { x: 0, y: 0 }
let dragInitial: Record<string, number> = {}

function startDrag(target: string, e: MouseEvent) {
  dragTarget = target
  dragStart = { x: e.clientX, y: e.clientY }
  
  if (target === 'dialogue') {
    dragInitial = { 
      left: layout.dialogue.left, 
      right: layout.dialogue.right,
      bottom: layout.dialogue.bottom 
    }
  } else if (target === 'speaker') {
    dragInitial = { top: layout.speaker.top, left: layout.speaker.left }
  } else if (target === 'controls') {
    dragInitial = { top: layout.controls.top, right: layout.controls.right }
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragTarget) return
  
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  
  if (dragTarget === 'dialogue') {
    layout.dialogue.left = Math.max(0, dragInitial.left + dx)
    layout.dialogue.right = Math.max(0, dragInitial.right - dx)
    layout.dialogue.bottom = Math.max(0, dragInitial.bottom - dy)
  } else if (dragTarget === 'speaker') {
    layout.speaker.top = dragInitial.top + dy
    layout.speaker.left = Math.max(0, dragInitial.left + dx)
  } else if (dragTarget === 'controls') {
    layout.controls.top = Math.max(0, Math.min(100, dragInitial.top + dy / 2))
    layout.controls.right = Math.max(0, dragInitial.right - dx)
  }
}

function stopDrag() {
  dragTarget = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// Resize 状态
let resizeTarget: string | null = null
let resizeCorner: string | null = null

function startResize(target: string, corner: string, e: MouseEvent) {
  resizeTarget = target
  resizeCorner = corner
  dragStart = { x: e.clientX, y: e.clientY }
  
  if (target === 'dialogue') {
    dragInitial = { height: layout.dialogue.height, bottom: layout.dialogue.bottom }
  } else if (target === 'speaker') {
    dragInitial = { width: layout.speaker.width, height: layout.speaker.height }
  }
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(e: MouseEvent) {
  if (!resizeTarget) return
  
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  
  if (resizeTarget === 'dialogue' && resizeCorner === 'top') {
    layout.dialogue.height = Math.max(100, dragInitial.height - dy)
  } else if (resizeTarget === 'speaker' && resizeCorner === 'se') {
    layout.speaker.width = Math.max(80, dragInitial.width + dx)
    layout.speaker.height = Math.max(30, dragInitial.height + dy)
  }
}

function stopResize() {
  resizeTarget = null
  resizeCorner = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

function resetAll() {
  Object.assign(layout, JSON.parse(JSON.stringify(defaultLayout)))
  exportedCSS.value = ''
}

function exportConfig() {
  exportedCSS.value = `/* DialogueBox - 相对于舞台 */
.stage-dialogue {
  position: absolute;
  left: ${layout.dialogue.left}px;
  right: ${layout.dialogue.right}px;
  bottom: ${layout.dialogue.bottom}px;
}

.dialogue-box {
  min-height: ${layout.dialogue.height}px;
  padding: ${layout.textArea.top}px ${layout.textArea.right}px ${layout.textArea.bottom}px ${layout.textArea.left}px;
}

/* Speaker - 相对于对话框 */
.dialogue-speaker {
  position: absolute;
  top: ${layout.speaker.top}px;
  left: ${layout.speaker.left}px;
  width: ${layout.speaker.width}px;
  height: ${layout.speaker.height}px;
}

/* Controls - 相对于对话框 */
.dialogue-controls {
  position: absolute;
  top: ${layout.controls.top}%;
  right: ${layout.controls.right}px;
  transform: translateY(-50%);
  gap: ${layout.controls.gap}px;
}

.control-btn {
  width: ${layout.controls.width}px;
  height: ${layout.controls.width}px;
}`
}

function copyCSS() {
  navigator.clipboard.writeText(exportedCSS.value)
  alert('Copied!')
}
</script>

<style scoped>
.editor-container {
  min-height: 100vh;
  background: #0a0a14;
  color: #e8e8e8;
  font-family: system-ui, sans-serif;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #12141a;
  border-bottom: 1px solid #333;
}

.editor-header h2 {
  margin: 0;
  color: #ffd700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #4a8abf;
  background: rgba(74, 138, 191, 0.2);
  color: #4a8abf;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(74, 138, 191, 0.4);
}

.btn.reset {
  border-color: #dc3545;
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.btn.export {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.editor-body {
  display: flex;
  gap: 24px;
  padding: 24px;
}

.preview-panel {
  flex: 1;
}

.stage-preview {
  position: relative;
  width: 1024px;
  height: 626px;
  border: 2px solid #4a8abf;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.stage-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stage-info {
  margin-top: 12px;
  font-size: 13px;
  color: #888;
  text-align: center;
}

.dialogue-preview {
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-sizing: border-box;
}

.resize-edge.top {
  position: absolute;
  top: -4px;
  left: 20%;
  right: 20%;
  height: 8px;
  background: #ffd700;
  cursor: n-resize;
  border-radius: 4px;
}

.speaker-preview {
  border: 1px dashed rgba(0, 255, 255, 0.6);
  box-sizing: border-box;
}

.resize-corner {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  background: #0ff;
  cursor: se-resize;
  border-radius: 2px;
}

.text-area-preview {
  box-sizing: border-box;
  pointer-events: none;
}

.controls-preview {
  border: 1px dashed rgba(255, 0, 255, 0.6);
  box-sizing: border-box;
  padding: 8px;
}

.ctrl-btn {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  border-radius: 4px;
}

.config-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
}

.config-section h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #4a8abf;
}

.config-grid {
  display: grid;
  grid-template-columns: 60px 80px 30px;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.config-grid label {
  color: #888;
}

.config-grid input {
  width: 100%;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: right;
}

.export-section {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 16px;
}

.export-section h3 {
  margin: 0 0 12px;
  color: #ffd700;
}

.export-section pre {
  background: #000;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #4a8abf;
  overflow-x: auto;
  max-height: 300px;
  margin-bottom: 12px;
}

.btn.copy {
  width: 100%;
}
</style>

