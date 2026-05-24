import { ObjData } from '@/types/map2d'

export type OutFileData = ObjData & {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string
  canAngelZ: boolean,// 是否可以旋转Z轴角度
}
