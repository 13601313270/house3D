import { PointGroupData } from "./index.d"
import { PointObjDataClass } from "../objData"
import { BaseEntityClass } from "@/types/baseEntity"
import { BaseObjData } from "@/types/map2d"

export class PointGroupDataClass extends PointObjDataClass<PointGroupData> {
  angleY: number
  groupData: Array<{
    type: string,
    data: BaseObjData,
  }>

  constructor(data: PointGroupData) {
    super(data)
    this.angleY = data.angleY
    this.groupData = data.groupData || []
  }
}