function getMatchRectAreaBySector(x: number, y: number, r: number, startAngle: number, endAngle: number): { minX: number, maxX: number, minY: number, maxY: number } {
  startAngle = startAngle % (Math.PI * 2)
  endAngle = endAngle % (Math.PI * 2)
  if (endAngle < startAngle) {
    endAngle += Math.PI * 2;
  }
  console.log('endAngle', endAngle)
  // console.log('startAngle', startAngle, endAngle, endAngle - startAngle)
  // 获取沿着(x,y)角度为startAngle，长度为r的点的坐标
  const pointList = [
    {
      x,
      y,
    },
    {
      x: x + r * Math.cos(startAngle),
      y: y - r * Math.sin(startAngle),
    },
    {
      x: x + r * Math.cos(endAngle),
      y: y - r * Math.sin(endAngle),
    },
  ];
  if (startAngle < Math.PI / -2 * 3 && endAngle > Math.PI / -2 * 3) {
    pointList.push({
      x,
      y: y - r,
    })
  }
  if (startAngle < Math.PI * -1 && endAngle > Math.PI * -1) {
    pointList.push({
      x: x - r,
      y,
    })
  }
  if (startAngle < Math.PI / -2 && endAngle > Math.PI / -2) {
    pointList.push({
      x,
      y: y + r,
    })
  }
  if (startAngle < 0 && endAngle > 0) {
    pointList.push({
      x: x + r,
      y,
    })
  }
  if (startAngle < Math.PI / 2 && endAngle > Math.PI / 2) {
    pointList.push({
      x,
      y: y - r,
    })
  }
  if (startAngle < Math.PI && endAngle > Math.PI) {
    // console.log('startAngle--1', 1)
    pointList.push({
      x: x - r,
      y,
    })
    if (endAngle > Math.PI * 2) {
      pointList.push({
        x: x + r,
        y,
      })
    }
  }
  if (startAngle < Math.PI / 2 * 3 && endAngle > Math.PI / 2 * 3) {
    pointList.push({
      x,
      y: y + r,
    })
  }
  const minX = Math.min(...pointList.map(item => item.x))
  const maxX = Math.max(...pointList.map(item => item.x))
  const minY = Math.min(...pointList.map(item => item.y))
  const maxY = Math.max(...pointList.map(item => item.y))
  return {
    minX,
    maxX,
    minY,
    maxY,
  }
}
export default getMatchRectAreaBySector