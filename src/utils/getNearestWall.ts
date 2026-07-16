import { WallData } from '@/entities/wall/index.d'
import { NearestWallResult } from "@/types/entityInWall"
import { Point } from "@/types/map2d"
import pointToLineDistance from '@/utils/pointToLineDistance'
import { getClosestPointOnLine } from '@/utils/geometry'

export const snapThreshold = 20

function getNearestWall(point: Point): NearestWallResult | null {
  let nearestWall: WallData | null = null
  let nearestPoint: Point | null = null
  let minDistance = Infinity
  let nearestAngle = 0
  let lineIndex: number = -1;

  (window.worldApi.getTypeObjectsData('wall') as WallData[]).forEach((wall: WallData) => {
    for (let i = 0; i < wall.points.length - 1; i++) {
      const p1 = wall.points[i]
      const p2 = wall.points[i + 1]

      const distance = pointToLineDistance(point, p1, p2)

      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
        lineIndex = i;
        nearestPoint = getClosestPointOnLine(point, p1, p2)
        nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      }
    }
  })

  if (nearestPoint && lineIndex > -1 && minDistance < snapThreshold && nearestWall) {
    return {
      lineIndex,
      wall: nearestWall,
      pointOnWall: nearestPoint,
      angle: nearestAngle
    }
  }

  return null
}

export default getNearestWall