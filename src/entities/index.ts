import { EntityClass } from '@/types/entity'
import { ObjData } from '@/types/map2d'
import wallPlugin from './wall'
import windowPlugin from './window'
import doorPlugin from './door'
import cameraPlugin from './camera'
import cubePlugin from './cube'
import spherePlugin from './sphere'
import outFilePlugin from './outFile'
import cylinderPlugin from './cylinder'

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

export const allFileKeys: string[] = [
]

export const allFileKeysName: Record<string, string> = {
}

export const fileDataKeyToClass: Record<string, EntityConstructor> = {
};

([
  wallPlugin,
  doorPlugin,
  windowPlugin,
  cameraPlugin,
  cubePlugin,
  spherePlugin,
  cylinderPlugin,
  outFilePlugin,
].forEach(v => {
  allFileKeys.push(v.key)
  allFileKeysName[v.key] = v.name
  fileDataKeyToClass[v.key] = v.entity
}))

export type fileData = {
  [key in string]?: ObjData[]
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
