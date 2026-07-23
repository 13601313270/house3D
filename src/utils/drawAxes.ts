import { Point } from "@/types"

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  // panOffset: Point,
  angle: number,
  zoomLevel: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const axisXColor = 'rgba(152, 0, 0, 1)'
  const axisYColor = 'rgba(0, 92, 0, 1)'

  const axisLineWidth = 2
  const tickSize = 5
  const labelPadding = 15
  const scale = 100

  const originX = 0; // panOffset.x
  const originY = 0; // panOffset.y
  ctx.lineWidth = axisLineWidth

  ctx.strokeStyle = axisXColor
  ctx.fillStyle = axisXColor
  ctx.font = '12px Arial'

  ctx.save()
  ctx.translate(originX, originY)
  ctx.rotate(angle)
  const maxAxisLength = Math.max(canvasWidth, canvasHeight) * 2

  ctx.strokeStyle = axisXColor
  ctx.fillStyle = axisXColor
  ctx.beginPath()
  ctx.moveTo(-maxAxisLength, 0)
  ctx.lineTo(maxAxisLength, 0)
  ctx.stroke()

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

  ctx.strokeStyle = axisYColor
  ctx.fillStyle = axisYColor

  ctx.beginPath()
  ctx.moveTo(0, -maxAxisLength)
  ctx.lineTo(0, maxAxisLength)
  ctx.stroke()

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