import * as THREE from 'three'
import { BaseEntityClass } from "@/types/baseEntity"
import { KeyTimePoint } from "./timelineManage"
import { BaseObjData } from "@/types/map2d"
import allPeopleAnimate from "./allPeopleAnimate"
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import getPeopleAnimateOneTime from './getPeopleAnimateOneTime'
// applyEasing：缓动函数（以左关键帧 easing 为准）
//  - linear：t
//  - easeIn：二次方进入（t²）
//  - easeOut：二次方退出（2t - t²）

const fbxLoader = new FBXLoader()
let mixer: THREE.AnimationMixer | null = null
let currentAction: THREE.AnimationAction | null = null

//  - easeInOut：前段 2t²，后段 2*(2-2t)*t -1
function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'easeIn': return t * t
    case 'easeOut': return t * (2 - t)
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    default: return t
  }
}

// evaluateTrack：对单个轨道 + 给定时间进行关键帧插值求值
//  - 0 个关键帧：null；1 个关键帧：直接取该值（无插值）
//  - 时间 < 首个 keyframe 或 > 最后 keyframe：返回 null（该轨道不生效）
//  - 其他：二分查找左右相邻 keyframe，根据 easing 计算 t，
async function evaluateTrack(entity: BaseEntityClass<BaseObjData>, trackType: string, keyTimePoints: KeyTimePoint[], time: number): Promise<null | number | any> {
  if (keyTimePoints.length === 0) {
    // console.log('evaluateTrack', 1)
    return null
  }
  if (keyTimePoints.length === 1) {
    const firstKeyframe = keyTimePoints[0]
    if (firstKeyframe.type === 'animation') {
      if (time < firstKeyframe.time) {
        // console.log('evaluateTrack', 2)
        return null
      } else if (time >= firstKeyframe.time + firstKeyframe.timeLength) {
        // console.log('evaluateTrack', 3)
        return null
      } else {
        const findAnimate = allPeopleAnimate.find((item) => item.key === firstKeyframe.value)
        if (!findAnimate) return null
        // 从动画里提取
        const { file } = findAnimate
        // console.log('evaluateTrack', 4)
        console.log('ffff', file)
      }
    } else {
      return firstKeyframe.value
    }
  }

  // console.log('evaluateTrack', 5)
  // 当时间在关键帧范围外时，返回 null 表示该 clip 不应在此时间段内生效
  if (time < keyTimePoints[0].time) return null
  const lastKeyframe = keyTimePoints[keyTimePoints.length - 1]
  if (lastKeyframe.type === 'animation') {
    if (time > lastKeyframe.time + lastKeyframe.timeLength) {
      alert(111)
      return null
    }
  } else {
    if (time > lastKeyframe.time) return null
  }

  // console.log('evaluateTrack', 6)
  // 如果在一个动画里，直接返回动画值
  for (let i = 0; i < keyTimePoints.length; i++) {
    const keyframe = keyTimePoints[i]
    if (keyframe.type === 'animation') {
      console.log('keyTimePoints', keyframe.time, time, keyframe.timeLength)
      if (time > keyframe.time && time <= keyframe.time + keyframe.timeLength) {
        const boneData = await getPeopleAnimateOneTime(keyframe, entity.meshList[0].children[0], time)
        return boneData;
      }
    }
  }
  return null;

  let leftIndex = 0
  let rightIndex = keyTimePoints.length - 1

  while (leftIndex < rightIndex - 1) {
    const midIndex = Math.floor((leftIndex + rightIndex) / 2)
    if (keyTimePoints[midIndex].time <= time) {
      leftIndex = midIndex
    } else {
      rightIndex = midIndex
    }
  }

  const leftKeyframe = keyTimePoints[leftIndex]
  const rightKeyframe = keyTimePoints[rightIndex]
  // console.log('左侧，右侧', trackType, keyTimePoints, leftKeyframe, rightKeyframe);

  const totalDuration = rightKeyframe.time - leftKeyframe.time
  let t = (time - leftKeyframe.time) / totalDuration

  if (leftKeyframe.easing) {
    t = applyEasing(t, leftKeyframe.easing)
  }
  return entity.editAnimationDataColumn(trackType, leftKeyframe.value, rightKeyframe.value, t)
  // return leftKeyframe.value + (rightKeyframe.value - leftKeyframe.value) * t
}

export default evaluateTrack