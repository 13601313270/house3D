import { BaseElementDefinition, Point } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'
import { editItem } from '@/entities'

interface RectElementData extends SpriteElementData {
  hasBorder: boolean,
  borderWidth: number,
  color: string,
  hasFill: boolean,
  bgColor: string,
  borderRadius: number,
}

class RectClass extends SpriteElement<RectElementData> {
  type = 'rect'
  texture = '矩形'
  color = '#FFFF00'
  ratioLocked = false
  defaultWidth = 30
  defaultHeight = 40
  async init(): Promise<void> {
    return Promise.resolve()
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { ratioLocked, defaultWidth, defaultHeight } = this
    const { x, y, rotation, opacity, hasBorder, borderWidth, color, hasFill, bgColor, borderRadius } = this.data

    const width = this.data.width
    let height = this.data.height
    if (ratioLocked) {
      const ratio = defaultWidth / defaultHeight
      height = width / ratio
    }

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    ctx.lineWidth = borderWidth
    const halfWidth = width / 2
    const halfHeight = height / 2
    const radius = Math.min(borderRadius, Math.min(halfWidth, halfHeight))

    // 绘制圆角矩形
    ctx.beginPath()
    ctx.roundRect(-halfWidth, -halfHeight, width, height, radius)

    if (hasFill) {
      ctx.fillStyle = bgColor
      ctx.fill()
    }

    if (hasBorder) {
      ctx.strokeStyle = color
      ctx.stroke()
    }

    if (this.textureWorld.selectedElementId === this.data.id) {
      ctx.strokeStyle = '#1890ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(-halfWidth - 2, -halfHeight - 2, width + 4, height + 4, radius)
      ctx.stroke()

      ctx.fillStyle = '#1890ff'
      const handleSize = 8
      ctx.fillRect(-halfWidth - handleSize / 2, -halfHeight - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(halfWidth - handleSize / 2, halfHeight - handleSize / 2, handleSize, handleSize)
    }

    ctx.restore()
  }

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { ratioLocked, defaultWidth, defaultHeight } = this
    const { rotation, opacity, color, hasBorder, borderWidth, hasFill, bgColor, borderRadius } = this.data

    const width = this.data.width
    let height = this.data.height
    if (ratioLocked) {
      const ratio = defaultWidth / defaultHeight
      height = width / ratio
    }

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(mousePos.x, mousePos.y)
    ctx.rotate((rotation * Math.PI) / 180)

    ctx.lineWidth = borderWidth
    const halfWidth = width / 2
    const halfHeight = height / 2
    const radius = Math.min(borderRadius, Math.min(halfWidth, halfHeight))

    // 绘制圆角矩形
    ctx.beginPath()
    ctx.roundRect(-halfWidth, -halfHeight, width, height, radius)

    if (hasFill) {
      ctx.fillStyle = bgColor
      ctx.fill()
    }

    if (hasBorder) {
      ctx.strokeStyle = color
      ctx.stroke()
    }

    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.roundRect(-halfWidth - 2, -halfHeight - 2, width + 4, height + 4, radius)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.restore()
  }

  setEditParams(): Array<editItem> {
    return [
      {
        id: 'hasBorder',
        label: '是否有边框',
        dataType: 'boolean',
        value: this.data.hasBorder,
      },
      {
        id: 'color',
        label: '线条颜色',
        dataType: 'color',
        value: this.data.color,
      },
      {
        id: 'borderWidth',
        label: '边框宽度',
        dataType: 'number',
        min: 0.5,
        max: 10,
        step: 0.5,
        value: this.data.borderWidth,
      },
      {
        id: 'hasFill',
        label: '是否有填充',
        dataType: 'boolean',
        value: this.data.hasFill,
      },
      {
        id: 'bgColor',
        label: '背景颜色',
        dataType: 'color',
        value: this.data.bgColor,
      },
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 1,
        max: 100,
        step: 1,
        value: this.data.width,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 1,
        max: 100,
        step: 1,
        value: this.data.height,
      },
      {
        id: 'borderRadius',
        label: '圆角半径',
        dataType: 'number',
        min: 0,
        max: 40,
        step: 1,
        value: this.data.borderRadius,
      },
      ...super.setEditParams(),
    ]
  }

  static defaultData(): RectElementData {
    return {
      ...SpriteElement.defaultData(),
      hasBorder: true,
      borderWidth: 1,
      borderRadius: 0,
      color: '#000000',
      hasFill: false,
      bgColor: '#FFFFFF',
    }
  }
}
export const rectDefinition: BaseElementDefinition = {
  id: 'rect',
  name: '矩形',
  icon: '矩形',
  type: 'sprite',
  dataType: 'basic',
  createClass: RectClass
}
