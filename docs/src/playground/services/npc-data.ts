/**
 * NPC Data Service - 从 nice_servant.json 提取所有 NPC 数据
 * 
 * NPC 角色（ID >= 98000000）的数据存储在对应从者的 charaScripts 中
 * 例如：98001000（冬木玛修）的脚本数据在 800100（玛修）的 charaScripts 里
 */

const BASE_URL = 'https://api.atlasacademy.io'
const STATIC_URL = 'https://static.atlasacademy.io'

/** NPC 脚本数据结构 */
export interface NPCScript {
  charaGraphId: number
  parentSvtId: number
  parentSvtName: string
  faceX: number
  faceY: number
  offsetX: number
  offsetY: number
  scale: number
  faceSize?: number
  faceSizeRect?: [number, number]
  url?: string
}

/** 缓存的 NPC 数据 */
let npcCache: Map<number, NPCScript> | null = null
let cachePromise: Promise<Map<number, NPCScript>> | null = null

/**
 * 从 nice_servant.json 提取所有 NPC 数据
 * 结果会被缓存
 */
export async function fetchAllNPCs(region: string = 'JP'): Promise<Map<number, NPCScript>> {
  if (npcCache) return npcCache
  if (cachePromise) return cachePromise
  
  cachePromise = (async () => {
    const response = await fetch(`${BASE_URL}/export/${region}/nice_servant.json`)
    if (!response.ok) throw new Error(`Failed to fetch servant data: ${response.status}`)
    
    const servants = await response.json()
    const npcMap = new Map<number, NPCScript>()
    
    for (const svt of servants) {
      const charaScripts = svt.charaScripts || []
      
      for (const cs of charaScripts) {
        const cid = cs.id
        if (cid >= 98000000) {
          npcMap.set(cid, {
            charaGraphId: cid,
            parentSvtId: svt.id,
            parentSvtName: svt.name,
            faceX: cs.faceX ?? 384,
            faceY: cs.faceY ?? 149,
            offsetX: cs.offsetX ?? 0,
            offsetY: cs.offsetY ?? 0,
            scale: cs.scale ?? 1.0,
            faceSize: cs.extendData?.faceSize,
            faceSizeRect: cs.extendData?.faceSizeRect
          })
        }
      }
      
      const storyAssets = svt.extraAssets?.charaFigure?.story || {}
      for (const [storyId, url] of Object.entries(storyAssets)) {
        const sid = parseInt(storyId)
        if (sid >= 98000000 && !npcMap.has(sid)) {
          npcMap.set(sid, {
            charaGraphId: sid,
            parentSvtId: svt.id,
            parentSvtName: svt.name,
            faceX: 384,
            faceY: 149,
            offsetX: 0,
            offsetY: 0,
            scale: 1.0,
            url: url as string
          })
        }
      }
    }
    
    npcCache = npcMap
    console.log(`[NPC Service] 已加载 ${npcMap.size} 个 NPC 数据`)
    return npcMap
  })()
  
  return cachePromise
}

/**
 * 获取单个 NPC 的脚本数据
 */
export async function getNPCScript(charaGraphId: number, region: string = 'JP'): Promise<NPCScript | null> {
  const allNPCs = await fetchAllNPCs(region)
  return allNPCs.get(charaGraphId) || null
}

/**
 * 获取从者的 charaScript
 * 用于普通从者（非 NPC）
 */
export async function getServantCharaScript(svtId: number, charaGraphId: number, region: string = 'JP'): Promise<NPCScript | null> {
  const response = await fetch(`${BASE_URL}/nice/${region}/svt/${svtId}?expand=true`)
  if (!response.ok) return null
  
  const svt = await response.json()
  const cs = svt.charaScripts?.find((c: any) => c.id === charaGraphId)
  
  if (!cs) return null
  
  return {
    charaGraphId,
    parentSvtId: svtId,
    parentSvtName: svt.name,
    faceX: cs.faceX ?? 384,
    faceY: cs.faceY ?? 149,
    offsetX: cs.offsetX ?? 0,
    offsetY: cs.offsetY ?? 0,
    scale: cs.scale ?? 1.0,
    faceSize: cs.extendData?.faceSize,
    faceSizeRect: cs.extendData?.faceSizeRect
  }
}

/**
 * 获取角色立绘 URL
 */
export function getCharaFigureUrl(charaGraphId: number, region: string = 'JP'): string {
  return `${STATIC_URL}/${region}/CharaFigure/${charaGraphId}/${charaGraphId}_merged.png`
}

/**
 * 获取角色头像 URL
 */
export function getCharaFaceUrl(charaGraphId: number, region: string = 'JP'): string {
  return `${STATIC_URL}/${region}/Faces/f_${charaGraphId}0.png`
}

/**
 * 根据脚本中的 charaGraphId 获取完整的角色渲染数据
 */
export async function getCharacterRenderData(charaGraphId: number, region: string = 'JP'): Promise<{
  script: NPCScript
  figureUrl: string
  faceUrl: string
} | null> {
  let script: NPCScript | null = null
  
  if (charaGraphId >= 98000000) {
    script = await getNPCScript(charaGraphId, region)
  } else {
    const svtId = Math.floor(charaGraphId / 10)
    script = await getServantCharaScript(svtId, charaGraphId, region)
  }
  
  if (!script) return null
  
  return {
    script,
    figureUrl: getCharaFigureUrl(charaGraphId, region),
    faceUrl: getCharaFaceUrl(charaGraphId, region)
  }
}

/**
 * 预加载 NPC 数据（在应用启动时调用）
 */
export function preloadNPCData(region: string = 'JP'): void {
  fetchAllNPCs(region).catch(console.error)
}

export default {
  fetchAllNPCs,
  getNPCScript,
  getServantCharaScript,
  getCharaFigureUrl,
  getCharaFaceUrl,
  getCharacterRenderData,
  preloadNPCData
}

