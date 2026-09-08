import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { WallData } from "@/entities/wall/index.d";
import { PointEntityClass } from "./pointEntity";
import { ObjInWallData, Point, BaseObjData, ObjInWallWithSubtractData } from "./map2d";
import { BaseEntityClass, MatchSnapPoint } from "./baseEntity";
import getNearestWall from "@/utils/getNearestWall";
import { EntityInWall } from './entityInWall';
import { WallEntity } from '@/entities/wall/entity';
import { GroupBaseEntity } from './groupBase/entity';
import { GroupBaseData } from './groupBase';

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

export abstract class EntityInWallWithSubtract<T extends ObjInWallWithSubtractData> extends EntityInWall<T> {
  constructor(world: GroupBaseEntity<GroupBaseData>, data: T) {
    super(world, data)
    if (data && data.wallId && this.parentEntity) {
      const wall = this.parentEntity.getTypeListEntity('wall').find((entity) => entity.getData().id === data.wallId);
      if (wall && wall instanceof WallEntity) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
        wall.bindEntityInWallWithSubtractChanged()
      }
    }
  }

  abstract getSubtract(): {
    width: number,
    height: number,
    depth: number, // -1代表贯穿墙
  }

  setData(data: Partial<T>) {
    const lastData = { ...this.getData(), ...data }
    super.setData(data)

    let wallThickness = 10;
    let wall: WallEntity | null = null;
    if (this.parentEntity) {
      wall = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === lastData.wallId
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    if (wall) {
      wall.bindEntityInWallWithSubtractChanged()
    }
  }

  subWall() {
    return
    // const data = this.getData();
    // let wallThickness = 10;
    // let wall: WallEntity | null = null;
    // if (this.parentEntity) {
    //   wall = this.parentEntity.getTypeListEntity('wall').find((entity) => {
    //     return entity.getData().id === data.wallId
    //   }) as WallEntity
    //   wallThickness = wall ? wall.getData().thickness : 10;
    // }
    // if (!wall) return

    // const boxLength = wall.meshGroup.children.filter(v => 'isWall' in v).length;
    // const countPerPoint = wall.getData().points.length === 2 ? 1 : ((boxLength - 1) / (wall.getData().points.length - 2))
    // const wallGroup = wall.meshGroup.children[data.wallPointId * countPerPoint];

    // const { width, height, depth } = this.getSubtract()
    // const subtractGeometry = new THREE.BoxGeometry(
    //   width,
    //   height,
    //   depth === -1 ? wallThickness + 10 : depth
    // );
    // subtractGeometry.rotateY(data.angle * -1);
    // const cylinderBrush = new Brush(subtractGeometry);
    // cylinderBrush.position.set(data.x, height / 2 + (data.bottom || 0) + data.z, data.y)
    // cylinderBrush.updateMatrixWorld()
    // const firstMesh = wallGroup.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh;
    // const boxBrush = new Brush(firstMesh.geometry.clone());// 主体
    // boxBrush.position.set(
    //   wallGroup.position.x,
    //   wallGroup.position.y,
    //   wallGroup.position.z
    // )
    // // 3. 执行布尔运算 (立方体减去圆柱体)
    // const evaluator = new Evaluator();
    // // 注意：这里 SUBTRACTION 的顺序很重要：主体减去洞模型
    // const resultGeometry = evaluator.evaluate(boxBrush, cylinderBrush, SUBTRACTION);
    // if (firstMesh) {
    //   firstMesh.geometry = resultGeometry.geometry
    // }
  }
}