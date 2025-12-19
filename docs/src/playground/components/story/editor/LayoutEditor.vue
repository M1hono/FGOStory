<template>
  <div class="layout-editor">
    <div class="editor-header">
      <h3>Dialogue Layout Editor</h3>
      <div class="editor-actions">
        <button class="action-btn import" @click="showImport = true">Import</button>
        <button class="action-btn reset" @click="resetLayout">Reset</button>
        <button class="action-btn export" @click="exportConfig">Export</button>
      </div>
    </div>
    
    <!-- 导入弹窗 -->
    <div v-if="showImport" class="import-modal" @click.self="showImport = false">
      <div class="import-content">
        <h4>Import Config</h4>
        <textarea v-model="importText" placeholder="Paste config JSON..." rows="12" />
        <div class="import-actions">
          <button class="action-btn" @click="showImport = false">Cancel</button>
          <button class="action-btn export" @click="doImport">Import</button>
        </div>
      </div>
    </div>
    
    <!-- 预览舞台 -->
    <div class="editor-stage">
      <img src="https://static.atlasacademy.io/JP/Back/back10400.png" class="stage-bg" />
      
      <!-- 对话框 -->
      <div 
        class="el-dialogue"
        :style="dialogueStyle"
        @mousedown="startDrag('dialogue', $event)"
      >
        <div class="resize-handle top" @mousedown.stop="startResize('dialogue', 'top', $event)" />
        
        <!-- 名字标签 -->
        <div 
          class="el-speaker"
          :style="speakerStyle"
          @mousedown.stop="startDrag('speaker', $event)"
        >
          <div class="resize-handle se" @mousedown.stop="startResize('speaker', 'se', $event)" />
          <img src="/SystemUI/img_talk_namebg.png" class="el-bg" />
          <span class="el-label">迦摩</span>
        </div>
        
        <!-- 文本区域 -->
        <div 
          class="el-text"
          :style="textStyle"
          @mousedown.stop="startDrag('text', $event)"
        >
          <div class="resize-handle se" @mousedown.stop="startResize('text', 'se', $event)" />
          ——你是不是，真的想要，更进一步的东西？
        </div>
        
        <!-- Skip 按钮 -->
        <div 
          class="el-btn"
          :style="btnSkipStyle"
          @mousedown.stop="startDrag('btnSkip', $event)"
        >
          <div class="resize-handle se" @mousedown.stop="startResize('btnSkip', 'se', $event)" />
          <img src="/SystemUI/btn_skip.png" />
        </div>
        
        <!-- Log 按钮 -->
        <div 
          class="el-btn"
          :style="btnLogStyle"
          @mousedown.stop="startDrag('btnLog', $event)"
        >
          <div class="resize-handle se" @mousedown.stop="startResize('btnLog', 'se', $event)" />
          <img src="/SystemUI/btn_log.png" />
        </div>
        
        <!-- Auto 按钮 -->
        <div 
          class="el-btn"
          :style="btnAutoStyle"
          @mousedown.stop="startDrag('btnAuto', $event)"
        >
          <div class="resize-handle se" @mousedown.stop="startResize('btnAuto', 'se', $event)" />
          <img src="/SystemUI/btn_auto_on.png" />
        </div>
        
        <!-- FF 按钮 -->
        <div 
          class="el-btn"
          :style="btnFfStyle"
          @mousedown.stop="startDrag('btnFf', $event)"
        >
          <div class="resize-handle se" @mousedown.stop="startResize('btnFf', 'se', $event)" />
          <img src="/SystemUI/btn_ff.png" />
        </div>
      </div>
    </div>
    
    <div class="stage-hint">
      Stage: 1024×626 | Drag elements to move, drag corner handles to resize
    </div>
    
    <!-- 配置面板 -->
    <div class="config-panel">
      <!-- Dialogue Box -->
      <div class="config-section">
        <h4>📦 Dialogue Box</h4>
        <div class="config-grid">
          <label>Height</label>
          <input type="number" v-model.number="layout.dialogue.height" />
          <label>Bottom</label>
          <input type="number" v-model.number="layout.dialogue.bottom" />
        </div>
      </div>
      
      <!-- Speaker -->
      <div class="config-section">
        <h4>🏷️ Speaker</h4>
        <div class="config-grid">
          <label>Width</label>
          <input type="number" v-model.number="layout.speaker.width" />
          <label>Height</label>
          <input type="number" v-model.number="layout.speaker.height" />
          <label>Top</label>
          <input type="number" v-model.number="layout.speaker.top" />
          <label>Left</label>
          <input type="number" v-model.number="layout.speaker.left" />
        </div>
      </div>
      
      <!-- Text -->
      <div class="config-section">
        <h4>📝 Text</h4>
        <div class="config-grid">
          <label>Width</label>
          <input type="number" v-model.number="layout.text.width" />
          <label>Height</label>
          <input type="number" v-model.number="layout.text.height" />
          <label>Top</label>
          <input type="number" v-model.number="layout.text.top" />
          <label>Left</label>
          <input type="number" v-model.number="layout.text.left" />
          <label>FontSize</label>
          <input type="number" v-model.number="layout.text.fontSize" />
          <label>LineH</label>
          <input type="number" v-model.number="layout.text.lineHeight" step="0.1" />
        </div>
      </div>
      
      <!-- Skip -->
      <div class="config-section">
        <h4>⏭️ Skip</h4>
        <div class="config-grid">
          <label>Size</label>
          <input type="number" v-model.number="layout.btnSkip.size" />
          <label>Top</label>
          <input type="number" v-model.number="layout.btnSkip.top" />
          <label>Right</label>
          <input type="number" v-model.number="layout.btnSkip.right" />
        </div>
      </div>
      
      <!-- Log -->
      <div class="config-section">
        <h4>📜 Log</h4>
        <div class="config-grid">
          <label>Size</label>
          <input type="number" v-model.number="layout.btnLog.size" />
          <label>Top</label>
          <input type="number" v-model.number="layout.btnLog.top" />
          <label>Right</label>
          <input type="number" v-model.number="layout.btnLog.right" />
        </div>
      </div>
      
      <!-- Auto -->
      <div class="config-section">
        <h4>▶️ Auto</h4>
        <div class="config-grid">
          <label>Size</label>
          <input type="number" v-model.number="layout.btnAuto.size" />
          <label>Top</label>
          <input type="number" v-model.number="layout.btnAuto.top" />
          <label>Right</label>
          <input type="number" v-model.number="layout.btnAuto.right" />
        </div>
      </div>
      
      <!-- FF -->
      <div class="config-section">
        <h4>⏩ FF</h4>
        <div class="config-grid">
          <label>Size</label>
          <input type="number" v-model.number="layout.btnFf.size" />
          <label>Top</label>
          <input type="number" v-model.number="layout.btnFf.top" />
          <label>Right</label>
          <input type="number" v-model.number="layout.btnFf.right" />
        </div>
      </div>
    </div>
    
    <!-- 导出结果 -->
    <div v-if="exportedConfig" class="export-result">
      <h4>Exported Config:</h4>
      <pre>{{ exportedConfig }}</pre>
      <button class="action-btn" @click="copyConfig">Copy</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const showImport = ref(false)
const importText = ref('')
const exportedConfig = ref('')

const defaultLayout = {
  dialogue: { height: 170, bottom: 0 },
  speaker: { width: 262, height: 51, top: -31, left: 1 },
  text: { width: 700, height: 100, top: 50, left: 48, fontSize: 19, lineHeight: 1.85 },
  btnSkip: { size: 52, top: 12, right: 20 },
  btnLog: { size: 52, top: 72, right: 20 },
  btnAuto: { size: 52, top: 132, right: 20 },
  btnFf: { size: 52, top: 192, right: 20 }
}

const layout = reactive(JSON.parse(JSON.stringify(defaultLayout)))

// Computed styles
const dialogueStyle = computed(() => ({
  height: `${layout.dialogue.height}px`,
  bottom: `${layout.dialogue.bottom}px`
}))

const speakerStyle = computed(() => ({
  width: `${layout.speaker.width}px`,
  height: `${layout.speaker.height}px`,
  top: `${layout.speaker.top}px`,
  left: `${layout.speaker.left}px`
}))

const textStyle = computed(() => ({
  width: `${layout.text.width}px`,
  height: `${layout.text.height}px`,
  top: `${layout.text.top}px`,
  left: `${layout.text.left}px`,
  fontSize: `${layout.text.fontSize}px`,
  lineHeight: layout.text.lineHeight
}))

const btnSkipStyle = computed(() => ({
  width: `${layout.btnSkip.size}px`,
  height: `${layout.btnSkip.size}px`,
  top: `${layout.btnSkip.top}px`,
  right: `${layout.btnSkip.right}px`
}))

const btnLogStyle = computed(() => ({
  width: `${layout.btnLog.size}px`,
  height: `${layout.btnLog.size}px`,
  top: `${layout.btnLog.top}px`,
  right: `${layout.btnLog.right}px`
}))

const btnAutoStyle = computed(() => ({
  width: `${layout.btnAuto.size}px`,
  height: `${layout.btnAuto.size}px`,
  top: `${layout.btnAuto.top}px`,
  right: `${layout.btnAuto.right}px`
}))

const btnFfStyle = computed(() => ({
  width: `${layout.btnFf.size}px`,
  height: `${layout.btnFf.size}px`,
  top: `${layout.btnFf.top}px`,
  right: `${layout.btnFf.right}px`
}))

// Drag & Resize
let dragTarget: string | null = null
let resizeTarget: { el: string; corner: string } | null = null
let startPos = { x: 0, y: 0 }
let startValues: Record<string, number> = {}

function startDrag(el: string, e: MouseEvent) {
  dragTarget = el
  startPos = { x: e.clientX, y: e.clientY }
  
  const cfg = (layout as any)[el]
  startValues = { ...cfg }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragTarget) return
  const dx = e.clientX - startPos.x
  const dy = e.clientY - startPos.y
  const cfg = (layout as any)[dragTarget]
  
  if (dragTarget === 'dialogue') {
    cfg.bottom = Math.max(0, startValues.bottom - dy)
  } else if (dragTarget === 'speaker' || dragTarget === 'text') {
    cfg.top = startValues.top + dy
    cfg.left = startValues.left + dx
  } else if (dragTarget.startsWith('btn')) {
    cfg.top = startValues.top + dy
    cfg.right = Math.max(0, startValues.right - dx)
  }
}

function stopDrag() {
  dragTarget = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function startResize(el: string, corner: string, e: MouseEvent) {
  resizeTarget = { el, corner }
  startPos = { x: e.clientX, y: e.clientY }
  
  const cfg = (layout as any)[el]
  startValues = { ...cfg }
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(e: MouseEvent) {
  if (!resizeTarget) return
  const dx = e.clientX - startPos.x
  const dy = e.clientY - startPos.y
  const { el } = resizeTarget
  const cfg = (layout as any)[el]
  
  if (el === 'dialogue') {
    cfg.height = Math.max(100, startValues.height - dy)
  } else if (el === 'speaker') {
    cfg.width = Math.max(60, startValues.width + dx)
    cfg.height = Math.max(20, startValues.height + dy)
  } else if (el === 'text') {
    cfg.width = Math.max(100, startValues.width + dx)
    cfg.height = Math.max(40, startValues.height + dy)
  } else if (el.startsWith('btn')) {
    const newSize = Math.max(24, startValues.size + Math.max(dx, dy))
    cfg.size = newSize
  }
}

function stopResize() {
  resizeTarget = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

function resetLayout() {
  Object.assign(layout, JSON.parse(JSON.stringify(defaultLayout)))
  exportedConfig.value = ''
}

function doImport() {
  try {
    const cfg = JSON.parse(importText.value)
    
    if (cfg.dialogueBox) {
      if (cfg.dialogueBox.minHeight) layout.dialogue.height = parseInt(cfg.dialogueBox.minHeight)
    }
    if (cfg.speaker) {
      if (cfg.speaker.width) layout.speaker.width = parseInt(cfg.speaker.width)
      if (cfg.speaker.height) layout.speaker.height = parseInt(cfg.speaker.height)
      if (cfg.speaker.top) layout.speaker.top = parseInt(cfg.speaker.top)
      if (cfg.speaker.left) layout.speaker.left = parseInt(cfg.speaker.left)
    }
    if (cfg.text) {
      if (cfg.text.fontSize) layout.text.fontSize = parseInt(cfg.text.fontSize)
      if (cfg.text.lineHeight) layout.text.lineHeight = parseFloat(cfg.text.lineHeight)
    }
    if (cfg.controls) {
      if (cfg.controls.right) {
        const r = parseInt(cfg.controls.right)
        layout.btnSkip.right = r
        layout.btnLog.right = r
        layout.btnAuto.right = r
        layout.btnFf.right = r
      }
      if (cfg.controls.gap) {
        const gap = parseInt(cfg.controls.gap)
        layout.btnLog.top = layout.btnSkip.top + layout.btnSkip.size + gap
        layout.btnAuto.top = layout.btnLog.top + layout.btnLog.size + gap
        layout.btnFf.top = layout.btnAuto.top + layout.btnAuto.size + gap
      }
    }
    
    showImport.value = false
    importText.value = ''
    alert('Imported!')
  } catch {
    alert('Invalid JSON!')
  }
}

function exportConfig() {
  const cfg = {
    dialogueBox: {
      minHeight: `${layout.dialogue.height}px`
    },
    speaker: {
      width: `${layout.speaker.width}px`,
      height: `${layout.speaker.height}px`,
      top: `${layout.speaker.top}px`,
      left: `${layout.speaker.left}px`
    },
    text: {
      width: `${layout.text.width}px`,
      height: `${layout.text.height}px`,
      top: `${layout.text.top}px`,
      left: `${layout.text.left}px`,
      fontSize: `${layout.text.fontSize}px`,
      lineHeight: layout.text.lineHeight
    },
    btnSkip: {
      size: `${layout.btnSkip.size}px`,
      top: `${layout.btnSkip.top}px`,
      right: `${layout.btnSkip.right}px`
    },
    btnLog: {
      size: `${layout.btnLog.size}px`,
      top: `${layout.btnLog.top}px`,
      right: `${layout.btnLog.right}px`
    },
    btnAuto: {
      size: `${layout.btnAuto.size}px`,
      top: `${layout.btnAuto.top}px`,
      right: `${layout.btnAuto.right}px`
    },
    btnFf: {
      size: `${layout.btnFf.size}px`,
      top: `${layout.btnFf.top}px`,
      right: `${layout.btnFf.right}px`
    }
  }
  exportedConfig.value = JSON.stringify(cfg, null, 2)
}

function copyConfig() {
  navigator.clipboard.writeText(exportedConfig.value)
  alert('Copied!')
}
</script>

<style scoped>
.layout-editor {
  padding: 20px;
  background: #0a0a14;
  min-height: 100vh;
  color: #e8e8e8;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  max-width: 1024px;
  margin-left: auto;
  margin-right: auto;
}

.editor-header h3 { margin: 0; color: #ffd700; }

.editor-actions { display: flex; gap: 10px; }

.action-btn {
  padding: 8px 16px;
  border: 1px solid #4a8abf;
  background: rgba(74, 138, 191, 0.2);
  color: #4a8abf;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.action-btn:hover { background: rgba(74, 138, 191, 0.4); }
.action-btn.export { border-color: #ffd700; color: #ffd700; background: rgba(255,215,0,0.1); }
.action-btn.reset { border-color: #dc3545; color: #dc3545; background: rgba(220,53,69,0.1); }
.action-btn.import { border-color: #28a745; color: #28a745; background: rgba(40,167,69,0.1); }

/* Import Modal */
.import-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.import-content {
  background: #1a1a2e;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #4a8abf;
  width: 480px;
}
.import-content h4 { margin: 0 0 12px; color: #28a745; }
.import-content textarea {
  width: 100%;
  padding: 12px;
  background: rgba(0,0,0,0.5);
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
  margin-bottom: 12px;
}
.import-actions { display: flex; gap: 12px; justify-content: flex-end; }

/* Stage */
.editor-stage {
  position: relative;
  width: 1024px;
  height: 626px;
  margin: 0 auto;
  border: 2px solid #4a8abf;
  border-radius: 8px;
  overflow: hidden;
}
.stage-bg { width: 100%; height: 100%; object-fit: cover; }
.stage-hint {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin: 8px 0 16px;
}

/* Dialogue */
.el-dialogue {
  position: absolute;
  left: 0;
  right: 0;
  background: url('/SystemUI/img_talk_textbg.png') center / 100% 100% no-repeat;
  cursor: move;
  user-select: none;
  border: 1px solid rgba(255,215,0,0.3);
}

/* Speaker */
.el-speaker {
  position: absolute;
  cursor: move;
  border: 1px dashed rgba(0,255,255,0.5);
}
.el-speaker .el-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}
.el-speaker .el-label {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 20px;
  color: #fff;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.9);
}

/* Text */
.el-text {
  position: absolute;
  cursor: move;
  border: 1px dashed rgba(255,255,0,0.5);
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.9);
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
}

/* Buttons */
.el-btn {
  position: absolute;
  cursor: move;
  border: 1px dashed rgba(255,0,255,0.5);
}
.el-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
}

/* Resize Handles */
.resize-handle {
  position: absolute;
  background: #ffd700;
  border-radius: 2px;
  z-index: 100;
}
.resize-handle.top {
  top: -4px;
  left: 30%;
  right: 30%;
  height: 8px;
  cursor: n-resize;
}
.resize-handle.se {
  bottom: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  cursor: se-resize;
}

/* Config Panel */
.config-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 1024px;
  margin: 0 auto 16px;
}
.config-section {
  background: rgba(255,255,255,0.03);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
}
.config-section h4 {
  margin: 0 0 8px;
  color: #4a8abf;
  font-size: 12px;
}
.config-grid {
  display: grid;
  grid-template-columns: 55px 60px;
  gap: 4px 6px;
  font-size: 11px;
}
.config-grid label { color: #888; line-height: 24px; }
.config-grid input {
  padding: 3px 5px;
  background: rgba(0,0,0,0.4);
  border: 1px solid #333;
  border-radius: 3px;
  color: #fff;
  text-align: right;
  font-size: 11px;
}

/* Export */
.export-result {
  max-width: 1024px;
  margin: 0 auto;
  background: rgba(0,0,0,0.3);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #4a8abf;
}
.export-result h4 { margin: 0 0 12px; color: #ffd700; font-size: 14px; }
.export-result pre {
  background: #000;
  padding: 12px;
  border-radius: 4px;
  font-size: 11px;
  color: #4a8abf;
  margin-bottom: 12px;
  max-height: 300px;
  overflow: auto;
}
</style>
