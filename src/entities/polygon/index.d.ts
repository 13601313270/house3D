import { Point, LineObjData } from '@/types/map2d'

export interface PolygonPoint {
  // snw: boolean,// show next wall，是否这个点对应的下面的线的信息（是否显示下一个墙）
}

export type PolygonData = LineObjData<PolygonPoint> & {
  color: string
  z: number
  height: number
  // cornerType: 0 | 1 | 2 | 3 | 4 | 5 // 角点类型
}
