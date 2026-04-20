import * as THREE from 'three'
import { Entity, HandelInfo, Point, PointWithIndex } from './map2d'

export type EntityType = 'wall' | 'door' | 'window' | 'camera'
export type allSnapFromType = 'point' | 'line' | 'axis'
// 磁吸点
export type OrigionSnapPoint = {
  objType: EntityType, // 磁吸点对象类型
  snapFromType: 'point', // 磁吸点来源类型
  objId: string, // 磁吸点对象ID
  point: PointWithIndex,
}
// 磁吸点(扩展)，通过其他计算延伸出来的磁吸，比如贴边，贴发现
export type MatchSnapPoint = OrigionSnapPoint | {
  objType: EntityType, // 磁吸点对象类型
  objId: string, // 磁吸点对象ID
  snapFromType: 'line' | 'axis' | string, // 磁吸点来源类型
  point: Point,
}

export abstract class EntityClass<T extends Entity> {
  abstract type: EntityType
  abstract isPointObj: boolean // 点状对象，如窗户/门。非点状的如墙
  data: T
  meshList: THREE.Mesh[] = []

  constructor(data: T) {
    this.data = data
  }

  abstract create3DMesh(scene: THREE.Scene, ...args: any[]): THREE.Mesh[]

  draw3DAndCache(scene: THREE.Scene, ...args: any[]) {
    const meshList = this.create3DMesh(scene, ...args)
    this.meshList = meshList
    return meshList
  }

  // 命中可拖拽具柄
  abstract matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null;

  // 命中可拖拽具柄被移动移动
  abstract matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo): void;

  // 具柄的新的值
  abstract inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo,
  ): boolean;

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供个其他拖动磁吸的参考点）
  abstract getMineBeSnapPoints(): Array<OrigionSnapPoint>;

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  abstract getMineBeSnapLines(): Array<[Point, Point]>;

  // 当前对象吸附到一根线后的后续处理
  abstract afterBeSnapByLine(
    obj: EntityClass<Entity>,
    line: [Point, Point]
  ): void;

  changePosition(newPosition: { x: number, y: number }) {
    this.data.x = newPosition.x
    this.data.y = newPosition.y
  }
}
