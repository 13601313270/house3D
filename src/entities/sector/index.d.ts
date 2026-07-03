import { PointObjData } from '@/types/map2d'

export type SectorData = PointObjData & {
  r: number
  h: number
  color: string
  mt: number | null // 方块材质
  startAngle: number // 开始角度
  endAngle: number // 结束角度
}
