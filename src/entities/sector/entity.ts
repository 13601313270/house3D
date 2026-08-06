import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { SectorData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';
import getMatchRectAreaBySector from '@/utils/getMatchRectAreaBySector';
import { resize } from '@/utils/handleImgs';

export class SectorEntity extends PointEntityClass<SectorData> {
  name: string = '扇形体'
  type: string = 'sector'
  private circleRadius = 3
  canEditAnimationDataColumn: Array<keyof SectorData> = [];

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { r, startAngle, endAngle, x, y } = data;
    const screenX = x * zoomLevel
    const screenY = y * zoomLevel

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

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    let { r, startAngle, endAngle, x, y } = data;
    startAngle = startAngle % (Math.PI * 2)
    endAngle = endAngle % (Math.PI * 2)
    if (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    const screenX = x * zoomLevel
    const screenY = y * zoomLevel

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x, y, r })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'blue'
    ctx.save(); // 保存当前状态
    ctx.translate(
      circleArea.data.x * zoomLevel,
      circleArea.data.y * zoomLevel
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

    // 控制点
    const circleRadius = this.getCircleRadius() * zoomLevel + 3;
    super.draw2DActionHandle(ctx, zoomLevel)

    // 绘制startAngle的点
    ctx.beginPath()
    ctx.arc(
      screenX + r * Math.cos(startAngle) * zoomLevel,
      screenY - r * Math.sin(startAngle) * zoomLevel,
      Math.max(circleRadius, 6),
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
    ctx.closePath()

    // 绘制endAngle的点
    ctx.beginPath()
    ctx.arc(
      screenX + r * Math.cos(endAngle) * zoomLevel,
      screenY - r * Math.sin(endAngle) * zoomLevel,
      Math.max(circleRadius, 6),
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
    ctx.closePath()

    // 绘制一个缩放尺寸的点
    ctx.beginPath()
    const xTemp = screenX + r * Math.cos((startAngle + endAngle) / 2) * zoomLevel;
    const yTemp = screenY - r * Math.sin((startAngle + endAngle) / 2) * zoomLevel;
    ctx.arc(
      xTemp,
      yTemp,
      Math.max(circleRadius, 6),
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
    const imgSize = circleRadius * 1.5;
    const midAngle = (startAngle + endAngle) / 2;
    ctx.save();
    ctx.translate(xTemp, yTemp);
    ctx.rotate(midAngle * -1);
    ctx.drawImage(resize, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
    ctx.restore();
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { r, h, color, mt, startAngle, endAngle } = data;

    const sectorShape = new THREE.Shape();

    sectorShape.moveTo(0, 0);
    sectorShape.lineTo(r * Math.cos(startAngle), r * Math.sin(startAngle));
    sectorShape.absarc(0, 0, r, startAngle, endAngle, false);
    sectorShape.lineTo(0, 0);

    const geometry = new THREE.ExtrudeGeometry(sectorShape, {
      depth: h,
      bevelEnabled: false,
    });

    const material = mt ? (getMaterialById(mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide }));
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2;
    group.add(mesh);

    return [
      group
    ]
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const data = this.getData();
    const { r, startAngle, endAngle, x, y, h } = data;
    const { minX, maxX, minY, maxY } = getMatchRectAreaBySector(data.x, data.y, r, startAngle, endAngle)
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    // console.log('minX', minX, 'maxX', maxX, 'minY', minY, 'maxY', maxY)
    return [
      new THREE.Vector3(maxX - minX, h, maxY - minY),
      new THREE.Vector3(
        (Math.abs(maxX - x) - Math.abs(minX - x)) / 2,
        h / 2,
        (Math.abs(maxY - y) - Math.abs(minY - y)) / 2),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { r, startAngle, endAngle } = data;
    const circleRadius = this.circleRadius * 1.5
    if (Math.abs(x - data.x) > r + circleRadius || Math.abs(y - data.y) > r + circleRadius) {
      return null
    }
    let { minX, maxX, minY, maxY } = getMatchRectAreaBySector(data.x, data.y, r, startAngle, endAngle)
    minX -= circleRadius;
    maxX += circleRadius;
    minY -= circleRadius;
    maxY += circleRadius;
    if (x > minX && maxX > x && y > minY && maxY > y) {
      return new MatchRectArea({
        x: (maxX + minX) / 2,
        y: (maxY + minY) / 2,
        width: maxX - minX,
        depth: maxY - minY,
        angleY: 0,
      })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    let { startAngle, endAngle, r } = data;
    if (Math.abs(x - data.x) > r + this.circleRadius * 1.5 || Math.abs(y - data.y) > r + this.circleRadius * 1.5) {
      return null
    }
    startAngle = startAngle % (Math.PI * 2)
    endAngle = endAngle % (Math.PI * 2)
    if (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    // console.log('mmmmmmmm');
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }

    // startAngle控制点
    const startAngleX = data.x + r * Math.cos(startAngle)
    const startAngleY = data.y - r * Math.sin(startAngle)
    const distStart = Math.hypot(x - startAngleX, y - startAngleY)
    if (distStart < this.circleRadius) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: distStart,
      }
    }

    // endAngle控制点
    const endAngleX = data.x + r * Math.cos(endAngle)
    const endAngleY = data.y - r * Math.sin(endAngle)
    const distEnd = Math.hypot(x - endAngleX, y - endAngleY)
    if (distEnd < this.circleRadius) {
      return {
        index: 2,
        type: this.type,
        id: data.id,
        dist: distEnd,
      }
    }

    // 绘制一个缩放尺寸的点
    const centerAngelX = data.x + r * Math.cos((startAngle + endAngle) / 2)
    const centerAngelY = data.y - r * Math.sin((startAngle + endAngle) / 2)
    const distCenter = Math.hypot(x - centerAngelX, y - centerAngelY)
    if (distCenter < this.circleRadius) {
      return {
        index: 3,
        type: this.type,
        id: data.id,
        dist: distCenter,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const data = this.getData();
    const { index } = matchHandelInfo;
    const { x, y } = position
    if (index === 1) {
      // 计算(x,y)到(data.x,data.y)的角度
      const angle = Math.atan2(y - data.y, x - data.x)
      this.setData({
        // ...data,
        startAngle: angle * -1,
      })
    } else if (index === 2) {
      // 计算(x,y)到(data.x,data.y)的角度
      const angle = Math.atan2(y - data.y, x - data.x)
      this.setData({
        // ...data,
        endAngle: angle * -1,
      })
    } else if (index === 3) {
      // 计算(x,y)到(data.x,data.y)的距离
      const dist = Math.hypot(x - data.x, y - data.y)
      this.setData({
        // ...data,
        r: dist,
      })
    } else {
      return super.matchHandelMoveCallback(position, matchHandelInfo)
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

  getEditPropConfigData(data: SectorData): editItem[] {
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
