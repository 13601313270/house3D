import { ObjInWallData } from '@/types/map2d'

export type OutFileInWallData = ObjInWallData & {
  fileTypeId: string
  bm: number | null // 材质
  color: string,
  isOuter: boolean,// 是否挂在外墙
  canAngelZ: boolean,// 是否可以旋转Z轴角度
}
