import { EntityConstructor } from '@/types/baseEntity'
import { Group } from '@/entities/group/entity'
import PluginType from './pluginType'
import { BaseObjData } from '@/types/map2d'
import wallPlugin from './wall'
import windowPlugin from './window'
import doorPlugin from './door'
import doorwayPlugin from './doorway'
import cameraPlugin from './camera'
import directionCameraPlugin from './directionCamera'
import cubePlugin from './cube'
import spherePlugin from './sphere'
import outFilePlugin from './outFile'
import outFileInWallPlugin from './outFileInWall'
import cylinderPlugin from './cylinder'
import planePlugin from './plane'
import circlePlanePlugin from './circlePlane'
import curtainPlugin from './curtain'
import conePlugin from './cone'
import peoplePlugin from './people'
import importFilePlugin from './importFile'
import curtainInWallPlugin from './curtainInWall'
import staircasePlugin from './staircase'
import signPlugin from './sign'
import sectorPlugin from './sector'
import sectorPlanePlugin from './sectorPlane'
import polygonPlanePlugin from './polygonPlane'
import polygonPlugin from './polygon'
import regularPolygonPlugin from './regularPolygon'
import regularPolygon2Plugin from './regularPolygon2'
import torusPlugin from './torus'

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
    id: 'camera',
    name: '相机',
    child: []
  },
  {
    id: 'other',
    name: '其他类型',
    child: [],
  }
]

export const allFileWithGroupId: { [key in string]: PluginType[] } = {

}

export const allFileKeysName: Record<string, string> = {
}

export const fileDataKeyToClass: Record<string, EntityConstructor> = {
};

export const allFileKeysObjType: Record<string, 'point' | 'polyline'> = {
};

export const allPluginByKey: Record<string, PluginType> = {
};

([
  wallPlugin,
  doorPlugin,
  doorwayPlugin,
  windowPlugin,
  cameraPlugin,
  directionCameraPlugin,
  cubePlugin,
  spherePlugin,
  cylinderPlugin,
  conePlugin,
  planePlugin,
  circlePlanePlugin,
  curtainPlugin,
  outFilePlugin,
  outFileInWallPlugin,
  peoplePlugin,
  importFilePlugin,
  curtainInWallPlugin,
  staircasePlugin,
  signPlugin,
  sectorPlugin,
  sectorPlanePlugin,
  polygonPlanePlugin,
  polygonPlugin,
  regularPolygonPlugin,
  regularPolygon2Plugin,
  torusPlugin,
].forEach(v => {
  allPluginByKey[v.key] = v
  allFileKeys.push(v.key)
  if (v.type === 'base') {
    allFileKeysGroup[0].child.push(v.key)
  } else if (v.type === 'curtain') {
    allFileKeysGroup[1].child.push(v.key)
  } else if (v.type === 'house') {
    allFileKeysGroup[2].child.push(v.key)
  } else if (v.type === 'camera') {
    allFileKeysGroup[3].child.push(v.key)
  } else if (v.type === 'other') {
    allFileKeysGroup[4].child.push(v.key)
  } else if (typeof v.type === 'number') {
    if (!allFileWithGroupId[v.type]) {
      allFileWithGroupId[v.type] = []
    }
    allFileWithGroupId[v.type].push(v)
  }
  allFileKeysName[v.key] = v.name
  fileDataKeyToClass[v.key] = v.entity
  allFileKeysObjType[v.key] = v.objType
}))

export type fileData = {
  [key in string]?: BaseObjData[]
}
