import { GroupBaseEntity } from '@/types/groupBase/entity'
import { HandelInfo, Point } from '@/types/map2d'
import { CubeData } from '../cube/index.d'
import editItem from '@/utils/editItem'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { MatchRectArea } from '@/utils/matchArea'
import { GroupBaseData } from '@/types/groupBase'
import { PlaneGroupData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'

export class PlaneGroupEntity extends GroupBaseEntity<PlaneGroupData> {
  type: string = 'planeGroup'
  name: string = '平面组'
  private circleRadius = 6

  constructor(parent: GroupBaseEntity<GroupBaseData> | null, data: PlaneGroupData) {
    super(parent, data)
    this.data = data;
    if (this.parentEntity) {
      // this.parentEntity.group.clear()
      this.parentEntity.group.add(this.group)
    }
  }

  draw2DPreview(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ) {
    // console.log('boundingBoxData=====', this.boundingBoxData)
    if (!this.boundingBoxData) return
    const data = this.getData();
    (() => {
      const screenX = data.x * zoomLevel;
      const screenY = data.y * zoomLevel;
      ctx.strokeStyle = '#333'
      const [size, offset] = this.boundingBoxData
      ctx.save(); // 保存当前状态
      ctx.translate(screenX + offset.x * zoomLevel, screenY + offset.z * zoomLevel); // 移动原点到目标中心
      ctx.rotate(data.angleY * -1); // 围绕新原点旋转
      // 绘制一个范围方块
      ctx.strokeRect(
        (size.x / -2) * zoomLevel,
        (size.z / -2) * zoomLevel,
        size.x * zoomLevel,
        size.z * zoomLevel
      )
      ctx.restore(); // 恢复原始状态
    })();

    super.draw2DPreview(ctx, zoomLevel)
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ) {
    ctx.lineWidth = 2
    if (!this.boundingBoxData) return
    const data = this.getData();
    (() => {
      const screenX = data.x * zoomLevel;
      const screenY = data.y * zoomLevel;
      ctx.strokeStyle = 'red';
      const [size, offset, angle] = this.boundingBoxData
      ctx.save(); // 保存当前状态
      ctx.translate(screenX + offset.x * zoomLevel, screenY + offset.z * zoomLevel); // 移动原点到目标中心
      ctx.rotate(angle.y * -1); // 围绕新原点旋转
      // 绘制一个方块
      ctx.strokeRect(
        (size.x / -2) * zoomLevel,
        (size.z / -2) * zoomLevel,
        size.x * zoomLevel,
        size.z * zoomLevel
      )
      ctx.restore(); // 恢复原始状态
    })();

    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (!this.boundingBoxData) return
    const [size] = this.boundingBoxData
    const { x: width, z: height } = size
    const drawAngelLength = 100;// Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength
    const circleX = rotatedXAdd * zoomLevel
    const circleY = rotatedYAdd * zoomLevel
    const circleRadius = this.circleRadius * zoomLevel + 3

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel, tempY * zoomLevel]
    }

    // 绘制双向箭头表示旋转角度
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
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
    (() => {
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
    })();

    // 绘制旋转角度控制
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  change3DMeshState(): void {
    const data = this.getData();
    this.group.position.set(data.x, data.z, data.y)
    this.group.rotation.set(0, data.angleY, 0)

    this.children.forEach(item => {
      item.change3DMeshState()
    })
  }

  editPropConfig(
    snapPoint: HandelInfo,
    editShow: (editInfoList: editItem[], callback: (val: any) => void) => void,
    close: () => void
  ): void {
    const data = this.getData();
    editShow([
      {
        id: '增加对象',
        label: '增加对象',
        dataType: 'button',
        value: () => {
          const cubeData: CubeData = {
            id: Date.now().toString(),
            x: Math.random() * 300 - 150,
            y: Math.random() * 600 - 300,
            z: 0,
            angleY: data.angleY,
            color: 'red',
            mt: null,
            width: 30,
            height: 30,
            depth: 30,
          }
          this.add('cube', [cubeData])
          close()
        }
      },
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }

  showMatchHandel(x: number, y: number) {
    if (!this.boundingBoxData) return null
    const [size, offset] = this.boundingBoxData
    const { x: width, z: height } = size
    const data = this.getData();
    const xx = data.x + offset.x;
    const yy = data.y + offset.z;
    if (isPointInRotatedRect(x, y, {
      x: xx,
      y: yy,
      width,
      depth: height,
      angleY: data.angleY * -1,
    })) {
      return new MatchRectArea({
        x: xx,
        y: yy,
        width,
        depth: height,
        angleY: data.angleY,
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
    const drawAngelLength = 100;// Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

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
      this.setData({
        ...this.getData(),
        x,
        y,
      })
    } else if (matchHandelInfo.index === 1) {
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      this.setData({
        ...this.getData(),
        angleY: angleY * -1,
      })
    }
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
