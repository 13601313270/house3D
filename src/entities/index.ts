import { EntityClass } from '@/types/entity'
import { ObjData } from '@/types/map2d'
import wallPlugin from './wall'
import windowPlugin from './window'
import doorPlugin from './door'
import cameraPlugin from './camera'
import cubePlugin from './cube'
import spherePlugin from './sphere'
import outFilePlugin from './outFile'
import outFileInWallPlugin from './outFileInWall'
import cylinderPlugin from './cylinder'
import planePlugin from './plane'
import curtainPlugin from './curtain'
import conePlugin from './cone'
import peoplePlugin from './people'
import importFilePlugin from './importFile'
import curtainInWallPlugin from './curtainInWall'

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

export const allFileKeys: string[] = [
]
type TypeGroup = Array<{
  id: string,
  name: string,
  child: string[]
}>;
export const allFileKeysGroup: TypeGroup = [
  {
    id: 'base',
    name: '基础对象',
    child: []
  },
  {
    id: 'curtain',
    name: '幕布/图片',
    child: [],
  },
  {
    id: 'other',
    name: '其他类型',
    child: [],
  }
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
  conePlugin,
  planePlugin,
  curtainPlugin,
  outFilePlugin,
  outFileInWallPlugin,
  peoplePlugin,
  importFilePlugin,
  curtainInWallPlugin,
].forEach(v => {
  allFileKeys.push(v.key)
  if (v.type === 'base') {
    allFileKeysGroup[0].child.push(v.key)
  } else if (v.type === 'curtain') {
    allFileKeysGroup[1].child.push(v.key)
  } else {
    allFileKeysGroup[2].child.push(v.key)
  }
  allFileKeysName[v.key] = v.name
  fileDataKeyToClass[v.key] = v.entity
}))

export type fileData = {
  [key in string]?: ObjData[]
}

export type editItem = {
  id: string,
  label: string,
  dataType: 'string' |
  'poiListAndLineCircle' |
  'poiListAndLine' |
  'poiList' |
  'color' |
  'boolean' |
  'mesh' |
  'area' |
  'material' |
  'hidden' |
  'img' |
  'button' | /* 按钮 */
  string[]/* 枚举 */
  value: any
} | {
  id: string,
  label: string,
  dataType: 'number',
  min: number,
  max: number,
  step: number,
  value: number
  unit?: string
} | {
  id: string,
  label: string,
  dataType: 'title', /* 一个标题，纯展示使用 */
}
