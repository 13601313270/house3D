import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { SignData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { SignDataClass } from './dataClass'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';
import { MatchRectArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';

import { loadImage as globalLoadImage } from '@/utils/imageCache'

export class SignEntity extends PointEntityClass<SignData> {
  name: string = '交通标识'
  type: string = 'sign'
  isPointObj: boolean = true
  private circleRadius = 6

  defaultValue(): SignData {
    const data: SignData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      angleY: 0,
      width: 80,
      height: 80,
      signZ: 100,
      poleRadius: 5,
      bgColor: '#ffffff',
      img: {
        value: [],
        viewImg: '',
      },
    }
    return new SignDataClass(data)
  }

  async init() {
    await super.init()
    const { img } = this.getData();
    const { viewImg } = img;
    if (viewImg) {
      await globalLoadImage(viewImg);
    }
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: SignData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { width } = data;
    const { angleY } = data;
    const length = 10;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(angleY * -1);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(
      width / -2 * zoomLevel,
      length / -2 * zoomLevel,
      width * zoomLevel,
      length * zoomLevel
    );

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2 * zoomLevel;
    ctx.strokeRect(
      width / -2 * zoomLevel,
      length / -2 * zoomLevel,
      width * zoomLevel,
      length * zoomLevel
    );

    ctx.restore();
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: SignData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    const { width } = data;
    const length = 10 + 4;

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const drawAngelLength = Math.max(width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angleY) * drawAngelLength
    const circleX = rotatedXAdd * zoomLevel + panOffset.x
    const circleY = rotatedYAdd * zoomLevel + panOffset.y
    const circleRadius = this.circleRadius * zoomLevel + 3

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel + panOffset.x, tempY * zoomLevel + panOffset.y]
    }

    // 绘制双向箭头表示旋转角度
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    // 绘制双向箭头的主线（圆弧）
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, angleY * -1 - Math.PI / 4, angleY * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(angleY + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(angleY + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(angleY + Math.PI / 4, drawAngelLength - 5)
      ctx.moveTo(
        p1X,
        p1Y
      )
      ctx.lineTo(p2X, p2Y)
      ctx.lineTo(p3X, p3Y)
      ctx.closePath()
      ctx.fill()
    })();

    // 右侧箭头
    ctx.beginPath()
    const [p1X, p1Y] = ttt(angleY - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(angleY - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(angleY - Math.PI / 4, drawAngelLength - 5)
    ctx.moveTo(
      p1X,
      p1Y
    )
    ctx.lineTo(p2X, p2Y)
    ctx.lineTo(p3X, p3Y)
    ctx.closePath()
    ctx.fill()
    // 绘制旋转角度线
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制 轮廓
    const matchArea = new MatchRectArea({
      x: data.x,
      y: data.y,
      width,
      depth: length,
      angleY,
    })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      matchArea.data.x * zoomLevel + panOffset.x,
      matchArea.data.y * zoomLevel + panOffset.y
    ); // 移动原点到目标中心
    ctx.rotate(matchArea.data.angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.strokeRect(
      matchArea.data.width / -2 * zoomLevel,
      matchArea.data.depth / -2 * zoomLevel,
      matchArea.data.width * zoomLevel,
      matchArea.data.depth * zoomLevel,
    )
    ctx.restore(); // 恢复原始状态
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()
    const { width, height, signZ, img, poleRadius, bgColor } = data;
    const { viewImg } = img
    const angleY = data.angleY || 0;

    const poleHeight = signZ + height;

    const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 32);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: bgColor });
    const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.setY(poleHeight / 2);
    group.add(poleMesh);

    const thickness = 0.3;
    const imageMaterial = new THREE.MeshStandardMaterial({
      color: bgColor,
      map: new THREE.TextureLoader().load(viewImg)
    });
    const sideMaterial = new THREE.MeshStandardMaterial({ color: bgColor });

    const materials = [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      viewImg ? imageMaterial : sideMaterial,
      sideMaterial
    ];

    const box = new THREE.BoxGeometry(width, height, thickness)
    const boxMesh = new THREE.Mesh(box, materials)
    boxMesh.position.setY(poleHeight - height / 2);
    boxMesh.position.setZ(poleRadius + thickness / 2 + 2);
    group.add(boxMesh)
    group.rotateY(angleY);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { angleY, width } = this.getData();
    const length = 10 + 4;

    return [
      new THREE.Vector3(width, 1, length),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { width, angleY } = data;
    const length = 10 + 4;
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: Math.max(width, length),
      depth: Math.max(width, length),
      angleY: angleY * -1,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width,
        depth: length,
        angleY,
      })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    const { width } = data;
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const drawAngelLength = Math.max(width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angleY) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    // console.log('dist2', dist2)
    if (dist2 < this.circleRadius + 3) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: dist2,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y } = position
    if (matchHandelInfo.index === 0) {
      this.changePosition({ x, y })
    } else if (matchHandelInfo.index === 1) {
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      console.log(angleY)
      this.setData({
        ...this.getData(),
        angleY: angleY * -1,
      })
    }
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
        id: 'img',
        label: '图片',
        dataType: 'stitchImage',
        value: data.img,
        dataTypeList: ['roadSigns', 'text'],
      },
      {
        id: 'bgColor',
        label: '文字',
        dataType: 'color',
        value: data.bgColor,
      },
      {
        id: 'width',
        label: '牌子宽度',
        dataType: 'number',
        min: 20,
        max: 500,
        step: 1,
        value: data.width,
        unit: 'cm',
      },
      {
        id: 'height',
        label: '牌子高度',
        dataType: 'number',
        min: 20,
        max: 500,
        step: 1,
        value: data.height,
        unit: 'cm',
      },
      {
        id: 'signZ',
        label: '牌子离地高度',
        dataType: 'number',
        min: 0,
        max: 500,
        step: 1,
        value: data.signZ,
        unit: 'cm',
      },
      {
        id: 'poleRadius',
        label: '柱子半径',
        dataType: 'number',
        min: 1,
        max: 50,
        step: 1,
        value: data.poleRadius,
        unit: 'cm',
      },
      {
        id: 'z',
        label: '距离地面高度',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
        unit: 'cm',
      },
    ], async (val) => {
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
