import { CurtainInWallData } from "./index.d"
import { ObjInWallDataClass } from "../objData"

export class CurtainInWallDataClass extends ObjInWallDataClass<CurtainInWallData> {
  img: string
  isOuter: boolean// 是否挂在外墙
  width: number
  height: number

  constructor(data: CurtainInWallData) {
    super(data)
    this.img = data.img
    this.isOuter = data.isOuter
    this.width = data.width
    this.height = data.height
  }
}
