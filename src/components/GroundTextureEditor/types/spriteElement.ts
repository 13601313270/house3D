import type { BaseElementData, Point } from './index'
import { BaseElement } from './baseElement'

export interface SpriteElementData extends BaseElementData {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  texture: string
  name: string
}

export class SpriteElement extends BaseElement {
  type = 'sprite' as const
  data: SpriteElementData

  constructor(world: any, data: SpriteElementData) {
    super(world)
    this.data = data
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height, rotation, opacity, texture } = this.data
    
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y)
    ctx.rotate(rotation)
    
    const sprite = this.world.spriteLibrary.find((s: any) => s.id === texture)
    if (sprite) {
      ctx.fillStyle = sprite.color
      ctx.beginPath()
      ctx.roundRect(-width / 2, -height / 2, width, height, 4)
      ctx.fill()
      
      ctx.fillStyle = '#fff'
      ctx.font = `${Math.min(width, height) * 0.5}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite.icon, 0, 0)
    }
    
    if (this.world.selectedElementId === this.data.id) {
      ctx.strokeStyle = '#1890ff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.fillStyle = '#1890ff'
      ctx.beginPath()
      ctx.arc(-width / 2, -height / 2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { width, height, opacity, texture } = this.data
    
    ctx.save()
    ctx.globalAlpha = opacity * 0.7
    ctx.translate(mousePos.x, mousePos.y)
    
    const sprite = this.world.spriteLibrary.find((s: any) => s.id === texture)
    if (sprite) {
      ctx.fillStyle = sprite.color
      ctx.beginPath()
      ctx.roundRect(-width / 2, -height / 2, width, height, 4)
      ctx.fill()
      
      ctx.fillStyle = '#fff'
      ctx.font = `${Math.min(width, height) * 0.5}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite.icon, 0, 0)
    }
    
    ctx.restore()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseDown(_pos: Point): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseMove(_pos: Point): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseUp(_pos: Point): boolean {
    return false
  }

  containsPoint(pos: Point): boolean {
    const { x, y, width, height } = this.data
    return (
      Math.abs(pos.x - x) < width / 2 &&
      Math.abs(pos.y - y) < height / 2
    )
  }

  hitTestResizeHandle(pos: Point): 'tl' | 'br' | null {
    const { x, y, width, height, rotation } = this.data
    const handleRadius = 12
    
    let tlX = x - width / 2
    let tlY = y - height / 2
    let brX = x + width / 2
    let brY = y + height / 2
    
    if (rotation !== 0) {
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)
      
      const tlRelX = -width / 2
      const tlRelY = -height / 2
      tlX = x + tlRelX * cos - tlRelY * sin
      tlY = y + tlRelX * sin + tlRelY * cos
      
      const brRelX = width / 2
      const brRelY = height / 2
      brX = x + brRelX * cos - brRelY * sin
      brY = y + brRelX * sin + brRelY * cos
    }
    
    const tlDistance = Math.sqrt(
      Math.pow(pos.x - tlX, 2) + 
      Math.pow(pos.y - tlY, 2)
    )
    if (tlDistance <= handleRadius) {
      return 'tl'
    }
    
    const brDistance = Math.sqrt(
      Math.pow(pos.x - brX, 2) + 
      Math.pow(pos.y - brY, 2)
    )
    if (brDistance <= handleRadius) {
      return 'br'
    }
    
    return null
  }

  translate(dx: number, dy: number): void {
    this.data.x += dx
    this.data.y += dy
  }

  getProperties(): Record<string, any> {
    return {
      opacity: this.data.opacity,
      width: this.data.width,
      height: this.data.height,
      rotation: this.data.rotation,
    }
  }

  setProperties(props: Record<string, any>): void {
    if (props.opacity !== undefined) this.data.opacity = props.opacity
    if (props.width !== undefined) this.data.width = props.width
    if (props.height !== undefined) this.data.height = props.height
    if (props.rotation !== undefined) this.data.rotation = props.rotation
  }
}

import { ElementFactory } from './elementFactory'
ElementFactory.register('sprite', (world, data) => new SpriteElement(world, data))