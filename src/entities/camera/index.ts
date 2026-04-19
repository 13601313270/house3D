import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { CameraData } from './index.d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { WallEntity } from '../wall'
import { editItem } from '..'

export function createCameraData() {
  const camera: CameraData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 100,
    aspectW: 16,
    aspectH: 9,
    // 相机目标位置
    targetPositionX: 0,
    targetPositionY: 0,
    targetPositionZ: 100,
    fov: 45,
  }
  return camera
}

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'fov',
      label: '角度',
      dataType: 'number',
    },
    {
      id: 'aspectW',
      label: '宽度比',
      dataType: 'number',
    },
    {
      id: 'aspectH',
      label: '高度比',
      dataType: 'number',
    }
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
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 1 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // targetPosition 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(
      this.data.targetPositionX * zoomLevel + panOffset.x,
      this.data.targetPositionY * zoomLevel + panOffset.y,
      6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制扇形
    const targetX = this.data.targetPositionX * zoomLevel + panOffset.x
    const targetY = this.data.targetPositionY * zoomLevel + panOffset.y
    const distance = Math.hypot(targetX - screenX, targetY - screenY)
    const radius = distance

    // 计算方向角度
    const angle = Math.atan2(targetY - screenY, targetX - screenX)
    // 计算FOV的半角
    const halfFov = (this.data.fov * Math.PI) / 360
    // 计算扇形的起始和结束角度
    const startAngle = angle - halfFov
    const endAngle = angle + halfFov

    // 绘制扇形
    ctx.fillStyle = 'rgba(230, 126, 34, 0.2)'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    ctx.arc(screenX, screenY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  draw3D() {
    // Calculate direction vector from camera to target
    const dx = this.data.targetPositionX - this.data.x
    const dy = this.data.targetPositionY - this.data.y
    const dz = this.data.targetPositionZ - 0

    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // Calculate base size based on FOV
    const halfFov = (this.data.fov * Math.PI) / 360
    const baseSize = distance * Math.tan(halfFov)

    // Create pyramid geometry
    const geometry = new THREE.ConeGeometry(baseSize, distance, 4)
    // Translate geometry so apex is at local origin
    geometry.translate(0, -distance / 2, 0)
    const material = new THREE.MeshStandardMaterial({
      color: 0xe67e22,
      transparent: true,
      opacity: 0.3
    })
    const pyramid = new THREE.Mesh(geometry, material)

    // Position at camera location (apex at camera position)
    pyramid.position.set(this.data.x, 0, this.data.y)

    // Calculate rotation to face target
    const target = new THREE.Vector3(this.data.targetPositionX, 0, this.data.targetPositionY)
    pyramid.lookAt(target)

    // Adjust rotation to point the apex towards target
    pyramid.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面

    return [
      pyramid
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
    const distToTarget = Math.hypot(x - this.data.targetPositionX, y - this.data.targetPositionY)
    if (distToTarget < 10 * zoomLevel) {
      return {
        index: 1,
        type: this.type,
        id: this.data.id,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    console.log(matchHandelInfo)
    if (matchHandelInfo.index === 1) {
      this.data.targetPositionX = x
      this.data.targetPositionY = y
    } else {
      this.changePosition({ x, y })
    }
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    return [{
      objType: this.type,
      objId: this.data.id,
      snapFromType: 'point',
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
