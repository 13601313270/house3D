import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { SphereData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { MatchCircleArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';

export class SphereEntity extends PointEntityClass<SphereData> {
  name: string = '球体'
  type: string = 'sphere'
  isPointObj: boolean = true
  private circleRadius = 6

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: SphereData, panOffset: Point, zoomLevel: number): void {
    const { r } = data;
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

  draw2DHandleByData(
    ctx: CanvasRenderingContext2D,
    data: SphereData,
    panOffset: Point,
    zoomLevel: number,
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

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x: data.x, y: data.y, r: data.r })
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

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
    return [];
  }
}
