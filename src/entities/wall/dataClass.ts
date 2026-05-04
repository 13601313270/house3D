import { WallData, WallPoint } from "./index.d"
import { ObjDataClass } from "../objData"

export class WallDataClass extends ObjDataClass<WallData> {
  points: WallPoint[]
  thickness: number
  color: string
  height: number
  wmt: number // 墙材质
  hb: boolean // 是否有地板
  bc: string // 地板颜色
  bmt: number // 地板材质
  ht: boolean // 是否有天花板
  tc: string // 天花板颜色
  tmt: number // 天花板材质
  td: boolean // 天花板是否是双面

  constructor(data: WallData) {
    super(data)
    this.points = data.points
    this.thickness = data.thickness
    this.height = data.height
    this.color = data.color
    this.wmt = data.wmt
    this.hb = data.hb
    this.bc = data.bc
    this.bmt = data.bmt
    this.ht = data.ht
    this.tc = data.tc
    this.tmt = data.tmt
    this.td = data.td
  }
}