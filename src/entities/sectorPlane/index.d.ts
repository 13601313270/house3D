import { PointObjData } from '@/types/map2d'

export type SectorPlaneData = PointObjData & {
  r: number
  color: string
  mt: number | null // 方块材质
  startAngle: number // 开始角度
  endAngle: number // 结束角度
  ds: boolean // 是否双面可见
  img: string // 图片
}
