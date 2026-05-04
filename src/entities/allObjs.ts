type ObjItem = {
  id: string
  name: string
  url: string
  materialUrl?: string
  scaleX: number
  scaleY: number
  scaleZ: number
  angleY: number
  preImg: string
  preImgScale: number
  materialId: number | null
  materialVec?: [number, number, number]
  drawAngelLength: number
}
export type { ObjItem }