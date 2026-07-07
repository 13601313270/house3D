import { MatchSnapPoint } from "@/types/baseEntity"
import { Point, PointWithIndex } from "@/types/map2d"
import { roundNumberList } from '@/utils/geometry'

function getSnapPoint1(
  current: Point,
  allPoints: Array<MatchSnapPoint> = [], // 点磁吸和轴磁吸
) {
  // 一、计算三组磁吸数据
  // 计算点磁吸数据
  let pointSnapped: MatchSnapPoint | null = null
  let pointDistance = Infinity
  for (const point of allPoints) {
    const dist = Math.hypot(current.x - point.point.x, current.y - point.point.y)
    if (dist < 10) {
      if (dist < pointDistance) {
        pointDistance = dist
        pointSnapped = {
          objType: point.objType,
          snapFromType: point.snapFromType,
          point: point.point
        }
      }
    }
  }
  // 二、按照优先级依次尝试命中
  // 1. 最高优先级：点磁吸
  if (pointSnapped) {
    return {
      objType: pointSnapped.objType,
      snapFromType: pointSnapped.snapFromType,
      point: {
        ...roundNumberList(pointSnapped.point),
        index: (pointSnapped.point as PointWithIndex).index,
      } as PointWithIndex
    };
  }
}

function getSnapPointAndLine(
  current: Point,
  anglePoints: Array<MatchSnapPoint>, // 这里的点会计算角度磁吸
  snapAngles: Array<number>,// 角度磁吸角度
  allPoints: Array<MatchSnapPoint>, // 点磁吸和轴磁吸
): (MatchSnapPoint & {
  xAxisSnappedY: number | null
  yAxisSnappedX: number | null
}) | null {
  // 精确计算点磁吸数据
  const pointSnapped = getSnapPoint1(current, allPoints)
  if (pointSnapped) {
    console.log('match point', 1)
    return {
      ...pointSnapped,
      xAxisSnappedY: null,// pointSnapped.point.y,
      yAxisSnappedX: null,// pointSnapped.point.x,
    }
  }

  // allPoints 里命中轴磁吸，计算轴对齐磁吸数据
  let xAxisSnappedYVal: {
    objType: string,
    number: number,
    point: Point,
  } | null = null // 命中的y坐标值（水平对齐，即y值与某个点一致）
  let yAxisSnappedXVal: {
    objType: string,
    number: number
    point: Point,
  } | null = null // 命中的x坐标值（垂直对齐，即x值与某个点一致）
  let xAxisDistance = Infinity // 命中x轴对齐的最小距离
  let yAxisDistance = Infinity // 命中y轴对齐的最小距离
  for (const point of allPoints) {
    const distToXAxis = Math.abs(current.y - point.point.y)
    if (distToXAxis < 10 && distToXAxis < xAxisDistance) {
      xAxisDistance = distToXAxis
      xAxisSnappedYVal = {
        objType: point.objType,
        number: point.point.y,
        point: point.point,
      }
    }

    const distToYAxis = Math.abs(current.x - point.point.x)
    if (distToYAxis < 10 && distToYAxis < yAxisDistance) {
      yAxisDistance = distToYAxis
      yAxisSnappedXVal = {
        objType: point.objType,
        number: point.point.x,
        point: point.point,
      }
    }
  }

  // 找到距离 current 最近的 anglePoints 里的点
  const nearestAnglePoint = (() => {
    let nearestPoint: MatchSnapPoint | null = null
    let minDistance = Infinity
    for (const start of anglePoints) {
      const dist = Math.hypot(current.x - start.point.x, current.y - start.point.y)
      if (dist < minDistance) {
        minDistance = dist
        nearestPoint = start
      }
    }
    return nearestPoint;
  })();

  let snappedX = current.x
  let snappedY = current.y

  if (anglePoints.length && nearestAnglePoint) {
    const dx = current.x - nearestAnglePoint.point.x
    const dy = current.y - nearestAnglePoint.point.y
    let nearestSnapAngle = 0 // 最近的角度(startPoints里比对)
    let minAngleDiff = 180

    for (const snapAngle of snapAngles) {
      const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI
      let diff = Math.abs(angleDeg - snapAngle)
      if (diff > 180) {
        diff = 360 - diff
      }

      if (diff < minAngleDiff) {
        minAngleDiff = diff
        nearestSnapAngle = snapAngle
      }
    }
    // 1. 计算角度磁吸数据
    let matchSnappedAngle: {
      objType: string,
      point: Point,
      origin: Point,
    } | null = null
    if (minAngleDiff < 10) {
      const length = Math.hypot(dx, dy)
      const snapAngleRad = nearestSnapAngle * Math.PI / 180
      const snappedXTemp = nearestAnglePoint.point.x + length * Math.cos(snapAngleRad)
      const snappedYTemp = nearestAnglePoint.point.y + length * Math.sin(snapAngleRad)
      const distToMouse = Math.hypot(snappedXTemp - current.x, snappedYTemp - current.y)
      if (distToMouse < 10) {
        matchSnappedAngle = {
          objType: nearestAnglePoint.objType,
          point: {
            x: snappedXTemp,
            y: snappedYTemp
          },
          origin: nearestAnglePoint.point,
        }
      }
    }
    if (
      matchSnappedAngle && (
        (
          xAxisSnappedYVal && matchSnappedAngle.origin !== xAxisSnappedYVal.point
        )
        ||
        (
          yAxisSnappedXVal && matchSnappedAngle.origin !== yAxisSnappedXVal.point
        )
      )
    ) { // 即命中角度磁吸，又命中点的xy轴
      const angleRad = nearestSnapAngle * Math.PI / 180
      const k = Math.tan(angleRad)
      const b = matchSnappedAngle.point.y - k * matchSnappedAngle.point.x

      if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
        // 同时命中x和y轴，计算角度线与两条轴对齐线的交点，选择更近的
        // 交点1：角度线与 x = yAxisSnappedXVal 的交点
        const intersect1Y = k * yAxisSnappedXVal.number + b
        const dist1 = Math.hypot(yAxisSnappedXVal.number - current.x, intersect1Y - current.y)

        // 交点2：角度线与 y = xAxisSnappedYVal 的交点
        let intersect2X: number
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          intersect2X = matchSnappedAngle.point.x
        } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
          intersect2X = xAxisSnappedYVal.number
        } else {
          intersect2X = (xAxisSnappedYVal.number - b) / k
        }
        const dist2 = Math.hypot(intersect2X - current.x, xAxisSnappedYVal.number - current.y)

        if (dist1 <= dist2) {
          snappedX = yAxisSnappedXVal.number
          snappedY = intersect1Y
        } else {
          snappedX = intersect2X
          snappedY = xAxisSnappedYVal.number
        }
        console.log('match point', 2.1)
      } else if (yAxisSnappedXVal !== null) {
        // 命中y轴对齐：交点是 (yAxisSnappedXVal, k * yAxisSnappedXVal + b)
        // 处理垂直线情况（90度或-90度）
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          snappedX = yAxisSnappedXVal.number
          snappedY = matchSnappedAngle.point.y
        } else {
          snappedX = yAxisSnappedXVal.number
          snappedY = k * yAxisSnappedXVal.number + b
        }
        console.log('match point', 2.2)
      } else if (xAxisSnappedYVal !== null) {
        // 命中x轴对齐：交点是 ((xAxisSnappedYVal - b) / k, xAxisSnappedYVal)
        // 处理水平线情况（0度或180度，k=0）和垂直线情况（90度或-90度）
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          // 垂直线：x保持不变
          snappedX = current.x
          console.log('match point', 2.31, snappedX)
        } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
          // 水平线：y保持为xAxisSnappedYVal，x使用angleSnapped.x
          snappedX = matchSnappedAngle.point.x
          console.log('match point', 2.32, matchSnappedAngle.origin, xAxisSnappedYVal.point)
        } else {
          snappedX = (xAxisSnappedYVal.number - b) / k
          console.log('match point', 2.33, matchSnappedAngle.origin, xAxisSnappedYVal.point)
        }
        snappedY = xAxisSnappedYVal.number
      }
      return {
        objType: nearestAnglePoint.objType,
        snapFromType: 'line',
        point: roundNumberList({
          x: snappedX,
          y: snappedY
        }),
        xAxisSnappedY: xAxisSnappedYVal?.number || null,
        yAxisSnappedX: yAxisSnappedXVal?.number || null,
      }
    }
    // 3. 第三优先级：单独角度磁吸
    if (matchSnappedAngle) {
      snappedX = matchSnappedAngle.point.x
      snappedY = matchSnappedAngle.point.y
      console.log('match point', 3)
      return {
        objType: matchSnappedAngle.objType,
        snapFromType: 'line',
        point: roundNumberList({
          x: snappedX,
          y: snappedY
        }),
        xAxisSnappedY: null,
        yAxisSnappedX: null,
      }
    }
  }
  // 4. 第四优先级：单独轴对齐磁吸
  if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal.number
    snappedY = xAxisSnappedYVal.number
    console.log('match point', 4)
    return {
      objType: yAxisSnappedXVal.objType,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      }),
      xAxisSnappedY: xAxisSnappedYVal?.number || null,
      yAxisSnappedX: yAxisSnappedXVal?.number || null,
    }
  }
  if (yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal.number
    snappedY = current.y
    console.log('match point', 5)
    return {
      objType: yAxisSnappedXVal.objType,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      }),
      xAxisSnappedY: xAxisSnappedYVal?.number || null,
      yAxisSnappedX: yAxisSnappedXVal?.number || null,
    }
  }
  if (xAxisSnappedYVal !== null) {
    snappedX = current.x
    snappedY = xAxisSnappedYVal.number
    console.log('match point', 6)
    return {
      objType: xAxisSnappedYVal.objType,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      }),
      xAxisSnappedY: xAxisSnappedYVal?.number || null,
      yAxisSnappedX: null,
    }
  }
  return null
}
export default getSnapPointAndLine