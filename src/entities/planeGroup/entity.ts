import { GroupBaseEntity } from '@/types/groupBase/entity'
import { HandelInfo, Point } from '@/types/map2d'
import { CubeData } from '../cube/index.d'
import editItem from '@/utils/editItem'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { MatchRectArea } from '@/utils/matchArea'
import { GroupBaseData } from '@/types/groupBase'
import { PlaneGroupData } from './index.d'

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

  draw2DPreviewByData(
    ctx: CanvasRenderingContext2D,
    data: GroupBaseData,
    panOffset: Point,
    zoomLevel: number,
  ) {
    const [width, height] = this.getSize()
    const screenX = data.x * zoomLevel + panOffset.x;// data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y;// data.y * zoomLevel + panOffset.y
    // console.log('setPrepareState---' + this.getData().id + '---preview', data.x, data.y)
    // 绘制一个方块
    ctx.fillStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(data.angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.strokeRect(
      width / -2 * zoomLevel,
      height / -2 * zoomLevel,
      width * zoomLevel,
      height * zoomLevel
    )
    ctx.restore(); // 恢复原始状态
    super.draw2DPreviewByData(ctx, data, panOffset, zoomLevel)
  }

  draw2DHandleByData(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number,
  ) {
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
    const [width, height] = this.getSize()

    const drawAngelLength = 100;// Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength
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

    // 绘制 轮廓
    const matchArea = new MatchRectArea({
      x: data.x,
      y: data.y,
      width,
      depth: height,
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

  change3DMeshState(): void {
    const data = this.getData();
    // console.trace('change3DMeshState-1', data.x, data.y, data.z)
    this.group.position.set(data.x, data.z, data.y)
    // console.trace('change3DMeshState-angleY', data.angleY)
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
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            z: 0,
            angleY: data.angleY,
            color: 'red',
            mt: null,
            width: 30,
            height: 30,
            depth: 30,
          }
          this.add('cube', [cubeData])
          setTimeout(() => {
            this.reCreate3DMeshIfNeed()
            this.change3DMeshState()
            this.changeBoundingBoxState()
            close()
          }, 0)
          // if (this.parentEntity) {
          //   this.parentEntity._callObjDataChange(this)
          // }
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
    const [width, height, depth] = this.getSize()
    const data = this.getData();
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: Math.max(width, height),
      depth: Math.max(width, height),
      angleY: data.angleY * -1,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width: Math.max(width, height),
        depth: Math.max(width, height),
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
