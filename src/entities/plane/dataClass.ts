import { PlaneData } from "./index.d"
import { ObjDataClass } from "../objData"

export class ConeDataClass extends ObjDataClass<PlaneData> {
  width: number
  length: number
  color: string
  mt: number | null

  constructor(data: PlaneData) {
    super(data)
    this.width = data.width
    this.length = data.length
    this.color = data.color
    this.mt = data.mt
  }
}