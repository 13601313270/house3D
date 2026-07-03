import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { SectorData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';

export class SectorEntity extends PointEntityClass<SectorData> {
  name: string = '扇形'
  type: string = 'sector'
  isPointObj: boolean = true
  private circleRadius = 6

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: SectorData, panOffset: Point, zoomLevel: number): void {
    const { r, startAngle, endAngle, x, y } = data;
    const screenX = x * zoomLevel + panOffset.x
    const screenY = y * zoomLevel + panOffset.y

    // 绘制一个圆形
    ctx.fillStyle = data.color
    ctx.strokeStyle = 'grey'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    ctx.arc(
      screenX,
      screenY,
      r * zoomLevel,
      endAngle * -1,
      startAngle * -1,
    )
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: SectorData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const { r, startAngle, endAngle, x, y } = data;
    const screenX = x * zoomLevel + panOffset.x
    const screenY = y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, Math.max(this.circleRadius * zoomLevel, 3), 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x, y, r })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'blue'
    ctx.save(); // 保存当前状态
    ctx.translate(
      circleArea.data.x * zoomLevel + panOffset.x,
      circleArea.data.y * zoomLevel + panOffset.y
    );
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(
      0,
      0,
      circleArea.data.r * zoomLevel,
      endAngle * -1,
      startAngle * -1,
    )
    ctx.lineTo(0, 0);
    ctx.stroke()
    ctx.restore(); // 恢复原始状态
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { r, h, color, mt, startAngle, endAngle } = data;

    const sectorShape = new THREE.Shape();
    // sectorShape.moveTo(0, 0);
    // sectorShape.lineTo(r * Math.cos(startAngle), r * Math.sin(startAngle));
    // sectorShape.absarc(0, 0, r, startAngle, endAngle, true);
    // sectorShape.lineTo(0, 0);

    sectorShape.moveTo(0, 0);
    sectorShape.lineTo(r * Math.cos(startAngle), r * Math.sin(startAngle));
    sectorShape.absarc(0, 0, r, startAngle, endAngle, false);
    sectorShape.lineTo(0, 0);

    const geometryRight = new THREE.ExtrudeGeometry(sectorShape, {
      depth: h,
      bevelEnabled: false,
    });

    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide }));
    const doorMeshRight = new THREE.Mesh(geometryRight, material)
    doorMeshRight.rotation.x = -Math.PI / 2;
    // doorMeshRight.position.setY(h / 2);
    group.add(doorMeshRight);

    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r, h } = this.getData();
    return [
      new THREE.Vector3(r * 2, h, r * 2),
      new THREE.Vector3(0, h / 2, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    let { r, startAngle, endAngle } = data;
    if (Math.abs(x - data.x) > r || Math.abs(y - data.y) > r) {
      return null
    }
    startAngle = startAngle % (Math.PI * 2)
    endAngle = endAngle % (Math.PI * 2)
    if (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    console.log('startAngle', startAngle, endAngle, endAngle - startAngle)
    // 获取沿着(data.x,data.y)角度为startAngle，长度为r的点的坐标
    const pointList = [
      {
        x: data.x,
        y: data.y,
      },
      {
        x: data.x + r * Math.cos(startAngle),
        y: data.y - r * Math.sin(startAngle),
      },
      {
        x: data.x + r * Math.cos(endAngle),
        y: data.y - r * Math.sin(endAngle),
      },
    ];
    if (startAngle < Math.PI / -2 * 3 && endAngle > Math.PI / -2 * 3) {
      pointList.push({
        x: data.x,
        y: data.y - r,
      })
    }
    if (startAngle < Math.PI * -1 && endAngle > Math.PI * -1) {
      pointList.push({
        x: data.x - r,
        y: data.y,
      })
    }
    if (startAngle < Math.PI / -2 && endAngle > Math.PI / -2) {
      pointList.push({
        x: data.x,
        y: data.y + r,
      })
    }
    if (startAngle < 0 && endAngle > 0) {
      pointList.push({
        x: data.x + r,
        y: data.y,
      })
    }
    if (startAngle < Math.PI / 2 && endAngle > Math.PI / 2) {
      pointList.push({
        x: data.x,
        y: data.y - r,
      })
    }
    if (startAngle < Math.PI && endAngle > Math.PI) {
      pointList.push({
        x: data.x - r,
        y: data.y,
      })
    }
    if (startAngle < Math.PI / 2 * 3 && endAngle > Math.PI / 2 * 3) {
      pointList.push({
        x: data.x,
        y: data.y + r,
      })
    }
    const minX = Math.min(...pointList.map(item => item.x))
    const minY = Math.min(...pointList.map(item => item.y))
    const maxX = Math.max(...pointList.map(item => item.x))
    const maxY = Math.max(...pointList.map(item => item.y))
    const circleRadius = this.circleRadius * 1.5
    if (x > (minX - circleRadius) && (maxX + circleRadius) > x && y > (minY - circleRadius) && (maxY + circleRadius) > y) {
      return new MatchRectArea({
        x: minX + (maxX - minX) / 2,
        y: minY + (maxY - minY) / 2,
        width: maxX - minX + circleRadius * 2,
        depth: maxY - minY + circleRadius * 2,
        angleY: 0,
      })
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
        id: 'h',
        label: '高度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 1,
        value: data.h,
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
      },
      {
        id: 'startAngle',
        label: '开始角度',
        dataType: 'number',
        min: -Math.PI,
        max: Math.PI,
        step: 0.1,
        value: data.startAngle,
      },
      {
        id: 'endAngle',
        label: '结束角度',
        dataType: 'number',
        min: -Math.PI,
        max: Math.PI,
        step: 0.1,
        value: data.endAngle,
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
