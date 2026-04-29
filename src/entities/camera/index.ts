import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { CameraData } from './index.d'
import { EntityClass, EntityType, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
import { ObjDataClass } from '../objData'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class CameraDataClass extends ObjDataClass<CameraData> {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
  constructor(data: CameraData) {
    super(data)
    this.targetPositionX = 0
    this.targetPositionY = 0
    this.targetPositionZ = 100
    this.fov = 55
    this.aspectW = 9
    this.aspectH = 16
  }
}
export function createCameraData(): CameraDataClass {
  const camera: CameraData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 100,
    aspectW: 9,
    aspectH: 16,
    // 相机目标位置
    targetPositionX: 0,
    targetPositionY: 0,
    targetPositionZ: 100,
    fov: 55,
  }
  return new CameraDataClass(camera)
}

export class CameraEntity extends EntityClass<CameraData> {
  type: EntityType = 'camera'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  color3DActive: string = 'red'
  colorOpacity: string = '#14b737a5'
  colorOpacityActive: string = 'red'
  active: boolean = false // 这个不存在数据库里，只是在前端动态调整

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: CameraData, panOffset: Point, zoomLevel: number): void {

  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: CameraData,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const targetX = data.targetPositionX * zoomLevel + panOffset.x
    const targetY = data.targetPositionY * zoomLevel + panOffset.y
    const distance = Math.hypot(targetX - screenX, targetY - screenY)
    const radius = distance

    // 计算FOV的半角
    const halfFov = (data.fov * Math.PI) / 360

    // 绘制三角形
    ctx.fillStyle = this.colorOpacity
    ctx.strokeStyle = this.active ? this.colorOpacityActive : this.colorOpacity
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
    // ctx.fill()
    ctx.stroke()

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
      data.targetPositionX * zoomLevel + panOffset.x,
      data.targetPositionY * zoomLevel + panOffset.y,
      6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    const data = this.getData();
    const dx = data.targetPositionX - data.x
    const dy = data.targetPositionY - data.y
    const dz = data.targetPositionZ - data.z

    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const halfFov = (data.fov * Math.PI) / 360
    const baseSize = distance * Math.tan(halfFov) * 2
    const depth = data.aspectH / data.aspectW * baseSize;   // 长方形长
    const width = baseSize;   // 长方形宽

    const apex = new THREE.Vector3(data.x, data.z, data.y);
    const center = new THREE.Vector3(data.targetPositionX, data.targetPositionZ, data.targetPositionY);
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

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.active ? this.color3DActive : this.color3D,
      linewidth: 1
    });
    const line = new THREE.LineSegments(edges, lineMaterial);
    line.position.set(-data.x, -data.z, -data.y)

    const group = new THREE.Group()
    line.layers.set(2)
    group.add(line)

    const loader = new OBJLoader()
    // 将方向向量旋转90度
    // const rotatedDirection = materialVec ? new THREE.Vector3(...materialVec) : new THREE.Vector3(-1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.1
    })
    loader.load('./kamera.obj', (object: THREE.Group) => {
      object.scale.set(5, 5, 5)
      object.lookAt(up);
      object.rotateX(Math.PI);  // 如果需要绕 X 轴翻转 180 度
      object.rotateZ(Math.PI);  // 如果需要绕 Y 轴翻转 180 度
      // 添加默认材质（如果模型没有材质）
      object.traverse((child) => {
        // child.material = material
        if (child instanceof THREE.Mesh) {
          child.layers.set(2)
          child.material = material
        }
      })

      group.add(object)
      // console.log('OBJ文件加载成功:', url)
    }, (progress: any) => {
      // 加载进度
      const percent = (progress.loaded / progress.total * 100).toFixed(2)
      console.log('加载进度:', percent + '%')
    }, (error: any) => {
      console.error('OBJ文件加载失败:', error)
    })

    return [
      group
    ]
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 10) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    const distToTarget = Math.hypot(x - data.targetPositionX, y - data.targetPositionY)
    if (distToTarget < 10) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: distToTarget,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    const data = this.getData();
    if (matchHandelInfo.index === 1) {
      this.setData({
        ...data,
        targetPositionX: x,
        targetPositionY: y,
      })
    } else {
      this.changePosition({ x, y })
    }
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const data = this.getData();
    return [{
      objType: this.type,
      objId: data.id,
      snapFromType: 'point',
      point: {
        index: 0,
        x: data.x,
        y: data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  inSceneSnapLineArea(obj: EntityClass<CameraData>, line: [Point, Point]) {
    return false;
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
      targetPositionX: x + 100,
      targetPositionY: y,
    })
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'fov',
        label: '角度',
        dataType: 'number',
        min: 0,
        max: 180,
        step: 15,
        value: data.fov,
      },
      {
        id: 'aspectW',
        label: '宽度比',
        dataType: 'number',
        min: 0,
        max: 99,
        step: 1,
        value: data.aspectW,
      },
      {
        id: 'aspectH',
        label: '高度比',
        dataType: 'number',
        min: 0,
        max: 99,
        step: 1,
        value: data.aspectH,
      },
      {
        id: 'z',
        label: 'Z轴',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
      }
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
