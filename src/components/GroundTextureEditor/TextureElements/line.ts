import { BaseElementDefinition, Point } from '../types'
import { PolylineElement, PolylineElementData } from '../types/polylineElement'

// 箭头末端类型
export type ArrowEndType =
  | 'none'
  | 'round'     // 圆头
  | 'square'    // 方块
  | 'line'      // Line arrow
  | 'triangle'  // Triangle arrow
  | 'reversedTriangle' // Reversed triangle
  | 'circle'    // Circle arrow
  | 'diamond'   // Diamond arrow

// 箭头元素数据类型，扩展 PolylineElementData
export interface ArrowElementData extends PolylineElementData {
  startArrow: ArrowEndType
  endArrow: ArrowEndType
  startArrowSize: number
  endArrowSize: number
  color: string
}

class LineClass extends PolylineElement<ArrowElementData> {
  type = 'line'
  texture = '➡️'
  color = '#228B22'

  async init(): Promise<void> {
    return Promise.resolve()
  }

  // 根据末端类型绘制箭头
  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    arrowSize: number,
    type: ArrowEndType
  ): void {
    if (type === 'none') return

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    ctx.beginPath()
    const color = this.data.color || this.color

    switch (type) {
      case 'line':
        // 直线箭头（两条短线）
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-arrowSize * 0.7, -arrowSize * 0.7)
        ctx.moveTo(0, 0)
        ctx.lineTo(-arrowSize * 0.7, arrowSize * 0.7)
        ctx.strokeStyle = color
        ctx.lineWidth = this.data.width
        ctx.lineCap = 'round'
        ctx.stroke()
        break

      case 'triangle':
        // 三角形箭头
        ctx.moveTo(0, 0)
        ctx.lineTo(-arrowSize, -arrowSize / 2)
        ctx.lineTo(-arrowSize, arrowSize / 2)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
        break

      case 'reversedTriangle':
        // 倒三角形箭头（顶点指向反方向，终点在底边中点）
        ctx.moveTo(-arrowSize, 0)
        ctx.lineTo(0, -arrowSize / 2)
        ctx.lineTo(0, arrowSize / 2)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
        break

      case 'circle':
        // 圆形箭头（圆心在终点位置）
        ctx.arc(0, 0, arrowSize * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        break

      case 'diamond':
        // 菱形箭头
        ctx.moveTo(arrowSize * 0.4, 0)
        ctx.lineTo(0, -arrowSize * 0.4)
        ctx.lineTo(-arrowSize * 0.4, 0)
        ctx.lineTo(0, arrowSize * 0.4)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
        break
    }

    ctx.restore()
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { points, width, opacity, startArrow, endArrow, color, startArrowSize, endArrowSize } = this.data
    if (points.length < 2) return

    ctx.save()
    ctx.globalAlpha = opacity

    const arrowSizeStart = width * 3 * startArrowSize
    const arrowSizeEnd = width * 3 * endArrowSize

    function arrowTypeToShortenDistance(arrow: ArrowEndType): number {
      if (arrow === 'none') {
        return 0;
      } else if (arrow === 'round') {
        return 0;
      } else if (arrow === 'square') {
        return 0;
      } else if (arrow === 'circle') {
        return 0;
      } else if (arrow === 'diamond') {
        return 0;
      } else if (arrow === 'line') {
        return 0;
      } else {
        return width * 2;
      }
    }

    const startShorten = arrowTypeToShortenDistance(startArrow) * startArrowSize;
    const endShorten = arrowTypeToShortenDistance(endArrow) * endArrowSize;

    // 计算线段起点（如果有起点箭头）
    const getStartPoint = (): Point => {
      if (startArrow === 'none' || points.length < 2) return points[0]
      const firstPoint = points[0]
      const secondPoint = points[1]
      const angle = Math.atan2(secondPoint.y - firstPoint.y, secondPoint.x - firstPoint.x)
      return {
        x: firstPoint.x + Math.cos(angle) * startShorten,
        y: firstPoint.y + Math.sin(angle) * startShorten
      }
    }

    // 计算线段终点（如果有终点箭头）
    const getEndPoint = (): Point => {
      if (endArrow === 'none' || points.length < 2) return points[points.length - 1]
      const lastPoint = points[points.length - 1]
      const secondLastPoint = points[points.length - 2]
      const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x)
      return {
        x: lastPoint.x - Math.cos(angle) * endShorten,
        y: lastPoint.y - Math.sin(angle) * endShorten
      }
    }

    const lineStartPoint = getStartPoint()
    const lineEndPoint = getEndPoint()

    // // 绘制阴影层线条
    // ctx.beginPath()
    // ctx.moveTo(lineStartPoint.x, lineStartPoint.y)
    // for (let i = 1; i < points.length - 1; i++) {
    //   ctx.lineTo(points[i].x, points[i].y)
    // }
    // ctx.lineTo(lineEndPoint.x, lineEndPoint.y)

    // ctx.strokeStyle = '#333333'
    // ctx.lineWidth = width
    // ctx.lineCap = 'round'
    // ctx.lineJoin = 'round'
    // ctx.stroke()

    function arrayTypeToCap(arrow: ArrowEndType): 'butt' | 'round' | 'square' {
      if (arrow === 'none') return 'butt'
      if (arrow === 'round') return 'round'
      if (arrow === 'square') return 'square'
      return 'butt'
    }

    // 绘制主体层线条
    ctx.beginPath()
    ctx.moveTo(lineStartPoint.x, lineStartPoint.y)
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.lineWidth = width
    const line1CenterPos = {
      x: (lineStartPoint.x + points[1].x) / 2,
      y: (lineStartPoint.y + points[1].y) / 2
    }
    const startCap = arrayTypeToCap(startArrow)
    const endCap = arrayTypeToCap(endArrow)
    ctx.lineCap = startCap
    ctx.lineTo(line1CenterPos.x, line1CenterPos.y)
    ctx.stroke()
    ctx.closePath()
    // 在line1CenterPos绘制一个圆，防止接缝空隙
    if (!['round', 'square'].includes(startCap) && !['round', 'square'].includes(endCap)) {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(line1CenterPos.x, line1CenterPos.y, width / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
    }

    ctx.beginPath()
    ctx.moveTo(line1CenterPos.x, line1CenterPos.y)

    ctx.lineCap = endCap
    for (let i = 1; i < points.length - 1; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.lineTo(lineEndPoint.x, lineEndPoint.y)
    ctx.stroke()

    // 绘制起点箭头
    if (startArrow !== 'none' && points.length >= 2) {
      const firstPoint = points[0]
      const secondPoint = points[1]
      const angle = Math.atan2(secondPoint.y - firstPoint.y, secondPoint.x - firstPoint.x)
      this.drawArrowHead(ctx, firstPoint.x, firstPoint.y, Math.PI - angle * -1, arrowSizeStart,  startArrow)
    }

    // 绘制终点箭头
    if (endArrow !== 'none' && points.length >= 2) {
      const lastPoint = points[points.length - 1]
      const secondLastPoint = points[points.length - 2]
      const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x)
      // console.log('endArrowSize', endArrowSize)
      this.drawArrowHead(ctx, lastPoint.x, lastPoint.y, angle, arrowSizeEnd, endArrow)
    }

    if (this.textureWorld.selectedElementId === this.data.id) {
      const radius = Math.max(width / 5, 2);
      ctx.fillStyle = '#1890ff'
      points.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    ctx.restore()
  }

  drawPreview(ctx: CanvasRenderingContext2D, mousePos: Point): void {
    const { points, width, endArrow, color } = this.data
    if (points.length === 0) return

    ctx.save()
    ctx.globalAlpha = 0.6

    const lineWidth = width || 20
    const arrowSize = lineWidth * 3

    // 如果有终点箭头，计算线段终点位置
    let endPoint = mousePos
    if (endArrow !== 'none') {
      if (points.length >= 1) {
        const lastPoint = points[points.length - 1]
        const angle = Math.atan2(mousePos.y - lastPoint.y, mousePos.x - lastPoint.x)
        const shortenDistance = arrowSize * 0.7 - lineWidth / 4
        endPoint = {
          x: mousePos.x - Math.cos(angle) * shortenDistance,
          y: mousePos.y - Math.sin(angle) * shortenDistance
        }
      }
    }

    // 绘制阴影层线条
    // ctx.beginPath()
    // ctx.moveTo(points[0].x, points[0].y)
    // for (let i = 1; i < points.length; i++) {
    //   ctx.lineTo(points[i].x, points[i].y)
    // }
    // ctx.lineTo(endPoint.x, endPoint.y)

    // ctx.strokeStyle = '#333333'
    // ctx.lineWidth = lineWidth + 4
    // ctx.lineCap = 'round'
    // ctx.lineJoin = 'round'
    // ctx.stroke()

    // 绘制主体层线条
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.lineTo(endPoint.x, endPoint.y)

    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 绘制预览箭头
    if (endArrow !== 'none' && points.length >= 1) {
      const lastPoint = points[points.length - 1]
      const angle = Math.atan2(mousePos.y - lastPoint.y, mousePos.x - lastPoint.x)

      ctx.save()
      ctx.translate(mousePos.x, mousePos.y)
      ctx.rotate(angle)

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-arrowSize, -arrowSize / 2)
      ctx.lineTo(-arrowSize * 0.7, 0)
      ctx.lineTo(-arrowSize, arrowSize / 2)
      ctx.closePath()

      ctx.fillStyle = '#333333'
      ctx.fill()
      ctx.fillStyle = color
      ctx.fill()

      ctx.restore()
    }

    ctx.restore()
  }

  setEditParams(): Array<import('@/entities').editItem> {
    const arrowEnumList: Array<{ id: ArrowEndType, name: string, img: string }> = [
      { id: 'none', name: '无', img: '/lineCap/1.png' },
      { id: 'round', name: '圆头', img: '/lineCap/2.png' },
      { id: 'square', name: '方块', img: '/lineCap/3.png' },
      { id: 'line', name: '直线箭头', img: '/lineCap/4.png' },
      { id: 'triangle', name: '三角形箭头', img: '/lineCap/5.png' },
      { id: 'reversedTriangle', name: '倒三角形箭头', img: '/lineCap/6.png' },
      { id: 'circle', name: '圆形箭头', img: '/lineCap/7.png' },
      { id: 'diamond', name: '菱形箭头', img: '/lineCap/8.png' }
    ]

    return [
      ...super.setEditParams(),
      {
        id: 'startArrow',
        label: '起点箭头',
        dataType: 'enum',
        value: this.data.startArrow,
        enumList: arrowEnumList
      },
      {
        id: 'endArrow',
        label: '终点箭头',
        dataType: 'enum',
        value: this.data.endArrow,
        enumList: arrowEnumList
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: this.data.color
      },
      {
        id: 'startArrowSize',
        label: '起点箭头大小',
        dataType: 'number',
        value: this.data.startArrowSize,
        min: 0,
        max: 3,
        step: 0.1,
      },
      {
        id: 'endArrowSize',
        label: '终点箭头大小',
        dataType: 'number',
        value: this.data.endArrowSize,
        min: 0,
        max: 3,
        step: 0.1,
      },
    ]
  }

  static defaultData(): ArrowElementData {
    return {
      ...PolylineElement.defaultData(),
      width: 8,
      startArrow: 'none',
      endArrow: 'none',
      color: '#000000ff',
      startArrowSize: 1,
      endArrowSize: 1,
    }
  }
}

export const lineDefinition: BaseElementDefinition = {
  id: 'line',
  name: '线',
  icon: '➡️',
  type: 'polyline',
  dataType: 'basic',
  createClass: LineClass
}
