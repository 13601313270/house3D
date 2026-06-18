import type { BaseElementData, Point } from './index'
import { BaseElement } from './baseElement'
import { ElementFactory } from './elementFactory'

export interface PolygonElementData extends BaseElementData {
  points: Point[]
  texture: string
  color: string
  textureScale: number
}

export class PolygonElement extends BaseElement<PolygonElementData> {
  type = 'polygon' as const

  draw(ctx: CanvasRenderingContext2D): void {
    const { points, color, opacity } = this.data
    if (points.length < 3) return

    ctx.save()
    ctx.globalAlpha = opacity

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.closePath()

    ctx.fillStyle = color || '#228B22'
    ctx.fill()
    ctx.strokeStyle = this.darkenColor(color || '#228B22')
    ctx.lineWidth = 2
    ctx.stroke()

    if (this.world.selectedElementId === this.data.id) {
      ctx.fillStyle = '#1890ff'
      points.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    ctx.restore()
  }

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { points, color } = this.data
    if (points.length === 0) return

    ctx.save()
    ctx.globalAlpha = 0.6

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.lineTo(mousePos.x, mousePos.y)
    ctx.closePath()

    ctx.fillStyle = color || '#228B22'
    ctx.fill()
    ctx.strokeStyle = this.darkenColor(color || '#228B22')
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }

  handleMouseDown(pos: Point): void {
    this.data.points.push(pos)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseMove(_pos: Point): void {}

  handleMouseUp(pos: Point): boolean {
    if (this.data.points.length < 3) {
      return false
    }
    const lastPoint = this.data.points[this.data.points.length - 1]
    const dist = Math.sqrt(
      Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2)
    )
    return dist < 10
  }

  containsPoint(pos: Point): boolean {
    return this.isPointInPolygon(pos, this.data.points)
  }

  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y

      if (
        ((yi > point.y) !== (yj > point.y)) &&
        (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi)
      ) {
        inside = !inside
      }
    }
    return inside
  }

  translate(dx: number, dy: number): void {
    this.data.points.forEach((point) => {
      point.x += dx
      point.y += dy
    })
  }

  private darkenColor(color: string): string {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 40)
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 40)
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 40)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  getProperties(): Record<string, any> {
    const parentProps = super.getProperties()
    return {
      ...parentProps,
      textureScale: this.data.textureScale,
    }
  }

  setProperties(props: Record<string, any>): void {
    if (props.opacity !== undefined) {
      this.data.opacity = props.opacity
    }
    if (props.textureScale !== undefined) {
      this.data.textureScale = props.textureScale
    }
  }

  canFinishDrawing(): boolean {
    return this.data.points.length >= 3
  }
}

ElementFactory.register('polygon', (world, data) => new PolygonElement(world, data))