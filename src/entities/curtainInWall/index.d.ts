import { ObjInWallData } from '@/types/map2d'

export type CurtainInWallData = ObjInWallData & {
  width: number
  height: number
  img: string
  isOuter: boolean,// 是否挂在外墙
}
