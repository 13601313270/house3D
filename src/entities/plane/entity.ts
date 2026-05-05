import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { PlaneData } from './index.d'
import { allSnapFromType, EntityClass, MatchSnapPoint } from '@/types/entity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { ConeDataClass } from './dataClass'

export class PlaneEntity extends EntityClass<PlaneData> {
  type: string = 'plane'
  isPointObj: boolean = true

  defaultValue(): PlaneData {
    const data: PlaneData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      width: 200,
      length: 200,
      color: '#e67e22',
      mt: null,
    }
    return new ConeDataClass(data)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: PlaneData, panOffset: Point, zoomLevel: number): void {
    const { width, length } = data;
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 绘制一个平面
    ctx.fillStyle = data.color
    ctx.beginPath()
    ctx.fillRect(
      screenX - width / 2 * zoomLevel,
      screenY - length / 2 * zoomLevel,
      width * zoomLevel,
      length * zoomLevel,
    )
    ctx.fill()
    ctx.closePath()
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: PlaneData,
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
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  glbObj: THREE.Group | null = null;

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group()

    const { width, length, color, mt } = data;
    // 平面
    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(1, 1, 0))) : (new THREE.MeshStandardMaterial({ color: color }));
    const plane = new THREE.PlaneGeometry(width, length)
    const planeMesh = new THREE.Mesh(plane, material)
    planeMesh.rotation.x = -Math.PI / 2
    
    group.add(planeMesh)
    return [
      group
    ]
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 6 * zoomLevel) {
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

  setData(data: PlaneData) {
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
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'length',
        label: '长度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.length,
      },
      {
        id: 'z',
        label: '距离地面高度',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
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

  inSceneSnapLineArea(obj: EntityClass<PlaneData>, line: [Point, Point]) {
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
