import { Point, Entity, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Window } from './index.d'
import * as THREE from 'three'

export class WindowEntity extends EntityClass<Window> {
  type: EntityType = 'window'
  width: number
  height: number
  angle: number
  color: string

  constructor(window: Window) {
    super(window)
    this.width = window.width
    this.angle = window.angle
    this.height = window.height
    this.color = '#3498db'
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y

    const color = '#3498db'
    const width = this.width * zoomLevel;
    const thickness = 20 * zoomLevel;

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.angle)

    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = this.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
      return {
        index: 0,
        id: this.data.id,
        type: this.type,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  draw3D(scene: any): void {
    // 实现门的3D绘制逻辑
    const wallThickness = 20; // props.data.walls.find((wall) => wall.id === door.wallId)?.thickness || 0;
    console.log('window', this.width, this.height)
    const geometry = new THREE.BoxGeometry(this.width, this.height, wallThickness + 2);// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: this.color })
    const doorMesh = new THREE.Mesh(geometry, material)
    doorMesh.position.set(this.data.x, this.height / 2 + 40, this.data.y)
    doorMesh.rotateY(this.angle * -1);
    scene!.add(doorMesh)
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
      this.data.angle = nearestAngle
    }
  }
}
