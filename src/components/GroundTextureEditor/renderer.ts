import type { Point } from './types'
import { TextureWorld } from './textureWorld'

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
  private limitWidth: number | null = null
  private limitHeight: number | null = null

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
    limitWidth?: number,
    limitHeight?: number
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
    this.limitWidth = limitWidth || null
    this.limitHeight = limitHeight || null
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
    this.gridCtx.fillStyle = '#ffffff'
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

    if (this.limitWidth && this.limitHeight) {
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

  private drawLimitedCanvasMask(world: TextureWorld): void {
    const width = this.limitWidth!
    const height = this.limitHeight!

    this.previewCtx.save()
    this.previewCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.previewCtx.scale(world.scale, world.scale)

    const ctx = this.previewCtx

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(-10000, -10000, 20000, 20000)

    ctx.clearRect(-width / 2, -height / 2, width, height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 3
    ctx.strokeRect(-width / 2, -height / 2, width, height)

    ctx.strokeStyle = 'rgba(0, 136, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([10, 10])
    ctx.strokeRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20)
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
    if (this.limitWidth && this.limitHeight) {
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
    const width = this.limitWidth!
    const height = this.limitHeight!

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')

    if (!tempCtx) {
      return ''
    }

    tempCtx.fillStyle = '#ffffff'
    tempCtx.fillRect(0, 0, width, height)

    tempCtx.save()
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