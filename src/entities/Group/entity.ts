import { GroupBaseEntity } from '@/types/GroupBaseEntity'
import { HandelInfo } from '@/types/map2d'
import { CubeData } from '../cube/index.d'
import editItem from '@/utils/editItem'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { MatchRectArea } from '@/utils/matchArea'
import { GroupBaseData } from '@/types/groupBase'

export const canvasHeight = 600
export const snapThreshold = 20
type WorldChangeType = 'add' | 'remove' | 'change'

export interface EnvironmentConfig {
  skyType: number
  ambientLightIntensity?: number
  showGround?: boolean
}

export class GroupEntity extends GroupBaseEntity {
  private circleRadius = 6

  constructor(parent: GroupBaseEntity | null, data: GroupBaseData) {
    super(parent, data)
    this.data = data;
    if (this.parentEntity) {
      // this.parentEntity.group.clear()
      this.parentEntity.group.add(this.group)
    }
  }

  change3DMeshState(): void {
    const data = this.getData();
    // console.trace('change3DMeshState-1', data.x, data.y, data.z)
    this.group.position.set(data.x, data.z, data.y)
    this.group.rotation.set(0, data.angleY, 0)

    this.children.forEach(item => {
      item.change3DMeshState()
    })
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
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
            this.markObjectIsDirty()
            this.reCreate3DMeshIfNeed()
          }, 1000)
          // if (this.parentEntity) {
          //   this.parentEntity._callObjDataChange(this)
          // }
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
    console.log('setPrepareState---' + this.getData().id, x, y)
    this.setData({
      ...this.getData(),
      x,
      y,
    })
    return [];
  }
}
