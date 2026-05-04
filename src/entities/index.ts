import { WallEntity } from './wall/entity'
import { DoorEntity } from './door/entity'
import { WindowEntity } from './window/entity'
import { CameraEntity } from './camera/entity'
import { OutFileEntity } from './outFile/entity'
import { CubeEntity } from './cube/entity'
import { EntityClass } from '@/types/entity'
import { ObjData } from '@/types/map2d'

export type EntityType = 'wall' | 'door' | 'window' | 'camera' | 'outFile' | 'cube'
export const allFileKeys: EntityType[] = ['wall', 'door', 'window', 'camera', 'cube', 'outFile']

export const allFileKeysName: Record<EntityType, string> = {
  wall: '墙体',
  door: '门',
  window: '窗户',
  camera: '相机',
  cube: '方块',
  outFile: '外部文件',
}

export type fileData = {
  [key in EntityType]?: ObjData[]
}

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

export const fileDataKeyToClass: Record<EntityType, EntityConstructor> = {
  wall: WallEntity,
  door: DoorEntity,
  window: WindowEntity,
  camera: CameraEntity,
  cube: CubeEntity,
  outFile: OutFileEntity,
}

export type editItem = {
  id: string,
  label: string,
  dataType: 'string' | 'poiListAndLineCircle' | 'poiListAndLine' | 'poiList' | 'color' | 'boolean' | 'mesh' | 'area' | 'material' | string[]/* 枚举 */
  value: any
} | {
  id: string,
  label: string,
  dataType: 'number',
  min: number,
  max: number,
  step: number,
  value: any
}
