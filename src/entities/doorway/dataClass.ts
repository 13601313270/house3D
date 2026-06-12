import { DoorData } from "./index.d"
import { ObjInWallDataClass } from "../objData"

export class DoorDataClass extends ObjInWallDataClass<DoorData> {
  width: number
  height: number
  angle: number
  hasBorder: boolean
  color: string
  mt: number

  constructor(data: DoorData) {
    super(data)
    this.wallId = data.wallId
    this.width = data.width
    this.height = data.height
    this.angle = data.angle
    this.hasBorder = data.hasBorder
    this.color = data.color
    this.mt = data.mt
  }
}