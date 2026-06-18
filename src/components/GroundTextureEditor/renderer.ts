import type { Point } from './types'
import { TextureWorld } from './world'

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private gridSize: number = 50

  constructor(
    mainCanvas: HTMLCanvasElement,
    _gridCanvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    this.mainCanvas = mainCanvas
    this.mainCanvas.width = width
    this.mainCanvas.height = height

    const ctx = mainCanvas.getContext('2d')

    if (!ctx) {
      throw new Error('无法获取Canvas上下文')
    }

    this.ctx = ctx
    this.width = width
    this.height = height
  }

  private drawGrid(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scaledWidth: number, scaledHeight: number): void {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1

    const gridOffsetX = offsetX % this.gridSize
    const gridOffsetY = offsetY % this.gridSize

    const visibleWidth = scaledWidth + offsetX * 2
    const visibleHeight = scaledHeight + offsetY * 2

    const startX = gridOffsetX - Math.ceil(offsetX / this.gridSize) * this.gridSize
    for (let x = startX; x <= scaledWidth; x += this.gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, -visibleHeight)
      ctx.lineTo(x, visibleHeight)
      ctx.stroke()
    }

    const startY = gridOffsetY - Math.ceil(offsetY / this.gridSize) * this.gridSize
    for (let y = startY; y <= scaledHeight; y += this.gridSize) {
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

    ctx.fillStyle = '#666666'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('X', scaledWidth - offsetX - 20, 20)
    ctx.save()
    ctx.translate(-offsetX + 20, scaledHeight - offsetY - 20)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Y', 0, 0)
    ctx.restore()
  }

  render(world: TextureWorld, mousePos: Point): void {
    this.ctx.clearRect(0, 0, this.width, this.height)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.width, this.height)

    this.ctx.save()
    this.ctx.translate(world.canvasOffset.x, world.canvasOffset.y)
    this.ctx.scale(world.scale, world.scale)

    const scaledWidth = this.width / world.scale
    const scaledHeight = this.height / world.scale

    this.drawGrid(this.ctx, world.canvasOffset.x / world.scale, world.canvasOffset.y / world.scale, scaledWidth, scaledHeight)
    this.drawAxes(this.ctx, world.canvasOffset.x / world.scale, world.canvasOffset.y / world.scale, scaledWidth, scaledHeight)

    const sortedElements = [...world.elements].sort(
      (a, b) => a.data.zIndex - b.data.zIndex
    )

    sortedElements.forEach((element) => {
      element.draw(this.ctx)
    })

    if (world.isDrawing && world.drawingElement) {
      const worldMousePos = {
        x: (mousePos.x - world.canvasOffset.x) / world.scale,
        y: (mousePos.y - world.canvasOffset.y) / world.scale,
      }
      world.drawingElement.drawPreview(this.ctx, worldMousePos)
    }

    this.ctx.restore()
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.mainCanvas.width = width
    this.mainCanvas.height = height
  }
}