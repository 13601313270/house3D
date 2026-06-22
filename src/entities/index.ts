import { BaseObjData } from '@/types/map2d'
import wallPlugin from './wall'
import windowPlugin from './window'
import doorPlugin from './door'
import doorwayPlugin from './doorway'
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
import staircasePlugin from './staircase'
import signPlugin from './sign'
import { BaseEntityClass } from '@/types/baseEntity'
import { World } from '@/utils/world'

export type EntityConstructor = new (world: World, data?: BaseObjData) => BaseEntityClass<any>;
export type enumItem = {
  id: number,
  name: string,
  img: string,
}

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
    id: 'house',
    name: '户型/墙体',
    child: []
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

export const allFileKeysObjType: Record<string, 'point' | 'polyline'> = {
};

([
  wallPlugin,
  doorPlugin,
  doorwayPlugin,
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
  staircasePlugin,
  signPlugin,
].forEach(v => {
  allFileKeys.push(v.key)
  if (v.type === 'base') {
    allFileKeysGroup[0].child.push(v.key)
  } else if (v.type === 'curtain') {
    allFileKeysGroup[1].child.push(v.key)
  } else if (v.type === 'house') {
    allFileKeysGroup[2].child.push(v.key)
  } else if (v.type === 'other') {
    allFileKeysGroup[3].child.push(v.key)
  }
  allFileKeysName[v.key] = v.name
  fileDataKeyToClass[v.key] = v.entity
  allFileKeysObjType[v.key] = v.objType
}))

export type fileData = {
  [key in string]?: BaseObjData[]
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
} | {
  id: string,
  label: string,
  dataType: 'cornerType',
  value: number,
  panelDesc?: string,
} | {
  id: string,
  label: string,
  dataType: 'enum',
  value: number,
  panelDesc?: string,
  enumList: Array<enumItem>,
} | {
  id: string,
  label: string,
  dataType: 'stitchImage',
  value: Array<any>,
  imgData: string,
}