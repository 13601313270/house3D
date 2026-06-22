import type { BaseElementData, Point } from './index'
import { BaseElement } from './baseElement'
// import { ElementFactory } from './elementFactory'
import { editItem } from '@/entities'

export interface PolygonElementData extends BaseElementData {
  points: Point[],
  textureScale: number,
}

export abstract class PolygonElement<T extends PolygonElementData> extends BaseElement<T> {
  abstract texture: string
  abstract color: string
  abstract defaultTextureScale: number
  private dragHandleRadius: number = 12

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

  private lastRunScale: number | null = null;
  private getTexturePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (!this.textureLoaded || !this.textureImage) return null

    if (!this.texturePattern || this.lastRunScale !== this.data.textureScale) {
      const scale = this.defaultTextureScale * this.data.textureScale
      console.log('scale', scale)
      const scaledWidth = this.textureImage.width * scale
      const scaledHeight = this.textureImage.height * scale

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = scaledWidth
      tempCanvas.height = scaledHeight
      const tempCtx = tempCanvas.getContext('2d')!

      tempCtx.drawImage(
        this.textureImage,
        0, 0,
        scaledWidth,
        scaledHeight
      )
      this.lastRunScale = this.data.textureScale
      this.texturePattern = ctx.createPattern(tempCanvas, 'repeat')
    }
    return this.texturePattern
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { points, opacity } = this.data
    if (points.length < 3) return

    ctx.save()
    ctx.globalAlpha = opacity

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.closePath()

    const texturePattern = this.getTexturePattern(ctx)
    if (texturePattern) {
      ctx.fillStyle = texturePattern
    } else {
      ctx.fillStyle = this.color || '#228B22'
    }
    ctx.fill()

    if (this.world.selectedElementId === this.data.id) {
      ctx.fillStyle = '#1890ff'
      points.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
        ctx.fill()
      })

      this.drawDragHandle(ctx)
    }

    ctx.restore()
  }

  public getCenter(): Point {
    const { points } = this.data
    if (points.length === 0) return { x: 0, y: 0 }

    let centerX = 0
    let centerY = 0
    points.forEach(point => {
      centerX += point.x
      centerY += point.y
    })
    return {
      x: centerX / points.length,
      y: centerY / points.length
    }
  }

  private drawDragHandle(ctx: CanvasRenderingContext2D): void {
    const center = this.getCenter()

    ctx.save()

    ctx.beginPath()
    ctx.arc(center.x, center.y, this.dragHandleRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#1890ff'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⇄', center.x, center.y)

    ctx.restore()
  }

  hitTestDragHandle(pos: Point): boolean {
    if (this.world.selectedElementId !== this.data.id) return false

    const center = this.getCenter()
    const dist = Math.sqrt(
      Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2)
    )
    return dist <= this.dragHandleRadius
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

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { points } = this.data
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

    const texturePattern = this.getTexturePattern(ctx)
    if (texturePattern) {
      ctx.fillStyle = texturePattern
    } else {
      ctx.fillStyle = this.color || '#228B22'
    }
    ctx.fill()

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }

  handleMouseDown(pos: Point): void {
    this.data.points.push(pos)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseMove(_pos: Point): void { }

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

  getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const { points } = this.data
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    points.forEach((point) => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    })
    return {
      minX,
      minY,
      maxX,
      maxY,
    }
  }

  canFinishDrawing(): boolean {
    return this.data.points.length >= 3
  }

  setEditParams(): Array<editItem> {
    return [
      ...super.setEditParams(),
      {
        id: 'textureScale',
        label: '纹理缩放',
        dataType: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
        value: this.data.textureScale,
      }
    ]
  }

  static defaultData(): PolygonElementData {
    return {
      ...super.defaultData(),
      textureScale: 1,
      points: [],
    }
  }
}

// ElementFactory.register('polygon', (world, data) => new PolygonElement(world, data))