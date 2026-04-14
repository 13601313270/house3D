import { EntityType } from "./entity"

export interface Point {
  x: number
  y: number
}

export interface HandelInfo {
  id: string // 对象ID
  type: EntityType
  info?: any
}

export interface Entity {
  id: string
  x: number
  y: number
}
