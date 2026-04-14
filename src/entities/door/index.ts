import { HandelInfo, Point } from '@/types/map2d'
import { Door } from './index.d'
import { EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'

export class DoorEntity extends EntityClass<Door> {
  type: EntityType = 'door'
  id: string
  wellId: string
  width: number
  angle: number

  constructor(door: Door) {
    super(door)
    this.wellId = door.wallId
    this.angle = door.angle
    this.width = door.width
    this.id = door.id
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y
    // const wallThickness = 10; // walls.find((wall) => wall.id === this.wallId)?.thickness || 0;
    const color = '#e67e22'
    const width = this.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.angle)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, -Math.PI / 4, Math.PI / 4)
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  draw3D(scene: any): void {
    // 实现门的3D绘制逻辑
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
      return {
        type: this.type,
        id: this.data.id,
      }
    }
    return null;
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint, matchHandelInfo: HandelInfo) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      this.changePosition(newPosition.point)
      return true
    }
    return false
  }

  getBeSnapPoints() {
    return [{
      objType: this.type,
      snapFromType: 'point',
      point: {
        x: this.data.x,
        y: this.data.y,
      },
    }]
  }

  getBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(line: [Point, Point]) {
    const p1 = line[0]
    const p2 = line[1]
    const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    this.data.angle = nearestAngle
  }
}
