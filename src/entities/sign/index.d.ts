import { PointObjData } from '@/types/map2d'

export type SignData = PointObjData & {
  angleY: number // 旋转角度
  width: number // 大小
  height: number // 大小
  signZ: number // 牌子离地高度
  poleRadius: number // 柱子半径
  bgColor: string // 背景颜色
  poleColor: string // 柱子颜色
  img: {
    value: Array<any> // 图片数据（JSON格式）
    viewImg: string // 图片数据（JSON格式）
  }
}
