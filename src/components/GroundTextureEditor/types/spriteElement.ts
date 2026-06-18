import type { BaseElementData, Point } from './index'
import { BaseElement } from './baseElement'
import { ElementFactory } from './elementFactory'

export interface SpriteElementData extends BaseElementData {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  texture: string
  name: string
}

export class SpriteElement extends BaseElement<SpriteElementData> {
  type = 'sprite' as const

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height, rotation, texture, opacity } = this.data

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    const iconMap: Record<string, string> = {
      manhole: '🗑️',
      sign: '⚠️',
      lamp: '💡',
      flower: '🌸',
      basketball: '🏀',
    }

    const icon = iconMap[texture] || '📦'

    ctx.font = `${Math.min(width, height) * 0.8}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, 0, 0)

    if (this.world.selectedElementId === this.data.id) {
      ctx.strokeStyle = '#1890ff'
      ctx.lineWidth = 2
      ctx.strokeRect(-width / 2, -height / 2, width, height)

      ctx.fillStyle = '#1890ff'
      const handleSize = 8
      ctx.fillRect(-width / 2 - handleSize / 2, -height / 2 - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(width / 2 - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize)
    }

    ctx.restore()
  }

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { width, height, texture, rotation } = this.data

    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.translate(mousePos.x, mousePos.y)
    ctx.rotate((rotation * Math.PI) / 180)

    const iconMap: Record<string, string> = {
      manhole: '🗑️',
      sign: '⚠️',
      lamp: '💡',
      flower: '🌸',
      basketball: '🏀',
    }

    const icon = iconMap[texture] || '📦'

    ctx.font = `${Math.min(width, height) * 0.8}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, 0, 0)

    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(-width / 2, -height / 2, width, height)
    ctx.setLineDash([])

    ctx.restore()
  }

  handleMouseDown(pos: Point): void {
    this.data.x = pos.x
    this.data.y = pos.y
  }

  handleMouseMove(pos: Point): void {
    this.data.x = pos.x
    this.data.y = pos.y
  }

  handleMouseUp(_pos: Point): boolean {
    return true
  }

  containsPoint(pos: Point): boolean {
    const { x, y, width, height } = this.data
    return (
      pos.x >= x - width / 2 &&
      pos.x <= x + width / 2 &&
      pos.y >= y - height / 2 &&
      pos.y <= y + height / 2
    )
  }

  hitTestResizeHandle(pos: Point): 'tl' | 'br' | null {
    const { x, y, width, height } = this.data
    const handleRadius = 12

    const tlDist = Math.sqrt(Math.pow(pos.x - (x - width / 2), 2) + Math.pow(pos.y - (y - height / 2), 2))
    const brDist = Math.sqrt(Math.pow(pos.x - (x + width / 2), 2) + Math.pow(pos.y - (y + height / 2), 2))

    if (tlDist <= handleRadius) return 'tl'
    if (brDist <= handleRadius) return 'br'
    return null
  }

  translate(dx: number, dy: number): void {
    this.data.x += dx
    this.data.y += dy
  }

  resize(dx: number, dy: number, corner: 'tl' | 'br'): void {
    if (corner === 'tl') {
      this.data.width -= dx
      this.data.height -= dy
      this.data.x += dx / 2
      this.data.y += dy / 2
    } else {
      this.data.width += dx
      this.data.height += dy
      this.data.x += dx / 2
      this.data.y += dy / 2
    }

    this.data.width = Math.max(20, this.data.width)
    this.data.height = Math.max(20, this.data.height)
  }

  getProperties(): Record<string, any> {
    return {
      name: this.data.name,
      opacity: this.data.opacity,
      width: this.data.width,
      height: this.data.height,
      rotation: this.data.rotation,
    }
  }

  setProperties(props: Record<string, any>): void {
    if (props.name !== undefined) this.data.name = props.name
    if (props.opacity !== undefined) this.data.opacity = props.opacity
    if (props.width !== undefined) this.data.width = props.width
    if (props.height !== undefined) this.data.height = props.height
    if (props.rotation !== undefined) this.data.rotation = props.rotation
  }
}

ElementFactory.register('sprite', (world, data) => new SpriteElement(world, data))