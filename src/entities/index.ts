import { DoorData } from './door/index.d'
import { WallData } from './wall/index.d'
import { WindowData } from './window/index.d'
import { CameraData } from './camera/index.d'
import { OutFileData } from './outFile/index.d'
import { WallEntity } from './wall'
import { DoorEntity } from './door'
import { WindowEntity } from './window'
import { CameraEntity } from './camera'
import { OutFileEntity } from './outFile/index'
import { CubeEntity } from './cube'
import { EntityClass, EntityType } from '@/types/entity'
import { CubeData } from './cube/index.d'

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
  wall: WallData[],
  door: DoorData[],
  window: WindowData[],
  camera: CameraData[],
  cube: CubeData[],
  outFile: OutFileData[],
}

export const defaultFileData: () => fileData = () => {
  return {
    wall: [],
    door: [],
    window: [],
    camera: [],
    cube: [],
    outFile: [],
  }
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
