import { HandelInfo, PointCanAngleObjData } from "./map2d";
import { PointEntityClass } from "./pointEntity";
import { angelIcon, moveIcon } from '@/utils/handleImgs'

// 可以旋转的点对象
export abstract class PointCanAngleEntity<T extends PointCanAngleObjData> extends PointEntityClass<T> {
  protected baseDrawAngelLength = 40;

  private getStartDownAngelY(): { angel: number, length: number, circleRadius: number, } {
    if (!this.boundingBoxData) {
      return {
        angel: 0,
        length: this.baseDrawAngelLength,
        circleRadius: this.circleRadius_,
      }
    }
    let drawAngelLength = this.baseDrawAngelLength;
    const [size, offset] = this.boundingBoxData
    if (size.x >= size.z) {
      // if (offset.x > 0) {
      //   this.startDownAngelY = 0;
      // } else {
      //   this.startDownAngelY = Math.PI;
      // }
      this.startDownAngelY = 0;
      drawAngelLength = size.x / 2 + offset.x;
    } else {
      // if (offset.z > 0) {
      //   this.startDownAngelY = Math.PI / 2;
      // } else {
      //   this.startDownAngelY = -Math.PI / 2;
      // }
      this.startDownAngelY = Math.PI / 2;
      drawAngelLength = size.z / 2 + offset.z;
    }
    return {
      angel: this.startDownAngelY,
      length: drawAngelLength * 0.9,
      circleRadius: drawAngelLength / 10,
    };
  }

  draw2DActionHandle(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    super.draw2DActionHandle(ctx, zoomLevel)
    // 旋转控制点
    const data = this.getData();
    if (!this.boundingBoxData) return
    const angelHandelInfo = this.getStartDownAngelY()
    const imgAngel = data.angleY + (angelHandelInfo.angel || 0);
    console.log('basicSize.x', imgAngel)
    // 绘制旋转角度控制
    const circleRadius = angelHandelInfo.circleRadius * zoomLevel + 3;
    const drawAngelLength = angelHandelInfo.length;
    const rotatedXAdd = data.x + Math.cos(imgAngel) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(imgAngel) * drawAngelLength
    const circleX = rotatedXAdd * zoomLevel
    const circleY = rotatedYAdd * zoomLevel
    const imgSize = circleRadius * 1.5;
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeStyle = 'black'
    ctx.save();
    ctx.translate(circleX, circleY); // 移动原点到目标中心
    ctx.rotate(imgAngel * -1); // 围绕新原点旋转
    ctx.beginPath()
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.drawImage(angelIcon, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
    ctx.restore();
  }

  private startDownAngelY = 0;

  matchHandelInfo(x: number, y: number) {
    const parentHandle = super.matchHandelInfo(x, y)
    if (parentHandle) {
      return parentHandle
    }
    if (!this.boundingBoxData) return null
    const data = this.getData();
    const angelHandelInfo = this.getStartDownAngelY();
    const imgAngel = data.angleY + (angelHandelInfo?.angel || 0);
    const drawAngelLength = angelHandelInfo.length;

    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(imgAngel) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(imgAngel) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    // console.log('dist2', dist2)
    if (dist2 < angelHandelInfo.circleRadius) {
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
    if (matchHandelInfo.index === 1) {
      const { x, y } = position
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      const downAngelY = this.startDownAngelY || 0;
      this.setData({
        angleY: (angleY + downAngelY) * -1,
      } as Partial<T>)
    }
    return super.matchHandelMoveCallback(position, matchHandelInfo)
  }
}