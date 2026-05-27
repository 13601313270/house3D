import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { ConeData } from './index.d'
import { allSnapFromType, EntityClass, MatchSnapPoint } from '@/types/entity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { ConeDataClass } from './dataClass'

export class ConeEntity extends EntityClass<ConeData> {
  type: string = 'cone'
  isPointObj: boolean = true
  private circleRadius = 12

  defaultValue(): ConeData {
    const data: ConeData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      r: 50,
      h: 100,
      color: '#e67e22',
      mt: null,
    }
    return new ConeDataClass(data)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: ConeData, panOffset: Point, zoomLevel: number): void {
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
    data: ConeData,
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

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group()

    const { r, h, color, mt } = data;

    const geometryRight = new THREE.CylinderGeometry(
      0,
      r,
      h,
      32
    );
    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: color }));
    const doorMeshRight = new THREE.Mesh(geometryRight, material)
    doorMeshRight.position.setY(h / 2)
    group.add(doorMeshRight);

    // group.position.set(data.x, data.r, data.y)
    // group.rotateY(data.angle * -1);
    return [
      group
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < data.r) {
      return true
    }
    return false;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
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

  setData(data: ConeData) {
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
        id: 'h',
        label: '高度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.h,
      },
      {
        id: 'mt',
        label: '门材质',
        dataType: 'material',
        value: data.mt,
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  inSceneSnapLineArea(obj: EntityClass<ConeData>, line: [Point, Point]) {
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
