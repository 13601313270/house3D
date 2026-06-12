import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { SphereData } from './index.d'
import { allSnapFromType, PointEntityClass } from '@/types/entity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { SphereDataClass } from './dataClass'
import { MatchCircleArea } from '@/utils/matchArea';

export class SphereEntity extends PointEntityClass<SphereData> {
  name: string = '球体'
  type: string = 'sphere'
  isPointObj: boolean = true
  private circleRadius = 6

  defaultValue(): SphereData {
    const door: SphereData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      r: 50,
      color: '#e67e22',
      mt: null,
    }
    return new SphereDataClass(door)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: SphereData, panOffset: Point, zoomLevel: number): void {
    const { r } = data;
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 绘制一个圆形
    ctx.fillStyle = data.color
    ctx.strokeStyle = 'grey'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(
      screenX,
      screenY,
      r * zoomLevel,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: SphereData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    // 实现门的2D绘制逻辑
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
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { r, color, mt } = data;

    const geometry = new THREE.SphereGeometry(
      r,
      32,
      32
    );
    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color }));
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.setY(data.r)
    group.add(mesh);

    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r } = this.getData();
    return [
      new THREE.Vector3(r * 2, r * 2, r * 2),
      new THREE.Vector3(0, r, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < data.r) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: data.r })
    }
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
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }) {
    const { x, y } = position
    this.changePosition({ x, y })
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    const data = this.getData();
    return [{
      objType: this.type,
      objId: data.id,
      snapFromType: key,
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

  setData(data: SphereData) {
    // 双向去除原有的关联对象
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.remove3DCache()
      }
    })
    super.setData(data)
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'r',
        label: '半径',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.r,
      },
      {
        id: 'mt',
        label: '材质',
        dataType: 'material',
        value: data.mt,
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 100,
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

  inSceneSnapPointArea() {
    return false
  }

  inSceneSnapLineArea() {
    return false
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
  }
}
