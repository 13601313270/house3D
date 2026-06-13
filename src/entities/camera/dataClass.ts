import { CameraData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class CameraDataClass extends PointObjDataClass<CameraData> {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
  constructor(data: CameraData) {
    super(data)
    this.targetPositionX = 0
    this.targetPositionY = 0
    this.targetPositionZ = 100
    this.fov = 55
    this.aspectW = 9
    this.aspectH = 16
  }
}