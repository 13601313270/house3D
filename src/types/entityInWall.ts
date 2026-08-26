import { WallData } from "@/entities/wall/index.d";
import { PointEntityClass } from "./pointEntity";
import { ObjInWallData, Point, BaseObjData } from "./map2d";
import { BaseEntityClass, MatchSnapPoint } from "./baseEntity";
import getNearestWall from "@/utils/getNearestWall";

export interface NearestWallResult {
  wallEntity: BaseEntityClass<WallData>
  wall: WallData
  lineIndex: number,
  pointOnWall: Point
  angle: number
}

export abstract class EntityClassInWall<T extends ObjInWallData> extends PointEntityClass<T> {
  // 待添加状态（鼠标新增悬浮的时候）
  setPrepareState(x: number, y: number): string[] {
    if (!this.parentEntity) {
      return []
    }
    const nearest = getNearestWall(this.parentEntity, { x, y })
    // console.log('nearest', this.parentEntity, nearest)
    if (nearest) {
      const { pointOnWall, angle } = nearest
      const wallScreenX = pointOnWall.x
      const wallScreenY = pointOnWall.y

      this.setData({
        ...this.getData(),
        wallId: nearest.wall.id,
        wallPointId: nearest.lineIndex,
        x: wallScreenX,
        y: wallScreenY,
        angle,
      })

      // 双向去除原有的关联对象
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.associationEntity.splice(entity.associationEntity.indexOf(this), 1)
          entity.markObjectIsDirty()
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      if (!this.associationEntity.includes(nearest.wallEntity)) {
        this.associationEntity.push(nearest.wallEntity)
      }
      if (!nearest.wallEntity.associationEntity.includes(this)) {
        nearest.wallEntity.associationEntity.push(this)
      }
      this.markObjectIsDirty()

      return [];
    } else {
      const newData: T = {
        ...this.getData(),
        x,
        y,
      };
      this.setData(newData)
      return [
        '请放置在墙上'
      ];
    }
  }

  // 本对象进入一个吸附点的区域
  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      return true
    }
    return false
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
          entity.markObjectIsDirty()
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
      this.markObjectIsDirty()
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.reCreate3DMeshAnd2DPreviewIfNeed()
          entity.setData({})// 如果不加这一行。一个墙上两个门，移动一个，另一个会消失
        }
      });
      this.reCreate3DMeshAnd2DPreviewIfNeed();
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.change3DMeshState()
        }
      });
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
          entity.markObjectIsDirty()
          entity.setData({})// 如果不加这一行。一个墙上两个门，移动一个，另一个会消失
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      this.markObjectIsDirty()
      return true;
    }
  }
}