import { EntityType } from "./entity"

export interface Point {
  x: number
  y: number
}

export interface PointWithIndex extends Point {
  index: number
}

export interface HandelInfo {
  id: string // 对象ID
  type: EntityType
  index: number,// 对象内具柄index
  info?: any
  dist: number,
}

export interface ObjData {
  id: string
  x: number
  y: number
  z: number
}

export interface ObjInWallData extends ObjData {
  wallId?: string // 所属墙ID，如果没有磁吸在墙上，为undefined
  wallPointId: number // 门在墙上的点的索引（比如0，代表从0到1的墙面上，-1代表未磁吸在墙上）
  bottom: number // 距离地面
  angle: number
}