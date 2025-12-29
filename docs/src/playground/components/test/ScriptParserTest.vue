<template>
  <div class="script-parser-test">
    <h2>1. 原始脚本加载测试</h2>
    <div class="test-section">
      <input v-model="scriptId" placeholder="脚本ID (如 0100000011)" />
      <button @click="loadScript">加载脚本</button>
      <button @click="loadTestScript">加载测试脚本</button>
    </div>
    
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    
    <div v-if="rawScript" class="raw-script">
      <h3>原始脚本 (前 50 行)</h3>
      <pre>{{ rawScript.split('\n').slice(0, 50).join('\n') }}</pre>
    </div>
    
    <h2>2. 解析结果测试</h2>
    <div v-if="parsedScript" class="parsed-result">
      <h3>解析统计</h3>
      <ul>
        <li>脚本 ID: {{ parsedScript.id }}</li>
        <li>场景总数: {{ parsedScript.scenes.length }}</li>
        <li>有对话的场景: {{ scenesWithDialogue }}</li>
        <li>有选项的场景: {{ scenesWithChoices }}</li>
      </ul>
      
      <h3>场景详情</h3>
      <div v-for="(scene, idx) in parsedScript.scenes.slice(0, 10)" :key="idx" class="scene-detail">
        <h4>场景 {{ idx + 1 }} ({{ scene.sceneType }})</h4>
        <div class="scene-info">
          <div v-if="scene.background">背景: {{ scene.background }}</div>
          <div v-if="scene.characters.length">
            角色: 
            <span v-for="(char, cidx) in scene.characters" :key="cidx" class="character-tag">
              {{ char.displayName }} ({{ char.charaGraphId }}, slot={{ char.slot }}, visible={{ char.visible !== false }})
            </span>
          </div>
          <div v-if="scene.dialogues.length">
            <div v-for="(d, didx) in scene.dialogues" :key="didx" class="dialogue">
              <strong>{{ d.speaker || '旁白' }}:</strong> {{ d.text.substring(0, 100) }}{{ d.text.length > 100 ? '...' : '' }}
            </div>
          </div>
          <div v-if="scene.choices?.length">
            <div class="choices">
              选项:
              <span v-for="(c, cidx) in scene.choices" :key="cidx" class="choice-tag">
                {{ c.text }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <h2>3. NPC 数据测试</h2>
    <div class="test-section">
      <button @click="loadNPCData">加载 NPC 数据</button>
    </div>
    <div v-if="npcStats" class="npc-stats">
      <p>NPC 总数: {{ npcStats.total }}</p>
      <h4>示例 NPC:</h4>
      <div v-for="npc in npcStats.samples" :key="npc.id" class="npc-sample">
        <img :src="npc.faceUrl" :alt="npc.name" class="npc-face" />
        <div>
          <strong>{{ npc.name }}</strong> (ID: {{ npc.id }})
          <br />
          来源: {{ npc.parentName }} (SVT {{ npc.parentId }})
          <br />
          faceX={{ npc.faceX }}, faceY={{ npc.faceY }}, offsetX={{ npc.offsetX }}, offsetY={{ npc.offsetY }}
        </div>
      </div>
    </div>
    
    <h2>4. 角色渲染数据测试</h2>
    <div class="test-section">
      <input v-model="testCharaId" placeholder="charaGraphId" />
      <button @click="testCharacterRender">获取渲染数据</button>
    </div>
    <div v-if="renderData" class="render-data">
      <pre>{{ JSON.stringify(renderData, null, 2) }}</pre>
      <div class="render-preview">
        <img :src="renderData.figureUrl" alt="Figure" style="max-height: 300px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { parseScript, loadScript } from '../../services/script-parser'
import { fetchAllNPCs, getCharacterRenderData, getCharaFaceUrl } from '../../services/npc-data'
import type { ParsedScript } from '../../types'

const scriptId = ref('0100000011')
const rawScript = ref('')
const parsedScript = ref<ParsedScript | null>(null)
const loading = ref(false)
const error = ref('')

const testCharaId = ref('98001000')
const renderData = ref<any>(null)

const npcStats = ref<{
  total: number
  samples: Array<{
    id: number
    name: string
    parentId: number
    parentName: string
    faceUrl: string
    faceX: number
    faceY: number
    offsetX: number
    offsetY: number
  }>
} | null>(null)

const scenesWithDialogue = computed(() => 
  parsedScript.value?.scenes.filter(s => s.dialogues.length > 0).length || 0
)

const scenesWithChoices = computed(() => 
  parsedScript.value?.scenes.filter(s => s.choices && s.choices.length > 0).length || 0
)

const TEST_SCRIPT = `＄01-00-00-00-1-0

[soundStopAll]
[scene 10000]
[charaSet A 98001000 0 ？？？]
[charaSet B 98003000 2 ？？？]
[charaSet C 98002000 1 ？？？]
[charaFace C 0]
[charaFadein C 0]
[wipeFilter circleIn 0.6 1]
[fadein black 1]
[wait fade]

＠C：？？？
フォウ……？[r]キュウ……キュウ？
[k]

[charaFadein A 0 0]
[charaFadein B 0 2]

＠A：玛修
先辈，您醒了吗？
[k]

？1：是的
？2：还没有
？！

[fadeout black 1]
[end]
`

async function loadTestScript() {
  rawScript.value = TEST_SCRIPT
  parsedScript.value = parseScript(TEST_SCRIPT, 'test-script')
  error.value = ''
}

async function doLoadScript() {
  if (!scriptId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const result = await loadScript('JP', scriptId.value)
    parsedScript.value = result
    
    const prefix = scriptId.value.slice(0, 2)
    const url = `https://static.atlasacademy.io/JP/Script/${prefix}/${scriptId.value}.txt`
    const response = await fetch(url)
    rawScript.value = await response.text()
  } catch (e) {
    error.value = `加载失败: ${e}`
  } finally {
    loading.value = false
  }
}

async function loadNPCData() {
  loading.value = true
  try {
    const npcs = await fetchAllNPCs('JP')
    const samples: any[] = []
    
    const sampleIds = [98001000, 98002000, 98003000, 98004000, 98005000]
    for (const id of sampleIds) {
      const npc = npcs.get(id)
      if (npc) {
        samples.push({
          id: npc.charaGraphId,
          name: npc.parentSvtName,
          parentId: npc.parentSvtId,
          parentName: npc.parentSvtName,
          faceUrl: getCharaFaceUrl(npc.charaGraphId),
          faceX: npc.faceX,
          faceY: npc.faceY,
          offsetX: npc.offsetX,
          offsetY: npc.offsetY
        })
      }
    }
    
    npcStats.value = {
      total: npcs.size,
      samples
    }
  } catch (e) {
    error.value = `NPC 数据加载失败: ${e}`
  } finally {
    loading.value = false
  }
}

async function testCharacterRender() {
  const id = parseInt(testCharaId.value)
  if (isNaN(id)) return
  
  loading.value = true
  try {
    renderData.value = await getCharacterRenderData(id)
  } catch (e) {
    error.value = `获取渲染数据失败: ${e}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.script-parser-test {
  padding: 20px;
  font-family: sans-serif;
}

.test-section {
  margin: 10px 0;
  display: flex;
  gap: 10px;
}

.test-section input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
}

.test-section button {
  padding: 8px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-section button:hover {
  background: #3a7ac9;
}

.loading {
  color: #666;
  padding: 10px;
}

.error {
  color: red;
  padding: 10px;
  background: #fee;
  border-radius: 4px;
}

.raw-script {
  margin: 20px 0;
}

.raw-script pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.parsed-result ul {
  list-style: none;
  padding: 0;
}

.parsed-result li {
  padding: 5px 0;
}

.scene-detail {
  margin: 15px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #4a90d9;
}

.scene-detail h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.scene-info {
  font-size: 14px;
}

.character-tag {
  display: inline-block;
  background: #e0e0e0;
  padding: 2px 8px;
  margin: 2px;
  border-radius: 4px;
  font-size: 12px;
}

.dialogue {
  margin: 5px 0;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.choices {
  margin-top: 10px;
}

.choice-tag {
  display: inline-block;
  background: #ffd700;
  padding: 4px 10px;
  margin: 2px;
  border-radius: 4px;
  font-size: 13px;
}

.npc-stats {
  margin: 20px 0;
}

.npc-sample {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 10px 0;
}

.npc-face {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.render-data pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
}

.render-preview {
  margin-top: 15px;
  text-align: center;
}
</style>



