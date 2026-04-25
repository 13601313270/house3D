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
}

export interface ObjData {
  id: string
  x: number
  y: number
  z: number
}
