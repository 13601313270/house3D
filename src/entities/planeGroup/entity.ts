import * as THREE from 'three'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { HandelInfo } from '@/types/map2d'
import { CubeData } from '../cube/index.d'
import editItem from '@/utils/editItem'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { MatchRectArea } from '@/utils/matchArea'
import { PlaneGroupData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { angelIcon, moveIcon } from '@/utils/handleImgs'

export class PlaneGroupEntity extends GroupBaseEntity<PlaneGroupData> {
  type: string = 'planeGroup'
  name: string = '组'
  // width: number = 0;
  // height: number = 0;
  private circleRadius = 12
  public isSetGlobalEditingGroup = false

  constructor(parent: GroupBaseEntity<PlaneGroupData> | null, data: PlaneGroupData) {
    super(parent, data)
    if (this.parentEntity) {
      // this.parentEntity.group.clear()
      this.parentEntity.group.add(this.group)
    }
  }

  draw2DPreview(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ) {
    if (!this.boundingBoxData) return
    const data = this.getData();
    if (this.isSetGlobalEditingGroup) {
      // 绘制一个全屏黑色
      // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      // ctx.fillRect(-ctx.canvas.width, -ctx.canvas.height, ctx.canvas.width * 2, ctx.canvas.height * 2);
      // 绘制一个边界
      if (!this.boundingBoxData) return
      const [size, offset, angle] = this.boundingBoxData;
      (() => {
        const screenX = data.x * zoomLevel;
        const screenY = data.y * zoomLevel;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'white';
        ctx.save();
        ctx.translate(screenX + offset.x * zoomLevel, screenY + offset.z * zoomLevel); // 移动原点到目标中心
        ctx.rotate(angle.y * -1); // 围绕新原点旋转

        (() => {
          // 绘制背景
          ctx.beginPath();
          ctx.rect(-10000, -10000, 20000, 20000);
          ctx.moveTo((size.x / -2) * zoomLevel + size.x * zoomLevel, (size.z / -2) * zoomLevel); // 从右上角开始
          ctx.lineTo((size.x / -2) * zoomLevel, (size.z / -2) * zoomLevel);              // 到左上
          ctx.lineTo((size.x / -2) * zoomLevel, (size.z / -2) * zoomLevel + size.z * zoomLevel); // 到左下
          ctx.lineTo((size.x / -2) * zoomLevel + size.x * zoomLevel, (size.z / -2) * zoomLevel + size.z * zoomLevel); // 到右下
          ctx.closePath(); // 回到右上角（逆时针）
          ctx.clip('evenodd');
          ctx.fillStyle = 'rgba(0, 0, 0, 0.61)'; // 半透明红色
          ctx.fillRect(-10000, -10000, 20000, 20000);
        })();
        ctx.lineWidth = 2;
        ctx.strokeRect(
          (size.x / -2) * zoomLevel,
          (size.z / -2) * zoomLevel,
          size.x * zoomLevel,
          size.z * zoomLevel
        );
        ctx.restore();
      })();
    }
    // console.log('boundingBoxData=====', this.boundingBoxData)
    (() => {
      const screenX = data.x * zoomLevel;
      const screenY = data.y * zoomLevel;
      ctx.strokeStyle = '#929292ff'
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
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel;
    const iconWidth = this.circleRadius * 2 * zoomLevel * 0.8;
    const [size, offset, angle] = this.boundingBoxData;
    (() => {
      const screenX = data.x * zoomLevel;
      const screenY = data.y * zoomLevel;
      ctx.strokeStyle = 'red';
      ctx.save();
      ctx.translate(screenX + offset.x * zoomLevel, screenY + offset.z * zoomLevel); // 移动原点到目标中心
      ctx.rotate(angle.y * -1); // 围绕新原点旋转
      // 绘制一个方块
      ctx.strokeRect(
        (size.x / -2) * zoomLevel,
        (size.z / -2) * zoomLevel,
        size.x * zoomLevel,
        size.z * zoomLevel
      );
      ctx.restore();
    })();

    // 绘制一个坐标轴
    (() => {
      const tarXLength = data.width / 2;
      const rotatedXAdd = Math.cos(data.angleY) * tarXLength * zoomLevel
      const rotatedYAdd = -Math.sin(data.angleY) * tarXLength * zoomLevel
      ctx.strokeStyle = 'rgba(152, 0, 0, 1)'
      ctx.beginPath()
      ctx.moveTo(screenX - rotatedXAdd, screenY - rotatedYAdd)
      ctx.lineTo(screenX + rotatedXAdd, screenY + rotatedYAdd)
      ctx.closePath()
      ctx.stroke()

      const tarYLength = data.height / 2;
      const rotatedX2Add = Math.cos(data.angleY - Math.PI / 2) * tarYLength * zoomLevel
      const rotatedY2Add = -Math.sin(data.angleY - Math.PI / 2) * tarYLength * zoomLevel
      ctx.strokeStyle = 'rgba(0, 92, 0, 1)'
      ctx.beginPath()
      ctx.moveTo(screenX - rotatedX2Add, screenY - rotatedY2Add)
      ctx.lineTo(screenX + rotatedX2Add, screenY + rotatedY2Add)
      ctx.stroke()
    })();

    // 控制点
    (() => {
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke();
      ctx.drawImage(moveIcon, screenX - iconWidth / 2, screenY - iconWidth / 2, iconWidth, iconWidth);
    })();

    if (!this.boundingBoxData) return
    const drawAngelLength = data.width / 2 - this.circleRadius;
    // 控制点向着angleY角度延伸10个单位后的坐标

    // 绘制旋转角度控制
    if (zoomLevel > 0.5) {
      const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
      const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength
      const circleX = rotatedXAdd * zoomLevel
      const circleY = rotatedYAdd * zoomLevel
      ctx.fillStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeStyle = 'black'
      ctx.save();
      ctx.translate(circleX, circleY); // 移动原点到目标中心
      ctx.rotate(angle.y * -1); // 围绕新原点旋转
      ctx.beginPath()
      ctx.arc(0, 0, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.drawImage(angelIcon, -iconWidth / 2, -iconWidth / 2, iconWidth, iconWidth);
      ctx.restore();
    }
  }

  change3DMeshState(): void {
    const data = this.getData();
    this.group.position.set(data.x, data.z, data.y)
    this.group.rotation.set(0, data.angleY, 0)

    this.children.forEach(item => {
      item.change3DMeshState()
    })
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null {
    const { width, height, angleY } = this.getData()

    let minZ = 0
    let maxZ = 0
    if (this.children) {
      this.children.forEach(item => {
        if (item instanceof PointEntityClass && item.boundingBoxData) {
          const { z } = item.getData()
          // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
          const boxData = item.boundingBoxData;
          if (boxData) {
            minZ = Math.min(minZ, z)
            maxZ = Math.max(maxZ, z + boxData[0].y)
          }
        }
      })
    }
    const depth = Math.max(maxZ - minZ, 10);
    // console.log('boxbox', minZ, maxZ, depth)
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    return [
      new THREE.Vector3(width, depth, height),
      new THREE.Vector3(
        0,
        minZ + depth / 2,
        0
      ),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  editPropConfig(
    snapPoint: HandelInfo,
    editShow: (editInfoList: editItem[], callback: (val: any) => void) => void,
    close: () => void
  ): void {
    const data = this.getData();
    editShow([
      {
        id: 'name',
        label: '组名称',
        dataType: 'string',
        value: data.name,
      },
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        value: data.width,
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        value: data.height,
        min: 1,
        max: 1000,
        step: 1,
      },
    ], (val) => {
      this.setData({
        // ...data,
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
      angleY: data.angleY,
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
    const drawAngelLength = data.width / 2 - this.circleRadius;
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
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
        // ...this.getData(),
        x,
        y,
      })
    } else if (matchHandelInfo.index === 1) {
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      this.setData({
        // ...this.getData(),
        angleY: angleY * -1,
      })
    }
  }

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      // ...this.getData(),
      x,
      y,
    })
    return [];
  }
}
