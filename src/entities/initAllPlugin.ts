import { allFileKeys, allFileKeysGroup, allFileKeysName, allFileKeysObjType, allFileWithGroupId, allPluginByKey, fileDataKeyToClass } from './index'

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
import groupPlugin from './planeGroup'
import PluginType from './pluginType'

function loadItem(v: PluginType) {
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
}
export default function () {
  [
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
  ].forEach(loadItem);
  // 加载group插件，放在最后
  [
    groupPlugin
  ].forEach(loadItem)
}
