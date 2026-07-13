import type { BaseElementData, Point } from './index'
import { BaseElement } from './baseElement'
import { editItem } from '@/utils/editItem'
import { loadImage, getCachedImage } from '@/utils/imageCache'

export interface SpriteElementData extends BaseElementData {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export abstract class SpriteElement<T extends SpriteElementData> extends BaseElement<T> {
  abstract texture: string
  abstract ratioLocked: boolean
  abstract defaultWidth: number
  abstract defaultHeight: number

  async init(): Promise<void> {
    await loadImage(this.texture)
    this.isInitialized = true
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { texture, ratioLocked, defaultWidth, defaultHeight } = this
    const { x, y, rotation, opacity } = this.data

    // 如果比例锁定，按照 defaultWidth/defaultHeight 的比例计算实际高度
    const width = this.data.width
    let height = this.data.height
    if (ratioLocked) {
      const ratio = defaultWidth / defaultHeight
      height = width / ratio
    }

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y)
    ctx.rotate(rotation)

    const cachedImg = getCachedImage(texture)
    if (cachedImg && cachedImg.complete) {
      ctx.drawImage(cachedImg, -width / 2, -height / 2, width, height)
    } else {
      ctx.fillStyle = '#cccccc'
      ctx.fillRect(-width / 2, -height / 2, width, height)
      ctx.fillStyle = '#666666'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('图', 0, 0)
    }

    if (this.textureWorld.selectedElementId === this.data.id) {
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
    const { texture, ratioLocked, defaultWidth, defaultHeight } = this
    const { rotation } = this.data

    // 如果比例锁定，按照 defaultWidth/defaultHeight 的比例计算实际高度
    const width = this.data.width
    let height = this.data.height
    if (ratioLocked) {
      const ratio = defaultWidth / defaultHeight
      height = width / ratio
    }

    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.translate(mousePos.x, mousePos.y)
    ctx.rotate(rotation)

    const cachedImg = getCachedImage(texture)
    if (cachedImg && cachedImg.complete) {
      ctx.drawImage(cachedImg, -width / 2, -height / 2, width, height)
    } else {
      ctx.fillStyle = '#cccccc'
      ctx.fillRect(-width / 2, -height / 2, width, height)
      ctx.fillStyle = '#666666'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('图', 0, 0)
    }

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

  getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const { x, y, width, height } = this.data
    return {
      minX: x - width / 2,
      minY: y - height / 2,
      maxX: x + width / 2,
      maxY: y + height / 2,
    }
  }

  resize(dx: number, dy: number, corner: 'tl' | 'br'): void {
    if (this.ratioLocked) {
      // 比例锁定模式：按照 defaultWidth/defaultHeight 的比例缩放
      const ratio = this.defaultWidth / this.defaultHeight
      const delta = corner === 'tl' ? -dx : dx
      const newWidth = Math.max(20, this.data.width + delta)
      const newHeight = newWidth / ratio

      const dw = newWidth - this.data.width
      const dh = newHeight - this.data.height

      this.data.width = newWidth
      this.data.height = newHeight
      this.data.x += dw / 2
      this.data.y += dh / 2
    } else {
      // 自由缩放模式
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
  }

  setEditParams(): Array<editItem> {
    return [
      ...super.setEditParams(),
      {
        id: 'rotation',
        label: '旋转角度',
        dataType: 'number',
        min: 0,
        max: 360,
        step: 1,
        value: this.data.rotation,
      },
    ]
  }

  static defaultData(): SpriteElementData {
    return {
      ...BaseElement.defaultData(),
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      rotation: 0,
    }
  }
}

// ElementFactory.register('sprite', (world, data) => new SpriteElement(world, data))