import { CubeData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class CubeDataClass extends PointObjDataClass<CubeData> {
  width: number
  height: number
  depth: number
  color: string
  mt: number | null
  angleY: number

  constructor(data: CubeData) {
    super(data)
    this.width = data.width
    this.height = data.height
    this.depth = data.depth
    this.color = data.color
    this.mt = data.mt
    this.angleY = data.angleY
  }
}