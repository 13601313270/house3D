import { Point, ObjData } from '@/types/map2d'

type wallInfo = {
  hidden: boolean
}
export type WallData = ObjData & {
  points: Point[]
  walls: wallInfo[],
  thickness: number
  color: string
  height: number
  wmt: number // 墙材质
  hb: boolean // 是否有地板
  bc: string // 地板颜色
  bmt: number // 地板材质
  ht: boolean // 是否有天花板
  tc: string // 天花板颜色
  tmt: number // 天花板材质
  td: boolean // 天花板是否是双面
}
