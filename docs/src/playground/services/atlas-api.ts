/**
 * Atlas Academy API Service
 * 用于动态获取 FGO 游戏数据，严禁硬编码
 */

import type { FGOWar, FGOQuest, FGOScript, FGOCharacterData } from '../types'

const BASE_URL = 'https://api.atlasacademy.io'
const REGION = 'JP' // 默认为 JP 服务器

/**
 * 基础 API 请求封装
 */
async function fetchApi<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Fetch API failed:', error)
    throw error
  }
}

/**
 * 获取主线 War (特异点)
 * 通过 flags: ['mainScenario'] 过滤
 */
export async function fetchWars(): Promise<FGOWar[]> {
  // 注意：nice_war.json 很大，实际生产建议在 Build 阶段生成轻量索引
  const rawWars = await fetchApi<any[]>(`/export/${REGION}/nice_war.json`)
  
  return rawWars
    .filter(war => war.flags && war.flags.includes('mainScenario'))
    .map(war => ({
      id: war.id,
      name: war.name,
      longName: war.longName,
      banner: war.banner,
      eventId: war.eventId,
      startType: war.startType,
      status: war.status,
      age: war.age
    }))
    .sort((a, b) => a.id - b.id)
}

/**
 * 获取活动 War
 * 通过 flags: ['event'] 过滤，且排除主线
 * 增加 eventId > 0 判断
 */
export async function fetchEvents(): Promise<FGOWar[]> {
  const rawWars = await fetchApi<any[]>(`/export/${REGION}/nice_war.json`)
  
  return rawWars
    .filter(war => {
      const isMain = war.flags && war.flags.includes('mainScenario')
      // 只要 flags 包含 event 或者 eventId > 0 都算活动
      const isEvent = (war.flags && war.flags.includes('event')) || (war.eventId > 0)
      return isEvent && !isMain
    })
    .map(war => ({
      id: war.id,
      name: war.name,
      longName: war.longName,
      banner: war.banner,
      eventId: war.eventId,
      startType: war.startType,
      status: war.status
    }))
    // 活动通常倒序排列（最新的在前）
    .sort((a, b) => b.id - a.id)
}

/**
 * Quest 类型枚举 (Atlas Academy API)
 */
const QUEST_TYPE = {
  MAIN: 1,
  FREE: 2,
  FRIENDSHIP: 3,  // 幕间物语
  EVENT: 5,
  HERO_BALLAD: 6,
  WAR_BOARD: 7,
}

/**
 * 批量获取任务类型 (用于区分幕间和强化)
 */
async function getQuestTypes(questIds: number[]): Promise<Map<number, string>> {
  const typeMap = new Map<number, string>()
  
  // 批量获取 (每次最多5个以避免过载)
  const chunks: number[][] = []
  for (let i = 0; i < questIds.length; i += 5) {
    chunks.push(questIds.slice(i, i + 5))
  }
  
  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map(id => 
        fetchApi<any>(`/nice/${REGION}/quest/${id}`)
          .then(q => ({ id, type: q.type }))
          .catch(() => ({ id, type: 'unknown' }))
      )
    )
    results.forEach(r => typeMap.set(r.id, r.type))
  }
  
  return typeMap
}

/**
 * 获取所有从者列表 (包含幕间信息)
 */
export async function fetchServants(): Promise<any[]> {
  // basic_servant.json 已包含 face URL
  const basics = await fetchApi<any[]>(`/export/${REGION}/basic_servant.json`)
  
  // 筛选正常从者 (collectionNo > 0 表示是可召唤的从者)
  const normalServants = basics
    .filter(s => s.collectionNo > 0)
    .sort((a, b) => a.collectionNo - b.collectionNo)
    .slice(0, 15) // 取前15个做演示
  
  const detailedServants = await Promise.all(
    normalServants.map(async (basic) => {
      try {
        const detail = await fetchApi<any>(`/nice/${REGION}/servant/${basic.id}`)
        const questIds = detail.relateQuestIds || []
        
        // 获取这些任务的类型来区分幕间和强化
        let interludes: number[] = []
        if (questIds.length > 0) {
          const typeMap = await getQuestTypes(questIds)
          interludes = questIds.filter((id: number) => typeMap.get(id) === 'friendship')
        }

        return {
          id: detail.id,
          collectionNo: detail.collectionNo,
          name: detail.name,
          className: detail.className,
          rarity: detail.rarity,
          face: basic.face,
          interludes,
          relateQuestCount: questIds.length // 所有相关任务数
        }
      } catch (err) {
        console.warn(`Failed to fetch servant ${basic.id}:`, err)
        return {
          id: basic.id,
          collectionNo: basic.collectionNo,
          name: basic.name,
          className: basic.className,
          rarity: basic.rarity,
          face: basic.face,
          interludes: [],
          relateQuestCount: 0
        }
      }
    })
  )
  
  return detailedServants
}

/**
 * 获取特定 War 下的任务列表
 */
export async function fetchQuestsByWar(warId: number): Promise<FGOQuest[]> {
  // 使用 nice/war/{id} 获取详情（包含 spots 和 quests）
  const warData = await fetchApi<any>(`/nice/${REGION}/war/${warId}`)
  
  const quests: FGOQuest[] = []
  
  if (warData && warData.spots) {
    warData.spots.forEach((spot: any) => {
      if (spot.quests) {
        spot.quests.forEach((quest: any) => {
          quests.push({
            id: quest.id,
            name: quest.name,
            type: quest.type, // main, free, etc.
            warId: warData.id,
            chapter: quest.chapterSubId,
            placeName: spot.name,
            phase: quest.phase
          })
        })
      }
    })
  }
  
  return quests.sort((a, b) => a.id - b.id)
}

/**
 * 获取从者关联的幕间物语和强化任务
 */
export async function fetchServantQuests(servantId: number): Promise<FGOQuest[]> {
  const servantData = await fetchApi<any>(`/nice/${REGION}/servant/${servantId}`)
  
  if (!servantData.relateQuests) return []
  
  return servantData.relateQuests.map((quest: any) => ({
    id: quest.questId,
    name: quest.name || `Quest ${quest.questId}`, // API 可能不直接返回 name，需二次查询或优化
    type: quest.type, // interlude, friendship
    warId: quest.warId,
    phase: quest.phase,
    chapter: 0
  }))
}

/**
 * 获取任务的剧本数据
 * 使用 nice/JP/quest/{id} 获取详情，包含 scripts
 */
export async function fetchQuestScript(questId: number): Promise<FGOScript[]> {
  const questData = await fetchApi<any>(`/nice/${REGION}/quest/${questId}`)
  
  const scripts: FGOScript[] = []
  
  // 简单的解析示例：提取 phase 1 的 raw scripts
  // 实际需要复杂的 parser
  if (questData.phases) {
    const phase1 = questData.phases.find((p: any) => p.phase === 1)
    if (phase1 && phase1.scripts) {
      phase1.scripts.forEach((s: any) => {
        scripts.push({
          scriptId: s.scriptId,
          // 这里的 s.script 是原始字符串
          raw: s.script
        })
      })
    }
  }
  
  return scripts
}

/**
 * 构造角色头像/立绘 URL (动态生成，不硬编码)
 */
export function getCharacterImageUrl(charaGraphId: number, type: 'face' | 'figure' = 'figure'): string {
  if (type === 'figure') {
    return `https://static.atlasacademy.io/${REGION}/CharaFigure/${charaGraphId}/${charaGraphId}_merged.png`
  } else {
    // 修正：使用 f_{id}0.png 格式
    return `https://static.atlasacademy.io/${REGION}/Faces/f_${charaGraphId}0.png`
  }
}

/**
 * 构造背景图片 URL
 */
export function getBackgroundImageUrl(bgId: number): string {
  return `https://static.atlasacademy.io/${REGION}/Back/back${bgId}.png`
}

export default {
  fetchWars,
  fetchEvents,
  fetchServants,
  fetchQuestsByWar,
  fetchServantQuests,
  fetchQuestScript,
  getCharacterImageUrl,
  getBackgroundImageUrl
}
