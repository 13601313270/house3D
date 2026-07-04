import { PolygonData, PolygonPoint } from "./index.d"
import { LineObjDataClass } from "../objData"
import { Point } from "@/types";

export class PolygonDataClass extends LineObjDataClass<PolygonPoint, PolygonData> {
  points: (Point & PolygonPoint)[]
  color: string
  height: number
  // cornerType: 0 | 1 | 2 | 3 | 4 | 5 // 角点类型
  z: number

  constructor(data: PolygonData) {
    super(data)
    this.points = data.points
    this.height = data.height
    this.color = data.color
    // this.cornerType = data.cornerType !== undefined ? data.cornerType : 1
    this.z = data.z
  }
}