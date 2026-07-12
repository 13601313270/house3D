import { PointGroupData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class PointGroupDataClass extends PointObjDataClass<PointGroupData> {
  angleY: number

  constructor(data: PointGroupData) {
    super(data)
    this.angleY = data.angleY
  }
}