import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { PlaneData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { PlaneDataClass } from './dataClass'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';
import { MatchRectArea } from '@/utils/matchArea';
import { importImgFileHead } from '../allObjs';
import { allSnapFromType } from '@/types/baseEntity';

export class PlaneEntity extends PointEntityClass<PlaneData> {
  name: string = '平面'
  type: string = 'plane'
  isPointObj: boolean = true
  private circleRadius = 6
  private static textureLoader = new THREE.TextureLoader();
  private static textureCache = new Map<string | File, THREE.Texture>();

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: PlaneData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { width, length } = data;
    const angleY = data.angleY || 0;// 历史数据问题

    // 绘制一个方块
    ctx.fillStyle = data.color
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.fillRect(
      width / -2 * zoomLevel,
      length / -2 * zoomLevel,
      width * zoomLevel,
      length * zoomLevel
    )
    ctx.restore(); // 恢复原始状态
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: PlaneData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const drawAngelLength = Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // alert(drawAngelLength)
    // console.log('drawAngelLength', angleY, drawAngelLength)
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
      width: data.width,
      depth: data.length,
      angleY: data.angleY,
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

    const { width, length, color, mt, img } = data;
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值

    let material: THREE.Material | null = null;
    // 平面
    if (img) {
      let texture = PlaneEntity.textureCache.get(img);
      if (!texture) {
        if (img.startsWith(importImgFileHead)) {
          const findImportFile = this.world.allImportImgs.find(item => item.fileTypeId === img);
          if (findImportFile) {
            const imgFile: File = findImportFile.file as File;
            const objectUrl = URL.createObjectURL(imgFile);
            texture = PlaneEntity.textureLoader.load(objectUrl);
            texture.flipY = false;
            PlaneEntity.textureCache.set(img, texture);
          }
        } else {
          texture = PlaneEntity.textureLoader.load(img);
          texture.flipY = false;
          PlaneEntity.textureCache.set(img, texture);
        }
      }
      material = new THREE.MeshStandardMaterial({
        map: texture,
        color: '#ffffff',
        transparent: true,
        alphaTest: 0.1,
      });
    } else {
      const materialById = mt ? getMaterialById(mt) : null;
      if (mt && materialById) {
        material = materialById.material(new THREE.Vector3(1, 1, 0))
      } else {
        material = (new THREE.MeshStandardMaterial({ color }));
      }
    }
    const plane = new THREE.PlaneGeometry(width, length)
    const planeMesh = new THREE.Mesh(plane, material)
    planeMesh.rotation.x = -Math.PI / 2
    group.add(planeMesh)
    group.rotateY(angleY);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, length, angleY } = this.getData();
    return [
      new THREE.Vector3(width, 1, length),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    // const dist = Math.hypot(x - data.x, y - data.y)
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: Math.max(data.width, data.length),
      depth: Math.max(data.width, data.length),
      angleY: angleY * -1,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width: data.width,
        depth: data.length,
        angleY,
      })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const drawAngelLength = Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
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
        label: '材质',
        dataType: 'material',
        value: data.mt,
      },
      {
        id: 'img',
        label: '图片',
        dataType: 'img',
        value: data.img || '',
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'angleY',
        label: '旋转角度',
        dataType: 'angle',
        min: -180,
        max: 180,
        value: data.angleY,
      },
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
