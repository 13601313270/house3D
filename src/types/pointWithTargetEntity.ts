import * as THREE from 'three'
import { HandelInfo, PointWithTargetObjData } from './map2d'
import { PointEntityClass } from './pointEntity'

export abstract class PointWithTargetEntityClass<T extends PointWithTargetObjData> extends PointEntityClass<T> {
  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)

    const circleRadius = this.getCircleRadius();

    if (dist < circleRadius) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const distToTarget = Math.hypot(x - data.targetPositionX, y - data.targetPositionY)
    if (distToTarget < circleRadius) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: distToTarget,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y } = position
    if (matchHandelInfo.index === 1) {
      this.setData({
        targetPositionX: x,
        targetPositionY: y,
      } as Partial<T>)
    } else {
      this.setData({
        x,
        y,
      } as Partial<T>)
    }
  }
}
