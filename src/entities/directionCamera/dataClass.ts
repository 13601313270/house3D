import { DirectionCameraData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class DirectionCameraDataClass extends PointObjDataClass<DirectionCameraData> {
  angleY: number
  fov: number
  aspectW: number
  aspectH: number
  constructor(data: DirectionCameraData) {
    super(data)
    this.angleY = data.angleY
    this.fov = data.fov
    this.aspectW = data.aspectW
    this.aspectH = data.aspectH
  }
}