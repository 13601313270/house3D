import { HandelInfo, Point } from './map2d'

export type EntityType = 'wall' | 'door' | 'window' | 'bed' | string

export abstract class EntityClass {
  id: string
  x: number
  y: number

  constructor(id: string, x: number, y: number) {
    this.id = id
    this.x = x
    this.y = y
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
  abstract onUpdateHandelInfoChange(matchHandelInfo: HandelInfo, newPosition: { x: number, y: number }): void;

  // 可以被对齐参考点（注意是被对齐，提供个其他拖动磁吸的参考点）
  abstract getBeSnapPoints(): Point[];
}
