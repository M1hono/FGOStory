<template>
  <div class="test-container">
    <!-- 错误提示 -->
    <div v-if="error" class="error-box">
      ❌ Error: {{ error }}
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-box">
      ⏳ Fetching data from Atlas Academy API...
    </div>

    <div v-else class="content-grid">
      
      <!-- 1. 主线剧情 -->
      <div class="data-card main-story">
        <h2>📖 Main Story (Wars)</h2>
        <div class="status-tag">Source: /nice_war.json [flag: mainScenario]</div>
        <div class="list-container" v-if="mainWars && mainWars.length > 0">
          <div v-for="war in mainWars" :key="war.id" class="list-item">
            <span class="id-badge">#{{ war.id }}</span>
            <div class="item-info">
              <div class="item-name">{{ war.longName || war.name }}</div>
              <div class="item-sub" v-if="war.age">Age: {{ war.age }}</div>
              <img v-if="war.banner" :src="war.banner" class="war-banner" alt="Banner" />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No Main Story Data Found</div>
      </div>

      <!-- 2. 活动剧情 -->
      <div class="data-card event-story">
        <h2>🎉 Event Story</h2>
        <div class="status-tag">Source: /nice_war.json [flag: event]</div>
        <div class="list-container" v-if="eventWars && eventWars.length > 0">
          <div v-for="event in eventWars" :key="event.id" class="list-item">
            <span class="id-badge">#{{ event.id }}</span>
            <div class="item-info">
              <div class="item-name">{{ event.name }}</div>
              <div class="item-sub">ID: {{ event.id }}</div>
              <img v-if="event.banner" :src="event.banner" class="war-banner" alt="Banner" />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No Event Data Found</div>
      </div>

      <!-- 3. 角色与幕间 -->
      <div class="data-card servant-interludes">
        <h2>🛡️ Servant Interludes</h2>
        <div class="status-tag">Source: /nice_servant/{id} [relateQuests]</div>
        <div class="list-container" v-if="servants && servants.length > 0">
          <div v-for="svt in servants" :key="svt.id" class="list-item servant-item">
            <img :src="svt.face" class="servant-face" />
            <div class="item-info">
              <div class="item-name">{{ svt.name }}</div>
              <div class="interlude-count">
                Interludes: 
                <span :class="{ 'has-data': svt.interludes && svt.interludes.length > 0 }">
                  {{ svt.interludes ? svt.interludes.length : 0 }}
                </span>
              </div>
              <div v-if="svt.interludes && svt.interludes.length > 0" class="quest-ids">
                IDs: {{ svt.interludes.join(', ') }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No Servant Data Found</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchWars, fetchEvents, fetchServants } from '../../../services/atlas-api'

// 状态
const mainWars = ref<any[]>([])
const eventWars = ref<any[]>([])
const servants = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// 数据获取
onMounted(async () => {
  try {
    loading.value = true
    
    // 1. 获取主线
    console.log('Fetching Main Wars...')
    const warsData = await fetchWars() || []
    mainWars.value = warsData.slice(0, 20) // 展示前20个
    
    // 2. 获取活动
    console.log('Fetching Events...')
    const eventsData = await fetchEvents() || []
    eventWars.value = eventsData.slice(0, 20) // 展示前20个
    
    // 3. 获取从者及幕间 (仅前5个用于演示)
    console.log('Fetching Servants...')
    const servantsData = await fetchServants() || []
    servants.value = servantsData
    
  } catch (e: any) {
    console.error(e)
    error.value = e.message || 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.test-container {
  padding: 20px;
  background: #0f172a;
  min-height: 500px;
  color: #e2e8f0;
  border-radius: 8px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.data-card {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #334155;
}

h2 {
  margin-top: 0;
  border-bottom: 2px solid #334155;
  padding-bottom: 10px;
  font-size: 1.2rem;
}

.main-story h2 { color: #38bdf8; border-color: #38bdf8; }
.event-story h2 { color: #f472b6; border-color: #f472b6; }
.servant-interludes h2 { color: #fbbf24; border-color: #fbbf24; }

.status-tag {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 12px;
  font-family: monospace;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.list-item {
  background: #0f172a;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.servant-item {
  align-items: flex-start;
}

.id-badge {
  background: #334155;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  color: #94a3b8;
}

.war-banner {
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 8px;
  max-height: 60px;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

.item-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.item-sub {
  font-size: 0.8rem;
  color: #94a3b8;
}

.servant-face {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}

.interlude-count {
  font-size: 0.85rem;
  color: #94a3b8;
}

.has-data {
  color: #fbbf24;
  font-weight: bold;
}

.quest-ids {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
  font-family: monospace;
}

.loading-box, .empty-state {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: #94a3b8;
}

.loading-box {
  color: #38bdf8;
  animation: pulse 1.5s infinite;
}

.error-box {
  background: #ef444420;
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
