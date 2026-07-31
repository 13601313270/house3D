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
  let scale = 50
  if (zoomLevel > 5) {
    scale = 10;
  }
  else if (zoomLevel > 2) {
    scale = 20;
  }
  else if (zoomLevel < 0.01) {
    scale = 10000;
  }
  else if (zoomLevel < 0.02) {
    scale = 5000;
  }
  else if (zoomLevel < 0.03) {
    scale = 2000;
  }
  else if (zoomLevel < 0.08) {
    scale = 1000;
  }
  else if (zoomLevel < 0.15) {
    scale = 500;
  }
  else if (zoomLevel < 0.35) {
    scale = 200;
  }
  else if (zoomLevel < 0.6) {
    scale = 100;
  }

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
    if (x === 0) {
      continue;
    }

    const label = `${x}cm`
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
    if (y === 0) {
      continue;
    }

    const label = `${y}cm`
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
  ctx.restore()
}

export default drawAxes