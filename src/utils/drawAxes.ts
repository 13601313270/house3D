import { Point } from "@/types"

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  panOffset: Point,
  zoomLevel: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const axisColor = '#333'
  const axisLineWidth = 2
  const tickSize = 5
  const labelPadding = 15
  const scale = 100

  const originX = panOffset.x
  const originY = panOffset.y

  ctx.strokeStyle = axisColor
  ctx.lineWidth = axisLineWidth
  ctx.fillStyle = axisColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 绘制x轴
  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(canvasWidth, originY)
  ctx.stroke()

  // 绘制x轴箭头
  const arrowSize = 8
  ctx.beginPath()
  ctx.moveTo(canvasWidth, originY)
  ctx.lineTo(canvasWidth - arrowSize, originY - arrowSize / 2)
  ctx.lineTo(canvasWidth - arrowSize, originY + arrowSize / 2)
  ctx.closePath()
  ctx.fill()

  // x轴刻度和标签
  const startX = Math.floor((0 - panOffset.x) / scale) * scale
  const endX = Math.ceil((canvasWidth - panOffset.x) / scale) * scale

  for (let x = startX; x <= endX; x += scale) {
    const screenX = x * zoomLevel + panOffset.x
    if (screenX >= 0 && screenX <= canvasWidth) {
      ctx.beginPath()
      ctx.moveTo(screenX, originY - tickSize)
      ctx.lineTo(screenX, originY + tickSize)
      ctx.stroke()

      const label = x !== 0 ? `${x}px` : 'O'
      ctx.fillStyle = axisColor
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, screenX, originY + labelPadding)
    }
  }

  // 绘制y轴
  ctx.strokeStyle = axisColor
  ctx.lineWidth = axisLineWidth
  ctx.fillStyle = axisColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, canvasHeight)
  ctx.stroke()

  // 绘制y轴箭头
  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX - arrowSize / 2, arrowSize)
  ctx.lineTo(originX + arrowSize / 2, arrowSize)
  ctx.closePath()
  ctx.fill()

  // y轴刻度和标签
  const startY = Math.floor((0 - panOffset.y) / scale) * scale
  const endY = Math.ceil((canvasHeight - panOffset.y) / scale) * scale

  for (let y = startY; y <= endY; y += scale) {
    const screenY = y * zoomLevel + panOffset.y
    if (screenY >= 0 && screenY <= canvasHeight) {
      ctx.beginPath()
      ctx.moveTo(originX - tickSize, screenY)
      ctx.lineTo(originX + tickSize, screenY)
      ctx.stroke()

      const label = y !== 0 ? `${y}px` : 'O'
      ctx.fillStyle = axisColor
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, originX - labelPadding, screenY)
    }
  }

  // 绘制原点标签
  ctx.fillStyle = axisColor
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText('O', originX - labelPadding, originY + labelPadding)
}

export default drawAxes