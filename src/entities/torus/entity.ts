import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { TorusData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchCircleArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';
import { resize } from '@/utils/handleImgs';

export class TorusEntity extends PointEntityClass<TorusData> {
  name: string = '环体'
  type: string = 'torus'
  public radialSegments = 32

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { r, t, arc } = data;
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel

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

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    const { r, t } = data;

    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x: data.x, y: data.y, r: r + t })
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

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
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
    const data = this.getData()

    const circleRadius = this.getCircleRadius();

    const dist = Math.hypot(x - (data.x + data.r), y - data.y)
    if (dist < circleRadius) {
      return {
        index: 2,
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
    if (matchHandelInfo.index === 2) {
      const data = this.getData()
      const dist = Number((position.x - data.x).toFixed(1));
      this.setData({
        r: dist,
      } as Partial<TorusData>)
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

  getEditPropConfigData(data: TorusData): editItem[] {
    return [
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
    ]
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
