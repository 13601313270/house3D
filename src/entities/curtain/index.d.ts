import { ObjData } from '@/types/map2d'

export type CurtainData = ObjData & {
  width: number
  height: number
  color: string
  mt: number | null // 方块材质
  angleY: number // 旋转角度
}
