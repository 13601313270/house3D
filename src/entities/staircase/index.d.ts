import { Point, LineObjData } from '@/types/map2d'


export interface StaircasePoint extends Point {
  z: number,// 高度
}

export type StaircaseData = LineObjData<StaircasePoint> & {
  // points: StaircasePoint[]
  thickness: number
  color: string
  wmt: number // 墙材质
  // hb: boolean // 是否有地板
  // bc: string // 地板颜色
  // bmt: number // 地板材质
  // ht: boolean // 是否有天花板
  // tc: string // 天花板颜色
  // tmt: number // 天花板材质
  // bottom: number // 距离地面距离
}
