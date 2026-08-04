import { PointObjData, PointCanAngleObjData } from '@/types/map2d'
import type { CanvasShape } from '@/components/GroundTextureEditor/renderer'

export type SignData = PointCanAngleObjData & {
  width: number // 大小
  height: number // 大小
  signZ: number // 牌子离地高度
  poleRadius: number // 柱子半径
  bgColor: string // 背景颜色
  poleColor: string // 柱子颜色
  shape: CanvasShape // 形状
  img: {
    value: Array<any> // 图片数据（JSON格式）
    backgroundColor: string // 背景颜色
    viewImg: string // 图片数据（JSON格式）
  }
}
