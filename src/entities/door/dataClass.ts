import { DoorData } from "./index.d"
import { ObjInWallDataClass } from "../objData"

export class DoorDataClass extends ObjInWallDataClass<DoorData> {
  width: number
  height: number
  openAngle: number
  angle: number
  hasBorder: boolean
  color: string
  mt: number
  openType: number

  constructor(data: DoorData) {
    super(data)
    this.wallId = data.wallId
    this.width = data.width
    this.height = data.height
    this.openAngle = data.openAngle
    this.angle = data.angle
    this.hasBorder = data.hasBorder
    this.color = data.color
    this.mt = data.mt
    this.openType = data.openType
  }
}