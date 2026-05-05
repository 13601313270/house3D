import { ObjData } from '@/types/map2d'

export type CubeData = ObjData & {
  width: number
  height: number
  depth: number
  color: string
  mt: number // 方块材质
  angleY: number
}
