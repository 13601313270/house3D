import { PeopleData } from "./index.d"
import { ObjDataClass } from "../objData"

export class PeopleDataClass extends ObjDataClass<PeopleData> {
  angle: number
  height: number

  constructor(data: PeopleData) {
    super(data)
    this.angle = data.angle
    this.height = data.height
  }
}