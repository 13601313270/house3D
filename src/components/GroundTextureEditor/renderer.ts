import type { Point } from './types'
import { TextureWorld } from './world'

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement
  private mainCtx: CanvasRenderingContext2D
  private gridCanvas: HTMLCanvasElement
  private gridCtx: CanvasRenderingContext2D
  private previewCanvas: HTMLCanvasElement
  private previewCtx: CanvasRenderingContext2D
  public width: number
  public height: number
  private gridSize: number = 50

  constructor(
    mainCanvas: HTMLCanvasElement,
    gridCanvas: HTMLCanvasElement,
    previewCanvas: HTMLCanvasElement,
    width: number,
    height: number
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
  }

  private drawGrid(ctx: CanvasRenderingContext2D, scaledWidth: number, scaledHeight: number): void {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1

    const visibleWidth = scaledWidth * 2
    const visibleHeight = scaledHeight * 2

    const startX = -visibleWidth
    for (let x = startX; x <= visibleWidth; x += this.gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, -visibleHeight)
      ctx.lineTo(x, visibleHeight)
      ctx.stroke()
    }

    const startY = -visibleHeight
    for (let y = startY; y <= visibleHeight; y += this.gridSize) {
      ctx.beginPath()
      ctx.moveTo(-visibleWidth, y)
      ctx.lineTo(visibleWidth, y)
      ctx.stroke()
    }
  }

  private drawAxes(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scaledWidth: number, scaledHeight: number): void {
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(0, -offsetY)
    ctx.lineTo(0, scaledHeight - offsetY)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-offsetX, 0)
    ctx.lineTo(scaledWidth - offsetX, 0)
    ctx.stroke()

    ctx.fillStyle = '#333333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const startX = Math.floor(-offsetX / this.gridSize) * this.gridSize
    for (let x = startX; x <= scaledWidth - offsetX; x += this.gridSize) {
      if (x !== 0) {
        ctx.fillText(x.toString(), x, 5)
      }
    }

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const startY = Math.floor(-offsetY / this.gridSize) * this.gridSize
    for (let y = startY; y <= scaledHeight - offsetY; y += this.gridSize) {
      if (y !== 0) {
        ctx.fillText((-y).toString(), -5, y)
      }
    }
  }

  renderGrid(world: TextureWorld): void {
    this.gridCtx.clearRect(0, 0, this.width, this.height)

    this.gridCtx.save()
    this.gridCtx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.gridCtx.scale(world.scale, world.scale)

    const scaledWidth = this.width / world.scale
    const scaledHeight = this.height / world.scale

    this.drawGrid(this.gridCtx, scaledWidth, scaledHeight)
    this.drawAxes(this.gridCtx, world.canvasOffset.x / world.scale, world.canvasOffset.y / world.scale, scaledWidth, scaledHeight)

    this.gridCtx.restore()
  }

  renderMain(world: TextureWorld): void {
    this.mainCtx.clearRect(0, 0, this.width, this.height)

    this.mainCtx.fillStyle = '#ffffff'
    this.mainCtx.fillRect(0, 0, this.width, this.height)

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
}