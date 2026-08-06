import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { CylinderData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchCircleArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';
import { resize } from '@/utils/handleImgs';

export class CylinderEntity extends PointEntityClass<CylinderData> {
  name: string = '圆柱体'
  type: string = 'cylinder'
  private circleRadius = 6
  public radialSegments = 32
  canEditAnimationDataColumn: Array<keyof CylinderData> = [];

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { r } = data;
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel

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

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x: data.x, y: data.y, r: data.r })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      circleArea.data.x * zoomLevel,
      circleArea.data.y * zoomLevel
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

    // 控制点
    super.draw2DActionHandle(ctx, zoomLevel);
    // 调整半径的控制点
    (() => {
      const circleRadius = this.getCircleRadius() * zoomLevel + 3;
      const imgSize = circleRadius * 1.5;
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      const screenX = (data.x + data.r) * zoomLevel;
      const screenY = data.y * zoomLevel;

      ctx.beginPath()
      ctx.arc(screenX, screenY, circleRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke();
      ctx.drawImage(resize, screenX - imgSize / 2, screenY - imgSize / 2, imgSize, imgSize);
    })();
  }

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { r, h, color, mt } = data;

    const geometry = new THREE.CylinderGeometry(
      r,
      r,
      h,
      this.radialSegments,
    );
    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color }));
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.setY(h / 2)
    group.add(mesh);

    // group.position.set(data.x, data.r, data.y)
    // group.rotateY(data.angle * -1);
    return [
      group
    ]
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r, h } = this.getData();
    return [
      new THREE.Vector3(r * 2, h, r * 2),
      new THREE.Vector3(0, h / 2, 0),
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
    const circleRadius = this.getCircleRadius();

    const dist = Math.hypot(x - (data.x + data.r), y - data.y)
    if (dist < circleRadius) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    return super.matchHandelInfo(x, y)
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index === 1) {
      const data = this.getData()
      const dist = Number((position.x - data.x).toFixed(1));
      this.setData({
        r: dist,
      } as Partial<CylinderData>)
      return [dist + 'cm']
    } else {
      super.matchHandelMoveCallback(position, matchHandelInfo)
    }
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

  getEditPropConfigData(data: CylinderData): editItem[] {
    return [
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
    ];
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow(this.getEditPropConfigData(data), (val) => {
      this.setData({
        // ...data,
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
}
