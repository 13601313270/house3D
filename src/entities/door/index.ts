import { Point, Entity } from '@/types/map2d'
import { Door } from './index.d'

export class DoorEntity implements Entity {
  id: string
  x: number
  y: number
  door: Door

  constructor(door: Door) {
    this.door = door
    this.id = door.id
    this.x = door.x
    this.y = door.y
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = this.door.x * zoomLevel + panOffset.x
    const screenY = this.door.y * zoomLevel + panOffset.y
    // const wallThickness = 10; // walls.find((wall) => wall.id === this.door.wallId)?.thickness || 0;
    const color = '#e67e22'
    const width = this.door.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.door.angle)
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
}
