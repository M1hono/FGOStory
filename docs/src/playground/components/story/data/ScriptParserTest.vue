<template>
  <div class="parser-test">
    <h1>📜 Script Parser Test</h1>
    
    <!-- Input Section -->
    <div class="input-section">
      <h2>Raw Script Input</h2>
      <textarea 
        v-model="rawScript"
        placeholder="Paste FGO raw script here..."
        rows="10"
      />
      <button class="parse-btn" @click="parseScriptInput">
        🔄 Parse Script
      </button>
    </div>

    <!-- Output Section -->
    <div v-if="parsedAST" class="output-section">
      <h2>Parsed Output</h2>
      
      <!-- Summary -->
      <div class="summary-card">
        <div class="stat">
          <span class="label">Scenes:</span>
          <span class="value">{{ parsedAST.scenes.length }}</span>
        </div>
        <div class="stat">
          <span class="label">Backgrounds:</span>
          <span class="value">{{ parsedAST.assets.backgrounds.length }}</span>
        </div>
        <div class="stat">
          <span class="label">Characters:</span>
          <span class="value">{{ parsedAST.assets.figures.length }}</span>
        </div>
        <div class="stat">
          <span class="label">BGM:</span>
          <span class="value">{{ parsedAST.assets.bgm.length }}</span>
        </div>
      </div>

      <!-- Scenes List -->
      <div class="scenes-list">
        <div 
          v-for="(scene, index) in parsedAST.scenes" 
          :key="scene.sceneId"
          class="scene-card"
        >
          <h3>Scene {{ index + 1 }}: {{ scene.sceneId }}</h3>
          
          <div v-if="scene.background" class="scene-bg">
            <strong>Background:</strong> {{ scene.background }}
          </div>
          
          <div v-if="scene.bgm" class="scene-bgm">
            <strong>BGM:</strong> {{ scene.bgm }}
          </div>
          
          <div v-if="scene.characters.length > 0" class="scene-chars">
            <strong>Characters:</strong>
            <div class="char-list">
              <div 
                v-for="char in scene.characters" 
                :key="char.slot"
                class="char-tag"
                :class="{ speaking: char.isSpeaking }"
              >
                [{{ char.slot }}] {{ char.name }} 
                (ID: {{ char.id }}, Pos: {{ char.position }}, Face: {{ char.face }})
              </div>
            </div>
          </div>
          
          <div v-if="scene.dialogues.length > 0" class="scene-dialogues">
            <strong>Dialogues ({{ scene.dialogues.length }}):</strong>
            <div class="dialogue-list">
              <div 
                v-for="(d, dIdx) in scene.dialogues.slice(0, 5)" 
                :key="dIdx"
                class="dialogue-item"
              >
                <span v-if="d.speaker" class="speaker">{{ d.speaker }}:</span>
                <span class="text">{{ d.text }}</span>
              </div>
              <div v-if="scene.dialogues.length > 5" class="more">
                ... and {{ scene.dialogues.length - 5 }} more
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Raw JSON -->
      <details class="raw-json">
        <summary>Show Raw JSON</summary>
        <pre>{{ JSON.stringify(parsedAST, null, 2) }}</pre>
      </details>
    </div>

    <!-- Demo Script -->
    <div class="demo-section">
      <h2>Demo Scripts</h2>
      <button @click="loadDemoScript('simple')">Load Simple Demo</button>
      <button @click="loadDemoScript('complex')">Load Complex Demo</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseScript, type ScriptAST } from '../../../services/script-parser'

const rawScript = ref('')
const parsedAST = ref<ScriptAST | null>(null)

function parseScriptInput() {
  if (!rawScript.value.trim()) return
  parsedAST.value = parseScript(rawScript.value, 'user-input')
}

const DEMO_SCRIPTS = {
  simple: `[scene bg10300]
[bgm BGM_EVENT_1]
[charaSet A 98001000 1 玛修]
[charaFace A 1]
[charaTalk A]
玛修：「前辈，我们到达了15世纪的法国！」[k]
[wait 1.0]
玛修：「这里的空气和我们的时代完全不同呢。」[k]`,

  complex: `[scene bg10400]
[bgm BGM_BATTLE_1]
[charaSet A 98001000 0 玛修]
[charaSet B 98003000 2 达芬奇]
[charaFace A 1]
[charaFace B 2]
[charaTalk A]
玛修：「达芬奇小姐，情况如何？」[k]
[charaTalk B]
达芬奇：「嗯...这个特异点的魔力反应很强烈。」[k]
[charaFace B 5]
达芬奇：「要小心行动哦，御主和玛修。」[k]
[se ad1]
[charaTalk A]
[charaFace A 3]
玛修：「那个声音是...!」[k]
[charaSet C 50040000 1 贞德]
[charaFace C 1]
[charaTalk C]
贞德：「你们是...从哪里来的？」[k]`,
}

function loadDemoScript(type: 'simple' | 'complex') {
  rawScript.value = DEMO_SCRIPTS[type]
  parseScriptInput()
}
</script>

<style scoped>
.parser-test {
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
  font-family: system-ui, sans-serif;
}

h1 {
  color: #fbbf24;
  margin-bottom: 20px;
}

h2 {
  color: #38bdf8;
  margin: 20px 0 10px;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
}

.input-section textarea {
  width: 100%;
  padding: 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.parse-btn {
  margin-top: 10px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.parse-btn:hover {
  background: #2563eb;
}

.summary-card {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  background: #1e293b;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  background: #0f172a;
  border-radius: 6px;
}

.stat .label {
  font-size: 12px;
  color: #94a3b8;
}

.stat .value {
  font-size: 24px;
  font-weight: bold;
  color: #fbbf24;
}

.scenes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scene-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
}

.scene-card h3 {
  margin: 0 0 12px;
  color: #f472b6;
}

.scene-bg, .scene-bgm {
  margin-bottom: 8px;
  font-family: monospace;
  color: #94a3b8;
}

.char-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.char-tag {
  padding: 4px 8px;
  background: #334155;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.char-tag.speaking {
  background: #22c55e;
  color: #0f172a;
}

.dialogue-list {
  margin-top: 8px;
}

.dialogue-item {
  padding: 8px;
  background: #0f172a;
  border-radius: 4px;
  margin-bottom: 4px;
}

.speaker {
  color: #fbbf24;
  font-weight: 600;
  margin-right: 8px;
}

.text {
  color: #e2e8f0;
}

.more {
  color: #64748b;
  font-style: italic;
  margin-top: 8px;
}

.raw-json {
  margin-top: 20px;
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.raw-json summary {
  cursor: pointer;
  color: #94a3b8;
}

.raw-json pre {
  margin-top: 10px;
  padding: 16px;
  background: #0f172a;
  border-radius: 6px;
  overflow: auto;
  font-size: 12px;
  max-height: 400px;
}

.demo-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #334155;
}

.demo-section button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #334155;
  color: #e2e8f0;
  border: 1px solid #475569;
  border-radius: 6px;
  cursor: pointer;
}

.demo-section button:hover {
  background: #475569;
}
</style>

