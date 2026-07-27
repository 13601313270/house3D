import * as THREE from 'three'
import { LineObjData, Point } from './map2d'
import { BaseEntityClass } from './baseEntity'

export abstract class LineEntityClass<V, T extends LineObjData<V>> extends BaseEntityClass<T> {
  public markObjectIsDirty() {
    // 这里注意防止死循环
    super.markObjectIsDirty()
  }

  // 当前对象是否需要重新生成3D模型状态
  create3DUnionKey(): string {
    const cacheData = {
      ...this.data,
    }
    return this.type + JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等
  change3DMeshState(): void {
  }

  // 当前对象不在任何一根吸附线的区域
  notInSceneSnapLineArea(): void { }

  beforeRemove() {
    super.beforeRemove()
  }

  inAreaHoverText() {
    return this.name
  }

  // 待添加状态（鼠标新增悬浮的时候的点）
  setPreparePoint(points: (V & Point)[]): string[] {
    this.getData().points = points
    return [
      'ESC 结束绘制',
      'ctrl+z 撤销一点',
    ]
  }

  // 偏移坐标（移动位置的时候，临时使用，完成移动，会叠加到data上人，然后自己重新归0）
  public offset = { x: 0, y: 0 }

  // 把偏移坐标叠加到data上
  public applyOffsetToData() {
    this.data.points.forEach(point => {
      point.x += this.offset.x
      point.y += this.offset.y
    })
    this.offset = { x: 0, y: 0 }
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null {
    return null
  }
}
