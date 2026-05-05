import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { CubeData } from './index.d'
import { allSnapFromType, EntityClass, MatchSnapPoint } from '@/types/entity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { CubeDataClass } from './dataClass'

export class CubeEntity extends EntityClass<CubeData> {
  type: string = 'cube'
  isPointObj: boolean = true

  defaultValue(): CubeData {
    const door: CubeData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      width: 110,
      height: 180,
      depth: 100,
      color: '#b1b1b1',
      mt: 3,
      angleY: 0,
    }
    return new CubeDataClass(door)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: CubeData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { width, depth, angleY } = data;

    // 绘制一个方块
    ctx.fillStyle = data.color
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.fillRect(
      width / -2 * zoomLevel,
      depth / -2 * zoomLevel,
      width * zoomLevel,
      depth * zoomLevel
    )
    ctx.restore(); // 恢复原始状态
  }

  private drawAngelLength = 40;

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: CubeData,
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

    const drawAngelLength = this.drawAngelLength;
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength
    const circleX = rotatedXAdd * zoomLevel + panOffset.x
    const circleY = rotatedYAdd * zoomLevel + panOffset.y
    const circleRadius = 5 * zoomLevel

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel + panOffset.x, tempY * zoomLevel + panOffset.y]
    }

    // 绘制双向箭头表示旋转角度
    ctx.strokeStyle = '#e67e22'
    ctx.fillStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    // 绘制双向箭头的主线（圆弧）
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, data.angleY * -1 - Math.PI / 4, data.angleY * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(data.angleY + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(data.angleY + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(data.angleY + Math.PI / 4, drawAngelLength - 5)
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
    const [p1X, p1Y] = ttt(data.angleY - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(data.angleY - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(data.angleY - Math.PI / 4, drawAngelLength - 5)
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
  }

  glbObj: THREE.Group | null = null;

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group()

    const { width, height, depth, color, mt, angleY } = data;

    // group添加门框
    const geometryRight = new THREE.BoxGeometry(
      width,
      height,
      depth
    );
    const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(1, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));
    const doorMeshRight = new THREE.Mesh(geometryRight, material)
    doorMeshRight.position.setY(data.height / 2)
    group.add(doorMeshRight);
    // group.position.set(data.x, data.height / 2, data.y)
    group.rotateY(angleY);
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
    const drawAngelLength = this.drawAngelLength
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    console.log('dist2', dist2)
    if (dist2 < 10) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: dist2,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
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

  setData(data: CubeData) {
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
        label: '长度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'depth',
        label: '宽度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 10,
        value: data.depth,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 10,
        value: data.height,
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
      {
        id: 'angleY',
        label: '旋转角度',
        dataType: 'number',
        min: -180,
        max: 180,
        step: 1,
        value: data.angleY,
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

  inSceneSnapLineArea(obj: EntityClass<CubeData>, line: [Point, Point]) {
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
