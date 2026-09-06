import * as THREE from 'three'
import allPeopleAnimate from "./allPeopleAnimate";
import { KeyTimeAnimation } from "./timelineManage";
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { getBoneFilter } from './peopleBones';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import { BaseEntityClass } from '@/types/baseEntity';
import { BaseObjData } from '@/types/map2d';
const fbxLoader = new FBXLoader()

const mixerMap: Map<THREE.Object3D, {
  [key in string]: Promise<{
    mixer: THREE.AnimationMixer,
    duration: number,
    currentAction: THREE.AnimationAction,
  }>
}> = new Map()

function getPeopleAnimateOneTime(keyframe: KeyTimeAnimation, people: BaseEntityClass<BaseObjData>, time: number): Promise<Array<{
  name: string;
  basicValue: {
    x: number,
    y: number,
    z: number,
    px: number,
    py: number,
    pz: number,
  },
  value: {
    x: number,
    y: number,
    z: number,
    px: number,
    py: number,
    pz: number,
  }
}>> {
  const peopleModel = clone(people.meshGroup.children[0])
  const { applyScope } = keyframe
  const findAnimate = allPeopleAnimate.find((item) => item.key === keyframe.value)
  const { file } = findAnimate!
  if (!mixerMap.get(peopleModel)) {
    mixerMap.set(peopleModel, {})
  }
  if (mixerMap.get(peopleModel) && !(mixerMap.get(peopleModel)![file])) {
    mixerMap.get(peopleModel)![file] = new Promise<{
      mixer: THREE.AnimationMixer,
      currentAction: THREE.AnimationAction,
      duration: number,
    }>((resolve) => {
      fbxLoader.load('./pose/' + file, (fbxScene: any) => {
        if (fbxScene.animations && fbxScene.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(peopleModel)
          const clip = fbxScene.animations[0]
          const currentAction = mixer.clipAction(clip)
          resolve({
            mixer,
            duration: clip.duration,
            currentAction,
          })
        }
      })
    })
  }
  return new Promise(resolve => {
    mixerMap.get(peopleModel)![file].then((info) => {
      info.currentAction.stop();
      info.currentAction.play()
      info.currentAction.time = (time - keyframe.time) % info.duration;
      info.currentAction.enabled = true;// 必须启用 action，即使它没有在播放
      info.mixer.update(0);// 关键：用 update(0) 强制立即刷新一

      const filterBones = getBoneFilter(applyScope)
      // 提取骨骼数据
      const boneData: {
        name: string;
        basicValue: {
          x: number,
          y: number,
          z: number,
          px: number,
          py: number,
          pz: number,
        },
        value: {
          x: number,
          y: number,
          z: number,
          px: number,
          py: number,
          pz: number,
        }
      }[] = [];
      peopleModel.traverse((child) => {
        // @ts-ignore
        if (child.isBone) {
          if (filterBones.includes(child.name)) {
            boneData.push({
              name: child.name,
              basicValue: {
                x: child.rotation.x,
                y: child.rotation.y,
                z: child.rotation.z,
                px: child.position.x,
                py: child.position.y,
                pz: child.position.z,
              },
              value: {
                x: child.rotation.x,
                y: child.rotation.y,
                z: child.rotation.z,
                px: child.position.x,
                py: child.position.y,
                pz: child.position.z,
              }
            });
          }
        }
      });
      resolve(boneData)
    })
  })
}
export default getPeopleAnimateOneTime
