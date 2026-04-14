import { Entity, HandelInfo, Point } from './map2d'

export type EntityType = 'wall' | 'door' | 'window'

// 磁吸点
export type MatchSnapPoint = {
  objType: EntityType, // 磁吸点对象类型
  snapFromType: 'point' | 'line' | 'axis' | string, // 磁吸点来源类型
  point: Point,
}

export abstract class EntityClass<T extends Entity> {
  abstract type: EntityType
  data: T

  constructor(data: T) {
    this.data = data
  }
  // abstract draw2D(
  //   ctx: CanvasRenderingContext2D,
  //   panOffset: Point,
  //   canvasWidth: number,
  //   canvasHeight: number,
  //   zoomLevel: number
  // ): void

  abstract draw3D(scene: any): void

  // 命中可拖拽具柄
  abstract matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null;

  // 具柄的新的值
  abstract inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    matchHandelInfo: HandelInfo,
  ): boolean;

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供个其他拖动磁吸的参考点）
  abstract getMineBeSnapPoints(): Array<MatchSnapPoint>;

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  abstract getMineBeSnapLines(): Array<[Point, Point]>;

  // 当前对象吸附到一根线后的后续处理
  abstract afterBeSnapByLine(line: [Point, Point]): void;

  changePosition(newPosition: { x: number, y: number }) {
    this.data.x = newPosition.x
    this.data.y = newPosition.y
  }
}
