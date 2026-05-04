import { EntityClass } from '@/types/entity'
import { ObjData } from '@/types/map2d'
import wallPlugin from './wall'
import windowPlugin from './window'
import doorPlugin from './door'
import cameraPlugin from './camera'
import cubePlugin from './cube'
import outFilePlugin from './outFile'

export type EntityType = 'wall' | 'door' | 'window' | 'camera' | 'outFile' | 'cube'
export const allFileKeys: EntityType[] = [
  wallPlugin.key,
  doorPlugin.key,
  windowPlugin.key,
  cameraPlugin.key,
  cubePlugin.key,
  outFilePlugin.key,
]

export const allFileKeysName: Record<EntityType, string> = {
  wall: wallPlugin.name,
  door: doorPlugin.name,
  window: windowPlugin.name,
  camera: cameraPlugin.name,
  cube: cubePlugin.name,
  outFile: outFilePlugin.name,
}

export type fileData = {
  [key in EntityType]?: ObjData[]
}

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

export const fileDataKeyToClass: Record<EntityType, EntityConstructor> = {
  wall: wallPlugin.entity,
  door: doorPlugin.entity,
  window: windowPlugin.entity,
  camera: cameraPlugin.entity,
  cube: cubePlugin.entity,
  outFile: outFilePlugin.entity,
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
