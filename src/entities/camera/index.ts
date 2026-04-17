import { Point } from '@/types/map2d'
import * as THREE from 'three'
import { CameraData } from './index.d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { WallEntity } from '../wall'
import { editItem } from '..'

export function createCameraData() {
  const camera: CameraData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    angle: 0,
  }
  return camera
}

export function editPropConfig(): editItem[] {
  return [
  ]
}

export class CameraEntity extends EntityClass<CameraData> {
  type: EntityType = 'camera'
  id: string
  isPointObj: boolean = true

  constructor(camera: CameraData) {
    super(camera)
    this.id = camera.id
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y
    const color = '#e67e22'
    const width = 10 * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.data.angle)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -width / 2, width, width)
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

  draw3D(wall: WallEntity) {
    const geometry = new THREE.BoxGeometry(
      10,
      10,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    const doorMesh = new THREE.Mesh(geometry, material)
    doorMesh.position.set(this.data.x, 10, this.data.y)
    doorMesh.rotateY(this.data.angle * -1);
    return [
      doorMesh
    ]
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < 10 * zoomLevel) {
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
      objId: this.data.id,
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

  afterBeSnapByLine(obj: EntityClass<CameraData>, line: [Point, Point]) {
  }
}
