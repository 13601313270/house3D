import { Point } from "@/types"

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  panOffset: Point,
  angle: number,
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

  ctx.save()
  ctx.translate(originX, originY)
  ctx.rotate(angle)

  const arrowSize = 8
  const maxAxisLength = Math.max(canvasWidth, canvasHeight) * 2

  ctx.beginPath()
  ctx.moveTo(-maxAxisLength, 0)
  ctx.lineTo(maxAxisLength, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(maxAxisLength, 0)
  ctx.lineTo(maxAxisLength - arrowSize, -arrowSize / 2)
  ctx.lineTo(maxAxisLength - arrowSize, arrowSize / 2)
  ctx.closePath()
  ctx.fill()

  const startX = Math.floor(-maxAxisLength / zoomLevel / scale) * scale
  const endX = Math.ceil(maxAxisLength / zoomLevel / scale) * scale

  for (let x = startX; x <= endX; x += scale) {
    const screenX = x * zoomLevel
    ctx.beginPath()
    ctx.moveTo(screenX, -tickSize)
    ctx.lineTo(screenX, tickSize)
    ctx.stroke()

    const label = x !== 0 ? `${x}px` : ''
    if (label) {
      ctx.save()
      ctx.translate(screenX, tickSize + labelPadding)
      ctx.rotate(-angle)
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, 0, 0)
      ctx.restore()
    }
  }

  ctx.beginPath()
  ctx.moveTo(0, -maxAxisLength)
  ctx.lineTo(0, maxAxisLength)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -maxAxisLength)
  ctx.lineTo(-arrowSize / 2, -maxAxisLength + arrowSize)
  ctx.lineTo(arrowSize / 2, -maxAxisLength + arrowSize)
  ctx.closePath()
  ctx.fill()

  const startY = Math.floor(-maxAxisLength / zoomLevel / scale) * scale
  const endY = Math.ceil(maxAxisLength / zoomLevel / scale) * scale

  for (let y = startY; y <= endY; y += scale) {
    const screenY = y * zoomLevel
    ctx.beginPath()
    ctx.moveTo(-tickSize, screenY)
    ctx.lineTo(tickSize, screenY)
    ctx.stroke()

    const label = y !== 0 ? `${y}px` : ''
    if (label) {
      ctx.save()
      ctx.translate(-labelPadding, screenY)
      ctx.rotate(-angle)
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, 0, 0)
      ctx.restore()
    }
  }

  ctx.restore()

  ctx.save()
  ctx.translate(originX - labelPadding, originY + labelPadding)
  ctx.rotate(angle)
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText('O', 0, 0)
  ctx.restore()
}

export default drawAxes