import { PointObjData } from '@/types/map2d'

export type TorusData = PointObjData & {
  r: number // 主半径
  t: number // 管道半径
  arc: number // 弧度
  thetaStart: number // 开始角度
  thetaLength: number // 结束角度
  color: string
  mt: number | null // 方块材质
}
