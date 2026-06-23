import type { Point } from './types'
import { TextureWorld } from './textureWorld'

export type CanvasShape = 'rect' | 'circle' | 'diamond' | 'triangle'

export interface LimitConfig {
  width: number
  height: number
  shape: CanvasShape
}

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement
  private mainCtx: CanvasRenderingContext2D
  private gridCanvas: HTMLCanvasElement
  private gridCtx: CanvasRenderingContext2D
  private previewCanvas: HTMLCanvasElement
  private previewCtx: CanvasRenderingContext2D
  public width: number
  public height: number
  private readonly gridIntervals: number[] = [10, 20, 25, 50, 100, 200, 500, 1000, 2000]
  private readonly baseGridSize: number = 50
  private limitConfig: LimitConfig | null = null

  private getGridSize(scale: number): number {
    const targetInterval = this.baseGridSize / scale
    for (const interval of this.gridIntervals) {
      if (interval >= targetInterval) {
        return interval
      }
    }
    return this.gridIntervals[this.gridIntervals.length - 1]
  }

  constructor(
    mainCanvas: HTMLCanvasElement,
    gridCanvas: HTMLCanvasElement,
    previewCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    limitConfig?: LimitConfig | null
  ) {
    this.mainCanvas = mainCanvas
    this.mainCanvas.width = width
    this.mainCanvas.height = height

    this.gridCanvas = gridCanvas
    this.gridCanvas.width = width
    this.gridCanvas.height = height

    this.previewCanvas = previewCanvas
    this.previewCanvas.width = width
    this.previewCanvas.height = height

    const mainCtx = mainCanvas.getContext('2d')
    const gridCtx = gridCanvas.getContext('2d')
    const previewCtx = previewCanvas.getContext('2d')

    if (!mainCtx || !gridCtx || !previewCtx) {
      throw new Error('无法获取Canvas上下文')
    }

    this.mainCtx = mainCtx
    this.gridCtx = gridCtx
    this.previewCtx = previewCtx
    this.width = width
    this.height = height
    this.limitConfig = limitConfig || null
  }

  private drawGrid(ctx: CanvasRenderingContext2D, scaledWidth: number, scaledHeight: number, scale: number, canvasOffsetX: number, canvasOffsetY: number): void {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1 / scale

    const gridSize = this.getGridSize(scale)

    const visibleLeft = -canvasOffsetX / scale - scaledWidth
    const visibleRight = -canvasOffsetX / scale + scaledWidth * 2
    const visibleTop = -canvasOffsetY / scale - scaledHeight
    const visibleBottom = -canvasOffsetY / scale + scaledHeight * 2

    const startX = Math.floor(visibleLeft / gridSize) * gridSize
    const endX = Math.ceil(visibleRight / gridSize) * gridSize
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, visibleTop)
      ctx.lineTo(x, visibleBottom)
      ctx.stroke()
    }

    const startY = Math.floor(visibleTop / gridSize) * gridSize
    const endY = Math.ceil(visibleBottom / gridSize) * gridSize
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(visibleLeft, y)
      ctx.lineTo(visibleRight, y)
      ctx.stroke()
    }
  }

  private drawAxes(ctx: CanvasRenderingContext2D, scaledWidth: number, scaledHeight: number, scale: number, canvasOffsetX: number, canvasOffsetY: number): void {
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 2 / scale

    const gridSize = this.getGridSize(scale)

    const visibleLeft = -canvasOffsetX / scale - scaledWidth
    const visibleRight = -canvasOffsetX / scale + scaledWidth * 2
    const visibleTop = -canvasOffsetY / scale - scaledHeight
    const visibleBottom = -canvasOffsetY / scale + scaledHeight * 2

    const axisLeft = visibleLeft
    const axisRight = visibleRight
    const axisTop = visibleTop
    const axisBottom = visibleBottom

    ctx.beginPath()
    ctx.moveTo(0, axisTop)
    ctx.lineTo(0, axisBottom)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(axisLeft, 0)
    ctx.lineTo(axisRight, 0)
    ctx.stroke()

    ctx.fillStyle = '#333333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const startX = Math.floor(axisLeft / gridSize) * gridSize
    for (let x = startX; x <= axisRight; x += gridSize) {
      if (x !== 0) {
        ctx.font = `${12 / scale}px Arial`
        ctx.fillText(x.toString(), x, 5)
      }
    }

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const startY = Math.floor(axisBottom / gridSize) * gridSize
    for (let y = startY; y >= axisTop; y -= gridSize) {
      if (y !== 0) {
        ctx.font = `${12 / scale}px Arial`
        ctx.fillText((-y).toString(), -5, y)
      }
    }

    ctx.fillStyle = '#666666'
    ctx.font = `bold ${14 / scale}px Arial`
    ctx.textAlign = 'left'
    ctx.fillText('X', axisRight - 20, 20)
    ctx.save()
    ctx.translate(20, axisTop + 20)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Y', 0, 0)
    ctx.restore()
  }

  renderGrid(world: TextureWorld): void {
    this.gridCtx.clearRect(0, 0, this.width, this.height)
    this.gridCtx.fillStyle = world.backgroundColor
    this.gridCtx.fillRect(0, 0, this.width, this.height)

    this.gridCtx.save()
    this.gridCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.gridCtx.scale(world.scale, world.scale)

    const scaledWidth = this.width / world.scale
    const scaledHeight = this.height / world.scale

    this.drawGrid(this.gridCtx, scaledWidth, scaledHeight, world.scale, world.canvasOffset.x, world.canvasOffset.y)
    this.drawAxes(this.gridCtx, scaledWidth, scaledHeight, world.scale, world.canvasOffset.x, world.canvasOffset.y)

    this.gridCtx.restore()
  }

  renderMain(world: TextureWorld): void {
    this.mainCtx.clearRect(0, 0, this.width, this.height)

    // this.mainCtx.fillStyle = '#ffffff'
    // this.mainCtx.fillRect(0, 0, this.width, this.height)

    this.mainCtx.save()
    this.mainCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.mainCtx.scale(world.scale, world.scale)

    const sortedElements = [...world.elements].sort(
      (a, b) => a.data.zIndex - b.data.zIndex
    )

    sortedElements.forEach((element) => {
      element.draw(this.mainCtx)
    })

    this.mainCtx.restore()
  }

  renderPreview(world: TextureWorld, mousePos: Point): void {
    this.previewCtx.clearRect(0, 0, this.width, this.height)

    if (this.limitConfig) {
      this.drawLimitedCanvasMask(world)
    }

    if (world.isDrawing && world.drawingElement) {
      this.previewCtx.save()
      this.previewCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
      this.previewCtx.scale(world.scale, world.scale)

      const worldMousePos = {
        x: (mousePos.x - world.canvasOffset.x) / world.scale,
        y: (mousePos.y - world.canvasOffset.y) / world.scale,
      }
      world.drawingElement.drawPreview(this.previewCtx, worldMousePos)

      this.previewCtx.restore()
    }
  }

  private buildShapePath(ctx: CanvasRenderingContext2D, width: number, height: number, shape: CanvasShape, expand: number = 0): void {
    const w = width + expand
    const h = height + expand
    ctx.beginPath()
    switch (shape) {
      case 'circle':
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
        break
      case 'diamond':
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(w / 2, 0)
        ctx.lineTo(0, h / 2)
        ctx.lineTo(-w / 2, 0)
        ctx.closePath()
        break
      case 'triangle':
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(w / 2, h / 2)
        ctx.lineTo(-w / 2, h / 2)
        ctx.closePath()
        break
      case 'rect':
        ctx.rect(-w / 2, -h / 2, w, h)
        break
    }
  }

  private drawLimitedCanvasMask(world: TextureWorld): void {
    const { width, height, shape } = this.limitConfig!

    this.previewCtx.save()
    this.previewCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.previewCtx.scale(world.scale, world.scale)

    const ctx = this.previewCtx

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(-10000, -10000, 20000, 20000)

    this.buildShapePath(ctx, width, height, shape)
    ctx.clip()
    ctx.clearRect(-width / 2 - 100, -height / 2 - 100, width + 200, height + 200)
    ctx.restore()

    this.previewCtx.save()
    this.previewCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.previewCtx.scale(world.scale, world.scale)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 3
    this.buildShapePath(ctx, width, height, shape)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0, 136, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([10, 10])
    this.buildShapePath(ctx, width, height, shape, 20)
    ctx.stroke()
    ctx.setLineDash([])

    this.previewCtx.restore()
  }

  render(world: TextureWorld, mousePos: Point): void {
    this.renderGrid(world)
    this.renderMain(world)
    this.renderPreview(world, mousePos)
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.mainCanvas.width = width
    this.mainCanvas.height = height
    this.gridCanvas.width = width
    this.gridCanvas.height = height
    this.previewCanvas.width = width
    this.previewCanvas.height = height
  }

  exportFullImage(world: TextureWorld): string {
    world.selectedElementId = null
    if (this.limitConfig) {
      return this.exportLimitedCanvas(world)
    }

    if (world.elements.length === 0) {
      return ''
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    world.elements.forEach((element) => {
      const bounds = element.getBounds()
      minX = Math.min(minX, bounds.minX)
      minY = Math.min(minY, bounds.minY)
      maxX = Math.max(maxX, bounds.maxX)
      maxY = Math.max(maxY, bounds.maxY)
    })

    const padding = 50
    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    if (width <= 0 || height <= 0) {
      return ''
    }

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')

    if (!tempCtx) {
      return ''
    }

    tempCtx.fillStyle = world.backgroundColor
    tempCtx.fillRect(0, 0, width, height)

    tempCtx.save()
    tempCtx.translate(-minX + padding, -minY + padding)

    const sortedElements = [...world.elements].sort(
      (a, b) => a.data.zIndex - b.data.zIndex
    )

    sortedElements.forEach((element) => {
      element.draw(tempCtx)
    })

    tempCtx.restore()

    return tempCanvas.toDataURL('image/png')
  }

  private exportLimitedCanvas(world: TextureWorld): string {
    const { width, height, shape } = this.limitConfig!

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')

    if (!tempCtx) {
      return ''
    }

    tempCtx.fillStyle = world.backgroundColor
    tempCtx.fillRect(0, 0, width, height)

    tempCtx.save()

    // 在画布坐标系中绘制裁剪路径（中心点在 width/2, height/2）
    tempCtx.beginPath()
    switch (shape) {
      case 'circle':
        tempCtx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        break
      case 'diamond':
        tempCtx.moveTo(width / 2, height / 2 - height / 2)
        tempCtx.lineTo(width / 2 + width / 2, height / 2)
        tempCtx.lineTo(width / 2, height / 2 + height / 2)
        tempCtx.lineTo(width / 2 - width / 2, height / 2)
        tempCtx.closePath()
        break
      case 'triangle':
        tempCtx.moveTo(width / 2, height / 2 - height / 2)
        tempCtx.lineTo(width / 2 + width / 2, height / 2 + height / 2)
        tempCtx.lineTo(width / 2 - width / 2, height / 2 + height / 2)
        tempCtx.closePath()
        break
      case 'rect':
        tempCtx.rect(0, 0, width, height)
        break
    }
    tempCtx.clip()

    tempCtx.translate(width / 2, height / 2)

    const sortedElements = [...world.elements].sort(
      (a, b) => a.data.zIndex - b.data.zIndex
    )

    sortedElements.forEach((element) => {
      element.draw(tempCtx)
    })

    tempCtx.restore()

    return tempCanvas.toDataURL('image/png')
  }
}