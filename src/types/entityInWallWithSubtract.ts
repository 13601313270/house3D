import * as THREE from 'three'
import { WallData } from "@/entities/wall/index.d";
import { PointEntityClass } from "./pointEntity";
import { ObjInWallData, Point, BaseObjData, ObjInWallWithSubtractData } from "./map2d";
import { BaseEntityClass, MatchSnapPoint } from "./baseEntity";
import getNearestWall from "@/utils/getNearestWall";
import { EntityInWall } from './entityInWall';

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
  abstract getSubtract(): {
    width: number,
    height: number,
    depth: number, // -1代表贯穿墙
  }
}