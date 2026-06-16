import { StaircaseData, StaircasePoint } from "./index.d"
import { LineObjDataClass } from "../objData"

export class StaircaseDataClass extends LineObjDataClass<StaircasePoint, StaircaseData> {
  points: StaircasePoint[]
  thickness: number
  color: string
  wmt: number // 墙材质
  cornerType: 0 | 1 | 2 | 3 | 4 | 5 // 墙角类型
  // hb: boolean // 是否有地板
  // bc: string // 地板颜色
  // bmt: number // 地板材质
  // ht: boolean // 是否有天花板
  // tc: string // 天花板颜色
  // tmt: number // 天花板材质
  // td: boolean // 天花板是否是双面
  // bottom: number // 距离地面距离

  constructor(data: StaircaseData) {
    super(data)
    this.points = data.points
    this.thickness = data.thickness
    this.color = data.color
    this.wmt = data.wmt
    this.cornerType = data.cornerType || 1
    // this.hb = data.hb
    // this.bc = data.bc
    // this.bmt = data.bmt
    // this.ht = data.ht
    // this.tc = data.tc
    // this.tmt = data.tmt
    // this.td = data.td
    // this.bottom = data.bottom
  }
}