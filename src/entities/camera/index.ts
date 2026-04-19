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

    // 绘制三角形
    ctx.fillStyle = 'rgba(230, 126, 34, 0.2)'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    
    // 计算方向向量
    const dirX = targetX - screenX
    const dirY = targetY - screenY
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY)
    const unitDirX = dirX / dirLength
    const unitDirY = dirY / dirLength
    
    // 计算垂直方向向量
    const perpX = -unitDirY
    const perpY = unitDirX
    
    // 计算三角形底边长
    const baseHalfLength = radius * Math.tan(halfFov)
    
    // 计算三角形的两个底点
    const midX = screenX + unitDirX * radius
    const midY = screenY + unitDirY * radius
    const p1X = midX + perpX * baseHalfLength
    const p1Y = midY + perpY * baseHalfLength
    const p2X = midX - perpX * baseHalfLength
    const p2Y = midY - perpY * baseHalfLength
    
    // 绘制三角形
    ctx.lineTo(p1X, p1Y)
    ctx.lineTo(p2X, p2Y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  draw3D() {
    const dx = this.data.targetPositionX - this.data.x
    const dy = this.data.targetPositionY - this.data.y
    const dz = this.data.targetPositionZ - this.data.z

    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const halfFov = (this.data.fov * Math.PI) / 360
    const baseSize = distance * Math.tan(halfFov) * 2
    const depth = this.data.aspectH / this.data.aspectW * baseSize;   // 长方形长
    const width = baseSize;   // 长方形宽

    const apex = new THREE.Vector3(this.data.x, this.data.z, this.data.y);
    const center = new THREE.Vector3(this.data.targetPositionX, this.data.targetPositionZ, this.data.targetPositionY);

    const up = apex.clone().sub(center).normalize();

    const temp = Math.abs(up.y) < 0.999
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);

    const right = new THREE.Vector3().crossVectors(temp, up).normalize();
    const forward = new THREE.Vector3().crossVectors(up, right).normalize();

    const hw = width / 2;
    const hd = depth / 2;

    const p0 = center.clone().addScaledVector(right, -hw).addScaledVector(forward, -hd);
    const p1 = center.clone().addScaledVector(right, hw).addScaledVector(forward, -hd);
    const p2 = center.clone().addScaledVector(right, hw).addScaledVector(forward, hd);
    const p3 = center.clone().addScaledVector(right, -hw).addScaledVector(forward, hd);

    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array([
      p0.x, p0.y, p0.z,
      p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z,
      p3.x, p3.y, p3.z,
      apex.x, apex.y, apex.z
    ]);

    const indices = [
      0, 1, 2,
      0, 2, 3,
      0, 1, 4,
      1, 2, 4,
      2, 3, 4,
      3, 0, 4
    ];

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      side: THREE.DoubleSide
    });

    const pyramid = new THREE.Mesh(geometry, material);
    // pyramid.rotateX(-Math.PI / 2);

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
