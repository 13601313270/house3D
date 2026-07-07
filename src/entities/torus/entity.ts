import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { TorusData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { MatchCircleArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';

export class TorusEntity extends PointEntityClass<TorusData> {
  name: string = '环体'
  type: string = 'torus'
  isPointObj: boolean = true
  private circleRadius = 6
  public radialSegments = 32

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: TorusData, panOffset: Point, zoomLevel: number): void {
    const { r, t, arc } = data;
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    const outerRadius = (r + t) * zoomLevel
    const innerRadius = (r - t) * zoomLevel
    const arcRad = arc / 360 * Math.PI * 2

    ctx.fillStyle = data.color
    ctx.strokeStyle = 'grey'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(screenX, screenY, outerRadius, 0, -arcRad, true)
    ctx.arc(screenX, screenY, innerRadius, -arcRad, 0, false)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: TorusData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { r, t } = data;

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x: data.x, y: data.y, r: r + t })
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

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { r, t, color, mt, arc, thetaStart, thetaLength } = data;

    const geometry = new THREE.TorusGeometry(
      r,      // 主半径
      t,      // 管道半径
      16,     // 管道分段
      64,      // 环分段
      arc / 360 * Math.PI * 2,
      thetaStart,
      thetaLength,
    );
    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color }));
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.setY(t)
    mesh.rotation.x = -Math.PI / 2
    group.add(mesh);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r, t } = this.getData();
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    const w = r * 2 + t * 2;
    return [
      new THREE.Vector3(w, t * 2, w),
      new THREE.Vector3(0, t, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { r, t } = data;
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < r + t + 1) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: r + t + 1 })
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
        step: 1,
        value: data.r,
      },
      {
        id: 't',
        label: '管道半径',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 1,
        value: data.t,
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
        id: 'arc',
        label: '弧度',
        dataType: 'number',// 不能是angle，因为angle为360度的时候，会重新归位为0
        min: 0,
        max: 360,
        step: 1,
        value: data.arc,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      },
      // {
      //   id: 'thetaStart',
      //   label: '管状开始角度',
      //   dataType: 'angle',
      //   min: 0,
      //   max: 360,
      //   value: data.thetaStart,
      // },
      // {
      //   id: 'thetaLength',
      //   label: '管状结束角度',
      //   dataType: 'angle',
      //   min: 0,
      //   max: 360,
      //   value: data.thetaLength,
      // },
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
