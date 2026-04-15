import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { Door } from './index.d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'

export class DoorEntity extends EntityClass<Door> {
  type: EntityType = 'door'
  id: string
  wallId: string | undefined
  wallPointId: number | undefined
  width: number
  height: number
  angle: number

  constructor(door: Door) {
    super(door)
    this.wallId = door.wallId
    this.wallPointId = door.wallPointId
    this.angle = door.angle
    this.width = door.width
    this.height = door.height
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
    const wallThickness = 20; // props.data.walls.find((wall) => wall.id === door.wallId)?.thickness || 0;
    // console.log('door', door)
    const geometry = new THREE.BoxGeometry(this.width, this.height, wallThickness + 2);// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    const doorMesh = new THREE.Mesh(geometry, material)
    doorMesh.position.set(this.data.x, this.height / 2, this.data.y)
    doorMesh.rotateY(this.angle * -1);
    scene!.add(doorMesh)
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
      return {
        index: 0,
        type: this.type,
        id: this.data.id,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      this.changePosition(newPosition.point)
      return true
    }
    return false
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    return [{
      objType: this.type,
      snapFromType: key,
      point: {
        index: 0,
        x: this.data.x,
        y: this.data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(obj: { type: EntityType }, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      console.log('after', obj.type, line, nearestAngle)
      this.data.angle = nearestAngle
    }
  }
}
