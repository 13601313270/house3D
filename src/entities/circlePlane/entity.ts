import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { CirclePlaneData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchCircleArea } from '@/utils/matchArea';
import { importImgFileHead } from '../allObjs';
import { allSnapFromType } from '@/types/baseEntity';

export class CirclePlaneEntity extends PointEntityClass<CirclePlaneData> {
  name: string = '圆形平面'
  type: string = 'circlePlane'
  private circleRadius = 6
  private static textureLoader = new THREE.TextureLoader();
  private static textureCache = new Map<string | File, THREE.Texture>();

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { r } = data;
    const screenX = data.x * zoomLevel;
    const screenY = data.y * zoomLevel;

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
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const data = this.getData();
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

    const drawAngelLength = Math.max(this.getData().r / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const angleY = data.angleY
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
    (() => {
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
    })();
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { color, mt, r, ds, img, angleY } = data;

    const geometry = new THREE.CircleGeometry(r, 32);
    let material: THREE.Material | null = null;

    if (img) {
      let texture = CirclePlaneEntity.textureCache.get(img);
      if (!texture) {
        if (img.startsWith(importImgFileHead)) {
          const findImportFile = window.worldState.allImportImgs.find(item => item.fileTypeId === img);
          if (findImportFile) {
            const imgFile: File = findImportFile.file as File;
            const objectUrl = URL.createObjectURL(imgFile);
            texture = CirclePlaneEntity.textureLoader.load(objectUrl);
            texture.flipY = false;
            CirclePlaneEntity.textureCache.set(img, texture);
          }
        } else {
          texture = CirclePlaneEntity.textureLoader.load(img);
          texture.flipY = false;
          CirclePlaneEntity.textureCache.set(img, texture);
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
        material = materialById.material(new THREE.Vector3(0, 1, 0))
      } else {
        material = (new THREE.MeshStandardMaterial({ color }));
      }
    }

    if (material && ds) {
      material.side = THREE.DoubleSide;
    }
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    group.add(mesh);
    group.rotateY(angleY);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r } = this.getData();
    return [
      new THREE.Vector3(r * 2, 0, r * 2),
      new THREE.Vector3(0, 0, 0),
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
    const drawAngelLength = Math.max(this.getData().r / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const angleY = data.angleY
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
        id: 'ds',
        label: '是否双面可见',
        dataType: 'boolean',
        value: data.ds,
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

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
    return [];
  }
}
