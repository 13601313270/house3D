import type { BaseElementData, Point } from './index'
import { BaseElement } from './baseElement'
// import { ElementFactory } from './elementFactory'
import { editItem } from '@/entities'

export interface PolylineElementData extends BaseElementData {
  points: Point[]
  width: number
}

export abstract class PolylineElement<T extends PolylineElementData> extends BaseElement<T> {
  abstract texture: string
  abstract color: string

  private texturePattern: CanvasPattern | null = null
  private textureImage: HTMLImageElement | null = null
  private textureLoaded = false

  async init(): Promise<void> {
    await this.loadTexture()
    this.isInitialized = true
  }

  private async loadTexture(): Promise<void> {
    if (!this.texture) return

    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.textureImage = img
        this.textureLoaded = true
        resolve()
      }
      img.onerror = () => {
        this.textureLoaded = false
        resolve()
      }
      img.src = this.texture
    })
  }

  private getTexturePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (!this.textureLoaded || !this.textureImage) return null

    if (!this.texturePattern) {
      this.texturePattern = ctx.createPattern(this.textureImage, 'repeat')
    }
    return this.texturePattern
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { points, width, opacity } = this.data
    if (points.length < 2) return

    ctx.save()
    ctx.globalAlpha = opacity

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }

    ctx.strokeStyle = '#333333'
    ctx.lineWidth = width + 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }

    const texturePattern = this.getTexturePattern(ctx)
    if (texturePattern) {
      ctx.strokeStyle = texturePattern
    } else {
      ctx.strokeStyle = this.color || '#8B4513'
    }
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    if (this.world.selectedElementId === this.data.id) {
      ctx.fillStyle = '#1890ff'
      points.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    ctx.restore()
  }

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { points, width } = this.data
    if (points.length === 0) return

    ctx.save()
    ctx.globalAlpha = 0.6

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.lineTo(mousePos.x, mousePos.y)

    const lineWidth = width || 20

    ctx.strokeStyle = '#333333'
    ctx.lineWidth = lineWidth + 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.lineTo(mousePos.x, mousePos.y)

    const texturePattern = this.getTexturePattern(ctx)
    if (texturePattern) {
      ctx.strokeStyle = texturePattern
    } else {
      ctx.strokeStyle = this.color || '#8B4513'
    }
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.restore()
  }

  handleMouseDown(pos: Point): void {
    this.data.points.push(pos)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseMove(_pos: Point): void { }

  handleMouseUp(pos: Point): boolean {
    if (this.data.points.length < 2) {
      return false
    }
    const lastPoint = this.data.points[this.data.points.length - 1]
    const dist = Math.sqrt(
      Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2)
    )
    return dist < 10
  }

  containsPoint(pos: Point): boolean {
    const { points, width } = this.data
    for (let i = 0; i < points.length - 1; i++) {
      const dist = this.pointToLineDistance(pos, points[i], points[i + 1])
      if (dist < width / 2) {
        return true
      }
    }
    return false
  }

  hitTestPoint(pos: Point): number {
    const { points } = this.data
    const handleRadius = 20
    for (let i = 0; i < points.length; i++) {
      const dist = Math.sqrt(
        Math.pow(pos.x - points[i].x, 2) +
        Math.pow(pos.y - points[i].y, 2)
      )
      if (dist <= handleRadius) {
        return i
      }
    }
    return -1
  }

  movePoint(index: number, newPos: Point): void {
    if (index >= 0 && index < this.data.points.length) {
      this.data.points[index] = { ...newPos }
    }
  }

  private pointToLineDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx: number, yy: number

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  translate(dx: number, dy: number): void {
    this.data.points.forEach((point) => {
      point.x += dx
      point.y += dy
    })
  }

  canFinishDrawing(): boolean {
    return this.data.points.length >= 2
  }

  setEditParams(): Array<editItem> {
    return [
      ...super.setEditParams(),
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 1,
        max: 100,
        step: 1,
        value: this.data.width,
        unit: 'cm'
      }
    ]
  }

  static defaultData(): PolylineElementData {
    return {
      ...BaseElement.defaultData(),
      points: [],
      width: 20,
    }
  }
}

// ElementFactory.register('polyline', (world, data) => new PolylineElement(world, data))