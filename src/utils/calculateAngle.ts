import { Point } from "@/types/map2d";

export const calculateAngle = (p1: Point, p2: Point, p3: Point): { angle: number; isConvex: boolean } | null => {
  const v1x = p1.x - p2.x
  const v1y = p1.y - p2.y
  const v2x = p3.x - p2.x
  const v2y = p3.y - p2.y

  const dot = v1x * v2x + v1y * v2y
  const len1 = Math.hypot(v1x, v1y)
  const len2 = Math.hypot(v2x, v2y)

  if (len1 === 0 || len2 === 0) return null

  const cosAngle = dot / (len1 * len2)
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI

  // 计算叉积判断凹凸性
  const cross = v1x * v2y - v1y * v2x
  const isConvex = cross > 0

  return { angle, isConvex }
}