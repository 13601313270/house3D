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
    this.targetPositionX = data.targetPositionX || 0
    this.targetPositionY = data.targetPositionY || 0
    this.targetPositionZ = data.targetPositionZ || 100
    this.fov = data.fov || 55
    this.aspectW = data.aspectW || 9
    this.aspectH = data.aspectH || 16
  }
}