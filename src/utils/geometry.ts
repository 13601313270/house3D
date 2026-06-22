import { Point } from "@/types/map2d"

export const getClosestPointOnLine = (p: Point, a: Point, b: Point): Point => {
  const A = p.x - a.x
  const B = p.y - a.y
  const C = b.x - a.x
  const D = b.y - a.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  if (param < 0) {
    return { x: a.x, y: a.y }
  } else if (param > 1) {
    return { x: b.x, y: b.y }
  } else {
    return {
      x: a.x + param * C,
      y: a.y + param * D
    }
  }
}

export const roundNumberList = (point: { x: number, y: number }): Point => {
  return { x: Math.round(point.x), y: Math.round(point.y) }
}