import { WallData } from "@/entities/wall/index.d";
import { EntityClass, MatchSnapPoint } from "./entity";
import { PointObjData, ObjInWallData, Point } from "./map2d";

interface NearestWallResult {
  wall: WallData
  lineIndex: number,
  pointOnWall: Point
  angle: number
}

export abstract class EntityClassInWall<T extends ObjInWallData> extends EntityClass<T> {
  // 待添加状态（鼠标新增悬浮的时候）
  setPrepareState(x: number, y: number, nearest: NearestWallResult) {
    const { pointOnWall, angle } = nearest
    const wallScreenX = pointOnWall.x
    const wallScreenY = pointOnWall.y

    const newData: ObjInWallData = {
      ...this.getData(),
      wallId: nearest.wall.id,
      wallPointId: nearest.lineIndex,
      x: wallScreenX,
      y: wallScreenY,
      angle,
    };
    // @ts-ignore
    this.setData(newData)
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      return true
    }
    return false
  }

  inSceneSnapLineArea(obj: EntityClass<PointObjData>, line: [Point, Point], point: Point) {
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
          entity.remove3DCache()
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
      this.remove3DCache()
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
          entity.remove3DCache()
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      this.remove3DCache()
      return true;
    }
  }
}