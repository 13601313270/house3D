import { BaseEntityClass } from "@/types/baseEntity"
import { KeyTimePoint } from "./timelineManage"
import { BaseObjData } from "@/types/map2d"
import allPeopleAnimate from "./allPeopleAnimate"
import getPeopleAnimateOneTime from './getPeopleAnimateOneTime'

// evaluateTrack：对单个轨道 + 给定时间进行关键帧插值求值
//  - 0 个关键帧：null；1 个关键帧：直接取该值（无插值）
//  - 时间 < 首个 keyframe 或 > 最后 keyframe：返回 null（该轨道不生效）
//  - 其他：二分查找左右相邻 keyframe，根据 easing 计算 t，
async function evaluateTrack(entity: BaseEntityClass<BaseObjData>, trackType: string, keyTimePoints: KeyTimePoint[], time: number): Promise<null | number | any> {
  if (keyTimePoints.length === 0) {
    return null
  }
  if (keyTimePoints.length === 1) {
    const firstKeyframe = keyTimePoints[0]
    if (firstKeyframe.type === 'animation') {
      if (time < firstKeyframe.time) {
        return null
      } else if (time >= firstKeyframe.time + firstKeyframe.timeLength) {
        return null
      } else {
        const findAnimate = allPeopleAnimate.find((item) => item.key === firstKeyframe.value)
        if (!findAnimate) return null
        // 从动画里提取
        const { file } = findAnimate
        console.log('ffff', file)
      }
    } else {
      return firstKeyframe.value
    }
  }

  // 当时间在关键帧范围外时，返回 null 表示该 clip 不应在此时间段内生效
  if (time < keyTimePoints[0].time) {
    // console.log('evaluateTrack', 5)
    return null
  }
  const lastKeyframe = keyTimePoints[keyTimePoints.length - 1]
  if (lastKeyframe.type === 'animation') {
    if (time > lastKeyframe.time + lastKeyframe.timeLength) {
      alert(111)
      return null
    }
  } else {
    if (time > lastKeyframe.time) return null
  }
  // 如果在一个动画里，直接返回动画值
  for (let i = 0; i < keyTimePoints.length; i++) {
    const keyframe = keyTimePoints[i]
    if (keyframe.type === 'animation') {
      // console.log('keyTimePoints', keyframe.time, time, keyframe.timeLength)
      if (time >= keyframe.time && time <= keyframe.time + keyframe.timeLength) {
        const boneData = await getPeopleAnimateOneTime(keyframe, entity, time)
        return boneData;
      }
    }
  }

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
  let leftValue: any = leftKeyframe.value;
  if (leftKeyframe.type === 'animation') {
    leftValue = await getPeopleAnimateOneTime(leftKeyframe, entity, leftKeyframe.time + leftKeyframe.timeLength);
  }
  const rightKeyframe = keyTimePoints[rightIndex]

  let rightValue: any = rightKeyframe.value;
  if (rightKeyframe.type === 'animation') {
    rightValue = await getPeopleAnimateOneTime(rightKeyframe, entity, rightKeyframe.time);
  }
  // console.log('左侧，右侧', trackType, keyTimePoints, leftValue, rightValue);
  let leftEndTime = leftKeyframe.time;
  if (leftKeyframe.type === 'animation') {
    leftEndTime = leftKeyframe.time + leftKeyframe.timeLength
  }
  const totalDuration = rightKeyframe.time - leftEndTime
  const t = (time - leftEndTime) / totalDuration
  // console.log('在一个动画里', time, t)
  return entity.editAnimationDataColumn(trackType, leftValue, rightValue, t)
}

export default evaluateTrack