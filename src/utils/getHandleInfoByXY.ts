import { allFileKeys } from "@/entities";
import { BaseEntityClass } from "@/types/baseEntity";
import { BaseObjData, HandelInfo, Point } from "@/types/map2d";
import { MatchCircleArea, MatchRectArea } from "./matchArea";
import { LineEntityClass } from "@/types/lineEntity";

export function getHandleInfoByXY(x: number, y: number): {
  classInfo: BaseEntityClass<BaseObjData>
  handle: HandelInfo,
  startPoint: Point,
  dist: number,
} | null {
  let minDistance = Infinity
  let matchHandelInfoList: {
    classInfo: BaseEntityClass<any>
    handle: HandelInfo,
    startPoint: Point,
    dist: number,
  } | null = null
  for (let i = 0; i < allFileKeys.length; i++) {
    const key = allFileKeys[i];
    if (!window.worldApi.allFileMapObjects[key]) {
      continue
    }
    for (let j = 0; j < window.worldApi.getObjects(key).length; j++) {
      const api: BaseEntityClass<any> = window.worldApi.allFileMapObjects[key][j] as BaseEntityClass<any>;
      const matchInfo = api.matchHandelInfo(x, y)
      if (matchInfo) {
        if (matchInfo.dist < minDistance) {
          matchHandelInfoList = {
            classInfo: api,
            handle: matchInfo,
            startPoint: { x, y },
            dist: matchInfo.dist,
          }
          minDistance = matchInfo.dist
        }
      }
    }
  }
  return matchHandelInfoList;
}

export function getHandleInAreaInfoByXY(x: number, y: number): {
  classInfo: BaseEntityClass<any>,
  matchArea: MatchRectArea | MatchCircleArea,
  dist: number,
} | null {
  let minDistance = Infinity
  let matchHandelInfoList: {
    classInfo: BaseEntityClass<any>,
    matchArea: MatchRectArea | MatchCircleArea
    dist: number,
  } | null = null
  for (let i = 0; i < allFileKeys.length; i++) {
    const key = allFileKeys[i];
    if (!window.worldApi.allFileMapObjects[key]) {
      continue
    }
    for (let j = 0; j < window.worldApi.getObjects(key).length; j++) {
      const api: BaseEntityClass<any> = window.worldApi.allFileMapObjects[key][j] as BaseEntityClass<any>;
      if (api.getData().isLocked) continue
      const matchInfo = api.showMatchHandel(x, y)
      if (matchInfo) {
        const data = api.getData();
        let dist: number;
        if (api instanceof LineEntityClass) {
          dist = Infinity;// 线段没有距离概念，命中点对象优先级更高。
        } else {
          dist = Math.hypot(x - data.x || 0, y - data.y || 0)
        }
        if (dist < minDistance || minDistance === Infinity) {
          matchHandelInfoList = {
            classInfo: api,
            matchArea: matchInfo,
            dist,
          }
          minDistance = dist
        }
      }
    }
  }
  return matchHandelInfoList
}