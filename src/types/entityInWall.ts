import * as THREE from 'three'
import { WallData } from "@/entities/wall/index.d";
import { PointEntityClass } from "./pointEntity";
import { ObjInWallData, Point, BaseObjData } from "./map2d";
import { BaseEntityClass, MatchSnapPoint } from "./baseEntity";
import getNearestWall from "@/utils/getNearestWall";

// x/y 平面拖动面用的移动图标纹理（全实体共享，避免重复加载）
const movePlaneTexture = new THREE.TextureLoader().load('/icons/move.png')
movePlaneTexture.colorSpace = THREE.SRGBColorSpace

export interface NearestWallResult {
  wallEntity: BaseEntityClass<WallData>
  wall: WallData
  lineIndex: number,
  pointOnWall: Point
  angle: number
}

export abstract class EntityInWall<T extends ObjInWallData> extends PointEntityClass<T> {
  getHandelList(): Array<'+x' | '-x' | '+y' | '-y' | '+z' | 'xy'> {
    return ['+z']
  }

  // 本对象进入一个吸附点的区域
  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      return true
    }
    return false
  }

  setData(data: Partial<T>) {
    super.setData(data)
  }

  inSceneSnapLineArea(obj: BaseEntityClass<BaseObjData>, line: [Point, Point], point: Point) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      const data = this.getData();
      const objData = obj.getData()
      this.setData({
        ...data,
        x: point.x,
        y: point.y,
        angle: nearestAngle,
        wallId: objData.id,
        wallPointId: index,
      })
      // 双向去除原有的关联对象
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.associationEntity.splice(entity.associationEntity.indexOf(this), 1)
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      if (!this.associationEntity.includes(obj)) {
        this.associationEntity.push(obj)
      }
      if (!obj.associationEntity.includes(this)) {
        obj.associationEntity.push(this)
      }
      // this.associationEntity.forEach(entity => {
      //   if (entity.associationEntity.includes(this)) {
      //     // 双向规定原有的关联对象dirty
      //     entity.associationEntity.forEach(associationEntity => {
      //       if (associationEntity.associationEntity.includes(entity)) {
      //         associationEntity.markObjectIsDirty()
      //         associationEntity.reCreate3DMeshAnd2DPreviewIfNeed()
      //         associationEntity.change3DMeshState()
      //       }
      //     })
      //   }
      // });
      this.reCreate3DMeshAnd2DPreviewIfNeed();
      // this.associationEntity.forEach(entity => {
      //   if (entity.associationEntity.includes(this)) {
      //     entity.change3DMeshState()
      //   }
      // });
      this.change3DMeshState()
      return true;
    }
    return false;
  }

  notInSceneSnapLineArea() {
    const data = this.getData();
    if (data.wallId) {
      const data = this.getData();
      this.setData({
        ...data,
        wallId: undefined,
        wallPointId: -1,
      })

      // 双向去除原有的关联对象
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.associationEntity.splice(entity.associationEntity.indexOf(this), 1)
          // entity.markObjectIsDirty()
          // entity.setData({})// 如果不加这一行。一个墙上两个门，移动一个，另一个会消失
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      // this.markObjectIsDirty()
      return true;
    }
  }

  getDataMeta(): { [key: string]: string } {
    return {
      ...super.getDataMeta(),
      wallId: '所属墙',
      wallPointId: '门在墙上的点的索引',
      bottom: '距离地面',
      angle: '旋转角度',
    }
  }

  canEditAnimationDataColumn(): string[] {
    return [
      ...super.canEditAnimationDataColumn(),
      'bottom',
      'angle',
    ];
  }
}