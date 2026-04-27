import { DoorData } from './door/index.d'
import { WallData } from './wall/index.d'
import { WindowData } from './window/index.d'
import { CameraData } from './camera/index.d'
import { OutFileData } from './outFile/index.d'
import { WallDataClass, WallEntity, editPropConfig as wallEditPropConfig } from './wall'
import { DoorEntity, createDoorData, editPropConfig as doorEditPropConfig } from './door'
import { WindowEntity, createWindowData, editPropConfig as windowEditPropConfig } from './window'
import { CameraEntity, editPropConfig as cameraEditPropConfig, createCameraData } from './camera'
import { OutFileEntity, editPropConfig as outFileEditPropConfig, createOutFileData } from './outFile/index'
import { EntityClass } from '@/types/entity'
import { ObjData } from '@/types'

export type allFileKeysEnum = 'wall' | 'door' | 'window' | 'camera' | 'outFile';
export const allFileKeys: allFileKeysEnum[] = ['wall', 'door', 'window', 'camera', 'outFile']

export const allFileKeysName: Record<allFileKeysEnum, string> = {
  wall: '墙体',
  door: '门',
  window: '窗户',
  camera: '相机',
  outFile: '外部文件',
}

export type fileData = {
  wall: WallData[],
  door: DoorData[],
  window: WindowData[],
  camera: CameraData[],
  outFile: OutFileData[],
}

export const defaultFileData: () => fileData = () => {
  return {
    wall: [],
    door: [],
    window: [],
    camera: [],
    outFile: [],
  }
}

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

export const fileDataKeyToClass: Record<allFileKeysEnum, EntityConstructor> = {
  wall: WallEntity,
  door: DoorEntity,
  window: WindowEntity,
  camera: CameraEntity,
  outFile: OutFileEntity,
}

export type editItem = {
  id: string,
  label: string,
  dataType: 'string' | 'poiListAndLineCircle' | 'poiListAndLine' | 'poiList' | 'color' | 'boolean' | 'mesh' | 'area' | 'material' | string[]/* 枚举 */
} | {
  id: string,
  label: string,
  dataType: 'number',
  min: number,
  max: number,
  step: number,
} | {
  id: string,
  label: string,
  dataType: 'array',
  children: editItem[][],
}

export const PropConfigMap: Record<allFileKeysEnum, (obj: EntityClass<any>) => editItem[]> = {
  wall: wallEditPropConfig,
  door: doorEditPropConfig,
  window: windowEditPropConfig,
  camera: cameraEditPropConfig,
  outFile: outFileEditPropConfig,
}

export const createInitData: Record<allFileKeysEnum, () => any> = {
  wall: createWallData,
  door: createDoorData,
  window: createWindowData,
  camera: createCameraData,
  outFile: createOutFileData,
}

function createWallData(): WallDataClass {
  const wall: WallData = {
    id: Date.now().toString(),
    walls: [],
    x: 0,
    y: 0,
    z: 0,
    height: 180,
    color: '#e67e22',
    thickness: 10,
    points: [],
    wmt: 0,
    hb: false,
    bc: '#000',
    bmt: 0,
    ht: false,
    tc: '#000',
    tmt: 0,
    td: false,
  }
  return new WallDataClass(wall)
}
