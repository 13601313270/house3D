import { BaseEntityClass } from "@/types/baseEntity"
import { KeyTimePoint } from "./timelineManage"
import { BaseObjData } from "@/types/map2d"
// applyEasing：缓动函数（以左关键帧 easing 为准）
//  - linear：t
//  - easeIn：二次方进入（t²）
//  - easeOut：二次方退出（2t - t²）

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
function evaluateTrack(entity: BaseEntityClass<BaseObjData>, trackType: string, keyTimePoints: KeyTimePoint[], time: number): null | number {
  if (keyTimePoints.length === 0) return null
  if (keyTimePoints.length === 1) return keyTimePoints[0].value

  // 当时间在关键帧范围外时，返回 null 表示该 clip 不应在此时间段内生效
  if (time < keyTimePoints[0].time) return null
  if (time > keyTimePoints[keyTimePoints.length - 1].time) return null

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
  console.log('左侧，右侧', trackType, keyTimePoints, leftKeyframe, rightKeyframe);

  const totalDuration = rightKeyframe.time - leftKeyframe.time
  let t = (time - leftKeyframe.time) / totalDuration

  if (leftKeyframe.easing) {
    t = applyEasing(t, leftKeyframe.easing)
  }
  return entity.editAnimationDataColumn(trackType, leftKeyframe.value, rightKeyframe.value, t)
  // return leftKeyframe.value + (rightKeyframe.value - leftKeyframe.value) * t
}

export default evaluateTrack