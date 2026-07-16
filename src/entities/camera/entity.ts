import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { CameraData } from './index.d'
import { editItem } from '@/utils/editItem'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import kamera from './kamera.png'
import { MatchCircleArea } from '@/utils/matchArea'
import { OrigionSnapPoint } from '@/types/baseEntity'
import { CameraBase } from '@/types/CameraBase'
import { GroupBaseEntity } from '@/types/GroupBaseEntity'
import { GroupBaseData } from '@/types/groupBase';

const img = new Image()
img.src = kamera || ''

export class CameraEntity extends CameraBase<CameraData> {
  name: string = '相机'
  type: string = 'camera'
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  color3DActive: string = 'red'
  colorOpacity: string = '#14b737a5'
  colorOpacityActive: string = 'red'
  active: boolean = false // 这个不存在数据库里，只是在前端动态调整
  private circleRadius = 6

  constructor(world: GroupBaseEntity<GroupBaseData>, data: CameraData) {
    super(world, data)
    this.realyCamera = new THREE.PerspectiveCamera(data.fov, data.aspectW / data.aspectH, 0.1, 10000)
    setTimeout(() => {
      if (this.realyCamera) {
        this.realyCamera.position.set(
          data.x,
          data.z,
          data.y,
        )
        this.realyCamera.lookAt(
          data.targetPositionX,
          data.targetPositionZ,
          data.targetPositionY
        );
        this.realyCamera.updateProjectionMatrix()
      }
      // 需要等Application里面把Canvas3D初始化之后realyCamera的修改位置才有意义。
    }, 100)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: CameraData, panOffset: Point, zoomLevel: number): void {
    const index: number = this.parentEntity ? this.parentEntity.getTypeListEntity('camera').indexOf(this) : -1;
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = Math.atan2(data.targetPositionY - data.y, data.targetPositionX - data.x);
    const preImgScale = 0.2
    ctx.save(); // 保存当前状态
    const { width, height } = img;
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY - Math.PI / 2); // 围绕新原点旋转
    ctx.drawImage(
      img,
      preImgScale / -2 * width * zoomLevel,
      preImgScale / -2 * height * zoomLevel,
      preImgScale * width * zoomLevel,
      preImgScale * height * zoomLevel
    ); // 以新原点为中心绘制
    ctx.restore(); // 恢复原始状态

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

    // ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(
      data.targetPositionX * zoomLevel + panOffset.x,
      data.targetPositionY * zoomLevel + panOffset.y,
      this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    // ctx.fill()
    ctx.stroke()

    if (index > -1 && zoomLevel > 0.4) {
      const str = (index + 1).toString()
      ctx.font = `${Math.max(16 * zoomLevel, 16)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const radius = Math.max(10 * zoomLevel, 10)
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.active ? this.colorOpacityActive : this.colorOpacity
      ctx.lineWidth = 2 * zoomLevel
      ctx.stroke()
      ctx.fillStyle = this.active ? this.colorOpacityActive : this.colorOpacity
      ctx.fillText(str, screenX, screenY)
    }
  }

  draw2DHandleByData(
    ctx: CanvasRenderingContext2D,
    data: CameraData,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
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
      this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制轮廓
    const circleArea = new MatchCircleArea({
      x: data.x,
      y: data.y,
      r: 30,
    })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      circleArea.data.x * zoomLevel + panOffset.x,
      circleArea.data.y * zoomLevel + panOffset.y
    );
    ctx.beginPath()
    ctx.arc(
      0,
      0,
      circleArea.data.r * zoomLevel,
      0,
      Math.PI * 2,
    )
    ctx.stroke()
    ctx.restore(); // 恢复原始状态
  }

  create3DMesh(): THREE.Group[] {
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
        if (child instanceof THREE.Mesh) {
          child.layers.set(2)
          child.material = material
        }
      })
      // @ts-ignore
      object.isCameraObj = true;
      group.add(object)
      // console.log('OBJ文件加载成功:', url)
    }, () => {
      // 加载进度
      // const percent = (progress.loaded / progress.total * 100).toFixed(2)
      // console.log('加载进度:', percent + '%')
    }, (error: any) => {
      console.error('OBJ文件加载失败:', error)
    })
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    // const { width, height, bottom, z } = this.getData();
    return [
      new THREE.Vector3(60, 60, 60),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  private lastChangeStateKey = '';
  change3DMeshState(): void {
    const data = this.getData();
    const lastDataStr = JSON.stringify(data)
    if (this.lastChangeStateKey === lastDataStr) {
      this.meshList.forEach(v => {
        v.position.set(data.x, data.z, data.y)
      })
      return
    }
    this.lastChangeStateKey = lastDataStr
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
    const oldLine = this.meshList[0].children[0] as THREE.LineSegments
    oldLine.geometry = edges
    oldLine.position.set(-data.x, -data.z, -data.y)

    // console.log('children', this.meshList[0].children)

    // @ts-ignore
    const object: THREE.Group | undefined = this.meshList[0].children.find(v => v.isCameraObj)

    if (object) {
      object.lookAt(center);
    }
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
    })
    if (this.realyCamera) {
      this.realyCamera.position.set(data.x, data.z, data.y)
      this.realyCamera.position.set(
        data.x,
        data.z,
        data.y,
      )
      this.realyCamera.lookAt(
        data.targetPositionX,
        data.targetPositionZ,
        data.targetPositionY
      );
      this.realyCamera.updateProjectionMatrix()
    }
  }

  meshNeedChangeKey() {
    const cacheData = {
      tip: this.getData().tip,
      tipFontSize: this.getData().tipFontSize,
    }
    return this.type + JSON.stringify(cacheData)
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const screenX = data.x;//  * zoomLevel + panOffset.x
    const screenY = data.y;// * zoomLevel + panOffset.y
    const targetX = data.targetPositionX;// * zoomLevel + panOffset.x
    const targetY = data.targetPositionY;// * zoomLevel + panOffset.y
    const distance = Math.hypot(targetX - screenX, targetY - screenY)
    const radius = distance

    // 计算FOV的半角
    // const halfFov = (data.fov * Math.PI) / 360

    // 计算方向向量
    const dirX = targetX - screenX
    const dirY = targetY - screenY
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY)
    const unitDirX = dirX / dirLength
    const unitDirY = dirY / dirLength

    // 计算垂直方向向量
    // const perpX = -unitDirY
    // const perpY = unitDirX

    // 计算三角形底边长
    // const baseHalfLength = radius * Math.tan(halfFov)

    // 计算三角形的两个底点
    const midX = screenX + unitDirX * radius
    const midY = screenY + unitDirY * radius

    const dist = Math.hypot(x - data.x, y - data.y)
    const distToMid = Math.hypot(x - midX, y - midY)
    if (distToMid < 30) {
      return new MatchCircleArea({
        x: midX,
        y: midY,
        r: 30,
      })
    }

    if (dist < 30) {
      return new MatchCircleArea({
        x: data.x,
        y: data.y,
        r: 30,
      })
    }
    // const distToTarget = Math.hypot(x - data.targetPositionX, y - data.targetPositionY)
    // if (distToTarget < this.circleRadius + 3) {
    //   return true
    // }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const distToTarget = Math.hypot(x - data.targetPositionX, y - data.targetPositionY)
    if (distToTarget < this.circleRadius + 3) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: distToTarget,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y } = position
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

  inSceneSnapPointArea() {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const data = this.getData();
    return [{
      objType: this.type,
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

  inSceneSnapLineArea() {
    return false;
  }

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      ...this.getData(),
      x,
      y,
      targetPositionX: x + 100,
      targetPositionY: y,
    })
    return [];
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
        step: 1,
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
        label: '相机Z轴',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
      },
      {
        id: 'targetPositionZ',
        label: '目标Z轴',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.targetPositionZ,
      }
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
