import { Door } from './door/index.d'
import { Wall } from './wall/index.d'
import { Window } from './window/index.d'
import { CameraData } from './camera/index.d'
import { WallEntity, editPropConfig as wallEditPropConfig } from './wall'
import { DoorEntity, createDoorData, editPropConfig as doorEditPropConfig } from './door'
import { WindowEntity, createWindowData, editPropConfig as windowEditPropConfig } from './window'
import { CameraEntity, editPropConfig as cameraEditPropConfig, createCameraData } from './camera'
import { EntityClass } from '@/types/entity'

export type allFileKeysEnum = 'wall' | 'door' | 'window' | 'camera';
export const allFileKeys: allFileKeysEnum[] = ['wall', 'door', 'window', 'camera']

export type fileData = {
  wall: Wall[],
  door: Door[],
  window: Window[],
  camera: CameraData[],
}

export const defaultFileData: () => fileData = () => {
  return {
    wall: [],
    door: [],
    window: [],
    camera: [],
  }
}

export const fileDataKeyToClass: Record<allFileKeysEnum, typeof EntityClass<any>> = {
  wall: WallEntity,
  door: DoorEntity,
  window: WindowEntity,
  camera: CameraEntity,
}

export type editItem = {
  id: string,
  label: string,
  dataType: 'number' | 'poiListAndLineCircle' | 'poiListAndLine' | 'poiList' | 'color' | 'boolean' | 'mesh' | 'area' | 'material' | string[]/* 枚举 */
}

export const PropConfigMap: Record<allFileKeysEnum, () => editItem[]> = {
  wall: wallEditPropConfig,
  door: doorEditPropConfig,
  window: windowEditPropConfig,
  camera: cameraEditPropConfig,
}

export const createInitData: Record<allFileKeysEnum, () => any> = {
  wall: createWallData,
  door: createDoorData,
  window: createWindowData,
  camera: createCameraData,
}

function createWallData() {
  throw new Error('Function not implemented.')
}
