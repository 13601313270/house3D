import { BaseElementDefinition, Point } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'
import { editItem } from '@/entities'

interface TextElementData extends SpriteElementData {
  text: string
}

class TextClass extends SpriteElement<TextElementData> {
  type = 'text'
  texture = '文'
  color = '#FFFF00'
  ratioLocked = false
  defaultWidth = 30
  defaultHeight = 40
  async init(): Promise<void> {
    return Promise.resolve()
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { ratioLocked, defaultWidth, defaultHeight } = this
    const { x, y, rotation, opacity, text } = this.data

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

    ctx.fillStyle = '#333333'
    ctx.font = `${Math.min(width, height) * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)

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
    const { ratioLocked, defaultWidth, defaultHeight } = this
    const { rotation, text } = this.data

    const width = this.data.width
    let height = this.data.height
    if (ratioLocked) {
      const ratio = defaultWidth / defaultHeight
      height = width / ratio
    }

    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.translate(mousePos.x, mousePos.y)
    ctx.rotate((rotation * Math.PI) / 180)

    ctx.fillStyle = '#333333'
    ctx.font = `${Math.min(width, height) * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)

    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(-width / 2, -height / 2, width, height)
    ctx.setLineDash([])

    ctx.restore()
  }

  setEditParams(): Array<editItem> {
    return [
      {
        id: 'text',
        label: '文字',
        dataType: 'string',
        value: this.data.text,
      },
      ...super.setEditParams(),
    ]
  }
}
export const textDefinition: BaseElementDefinition = {
  id: 'text',
  name: '文字',
  icon: '文',
  type: 'sprite',
  dataType: 'text',
  createClass: TextClass
}
