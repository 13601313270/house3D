import { PointObjData } from '@/types/map2d'

export type SignData = PointObjData & {
  angleY: number // 旋转角度
  img: {
    value: Array<any> // 图片数据（JSON格式）
    viewImg: string // 图片数据（JSON格式）
  }
}
