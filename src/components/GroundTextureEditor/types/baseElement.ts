import { editItem } from '@/entities'
import { TextureWorld } from '../world'
import type { Point } from './index'

export interface BaseElementData {
  id: string
  opacity: number
  zIndex: number
}

export abstract class BaseElement<T extends BaseElementData> {
  abstract type: string
  world: TextureWorld
  data: T
  // eslint-disable-next-line no-useless-constructor
  constructor(world: TextureWorld, data: T) {
    this.world = world
    this.data = data
  }

  abstract draw(ctx: CanvasRenderingContext2D): void

  abstract drawPreview(
    ctx: CanvasRenderingContext2D,
    mousePos: Point
  ): void

  abstract handleMouseDown(pos: Point): void

  abstract handleMouseMove(pos: Point): void

  abstract handleMouseUp(pos: Point): boolean

  abstract containsPoint(pos: Point): boolean

  abstract translate(dx: number, dy: number): void

  canFinishDrawing(): boolean {
    return true
  }

  // 设置配置属性
  setEditParams(): Array<editItem> {
    return [
      {
        id: 'opacity',
        label: '透明度',
        dataType: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        value: this.data.opacity,
      },
      {
        id: 'zIndex',
        label: '图层顺序',
        dataType: 'number',
        min: 0,
        max: 9999,
        step: 1,
        value: this.data.zIndex,
      },
    ]
  }

  static defaultData(): BaseElementData {
    return {
      id: Date.now().toString(),
      opacity: 1,
      zIndex: 0,
    }
  }
}