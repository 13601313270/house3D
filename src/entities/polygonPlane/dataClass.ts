import { PolygonPlaneData, PolygonPlanePoint } from "./index.d"
import { LineObjDataClass } from "../objData"
import { Point } from "@/types";

export class PolygonPlaneDataClass extends LineObjDataClass<PolygonPlanePoint, PolygonPlaneData> {
  points: (Point & PolygonPlanePoint)[]
  color: string
  height: number
  cornerType: 0 | 1 | 2 | 3 | 4 | 5 // 角点类型

  constructor(data: PolygonPlaneData) {
    super(data)
    this.points = data.points
    this.height = data.height
    this.color = data.color
    this.cornerType = data.cornerType !== undefined ? data.cornerType : 1
  }
}