import * as THREE from 'three'
import { HandelInfo } from '@/types/map2d'
import { BoneStepItem, PeopleData, PeopleModelType } from './index.d'
import { editItem } from '@/utils/editItem'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { GroupBaseData } from '@/types/groupBase'
import { ModelFileEntity } from '@/types/modelFileEntity'
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'

// 静态缓存：key=模型类型或 URL，value=已加载的 FBX 根对象
const modelCache: Record<string, THREE.Group | THREE.Mesh | null> = {
  man: null,
  woman: null,
}
// 模型类型 → FBX 路径映射
const modelPathMap: Record<PeopleModelType, string> = {
  man: './ManClean.fbx',
  woman: './WomanClean.fbx',
}

export class PeopleEntity extends ModelFileEntity<PeopleData> {
  type: string = 'people'
  drawAngelLength: number = 40
  mesh: THREE.Group | THREE.Mesh | null = null
  img: HTMLImageElement = new Image()
  imgBeCreateByScale: number = 1; // 这个图片是以哪个缩放比例创建的

  constructor(world: GroupBaseEntity<GroupBaseData> | null, data: PeopleData) {
    // 由于历史代码问题，早期版本people对象的旋转用的是angle，后面全部可旋转对象，统一改叫angleY
    if ('angle' in data && !('angleY' in data)) {
      // @ts-ignore
      data.angleY = data.angle as number
      // @ts-ignore
      delete data.angle
    }
    if (data.scale === undefined) {
      data.scale = 1;
    }
    if (data.modelType === undefined) {
      data.modelType = 'man';
    }
    super(world, data)
  }

  /**
   * 按需加载模型，带静态缓存。
   * 根据 URL 扩展名自动选择 FBXLoader 或 GLTFLoader。
   * @param source 模型类型（'man' | 'woman'）或任意 FBX/GLB URL
   */
  private loadModel(source: PeopleModelType | string): Promise<THREE.Group | THREE.Mesh> {
    const url = source in modelPathMap ? modelPathMap[source as PeopleModelType] : source
    if (modelCache[source]) {
      return Promise.resolve(modelCache[source]!)
    }
    const isGLB = /\.(glb|gltf)$/i.test(url)
    return new Promise((resolve, reject) => {
      const onError = (err: Error) => {
        console.error(`加载 ${url} 失败`, err)
        reject(err)
      }
      if (isGLB) {
        const loader = new GLTFLoader()
        loader.load(
          url,
          (gltf: any) => {
            modelCache[source] = gltf.scene
            console.log('aaaa-a', gltf.scene, gltf.scene.scale)
            gltf.scene.children[0].scale.setX(180)
            gltf.scene.children[0].scale.setY(180)
            gltf.scene.children[0].scale.setZ(180)
            console.log('aaaa-a', gltf.scene, gltf.scene.scale)
            // gltf.scene.scale = 10;
            resolve(gltf.scene)
          },
          undefined,
          onError
        )
      } else {
        const loader = new FBXLoader()
        loader.load(
          url,
          (fbxModel: THREE.Group) => {
            modelCache[source] = fbxModel
            console.log('aaaa-b', fbxModel)
            resolve(fbxModel)
          },
          undefined,
          // @ts-ignore
          onError
        )
      }
    })
  }

  async init(): Promise<void> {
    const modelType = this.getData().modelType || 'man'
    this.mesh = await this.loadModel(modelType)
    await this.initBasicBoxDataAnd2DPreview()
  }

  create3DMesh(): THREE.Group {
    const data = this.getData();
    const group = new THREE.Group()
    const { color } = data
    if (!this.mesh) {
      console.error('未找到对应的文件类型:')
      return group
    }
    // 先 clone，避免修改共享缓存对象
    const threeObject = clone(this.mesh) as THREE.Group
    const boneListConfig = data.bone || [];
    threeObject.traverse((child: any) => {
      if (child.isBone) {
        const findProp = boneListConfig.find((item) => item.name === child.name)
        if (!findProp) { return; }

        let newRX = findProp.value.x;
        let newRY = findProp.value.y;
        let newRZ = findProp.value.z;
        if (findProp?.name === "mixamorigRightArm") {
          console.log('findProp-2', child.rotation.x, findProp.value.x)
          console.log('findProp-2', child.rotation.y, findProp.value.y)
          console.log('findProp-2', child.rotation.z, findProp.value.z)
        }
        if (data.modelType?.startsWith('https://')) {
          if (findProp?.name === "mixamorigRightShoulder") {
            newRX -= 3.14;
            newRZ -= 0.2;
          } else if (findProp?.name === "mixamorigRightArm") {
            newRX += 3.0;
            newRY -= 0.2;
            newRZ -= 2.7;
            newRZ *= -1
            // newRX = child.rotation.x;
            // newRY = child.rotation.y;
            // newRZ = child.rotation.z;
          } else if (findProp?.name === "mixamorigRightForeArm") {
            // newRY = 0;
            // newRZ += 0.5;
            // newRZ = Math.PI / -2;
            // newRZ = 0;
            console.log('findProp-2222', newRZ, child.rotation.z)
            // newRZ += 0.5;
            // return;
          } else if (findProp?.name === "mixamorigSpine") {
            newRY += 1.48;
            // newRZ += 3.14 * 3;
          } else if (findProp?.name === "mixamorigHips") {
            newRX += 1.4;
            newRY -= 3.14 / 2;
            return;
          } else {
            return;
          }
        } else {
          if (findProp?.name === "mixamorigRightArm") {
            // newRX = child.rotation.x;
            // newRZ += 0.5;
            // newRY = 0;
            // newRZ = Math.PI / -2;
            console.log('findProp-2222', newRZ, child.rotation.z)
            // newRZ += 0.5;
            // return;
          }
        }
        child.rotation.set(newRX, newRY, newRZ)
      }
    });
    // 设置人物颜色
    threeObject.traverse((child: any) => {
      if (child.isMesh) {
        child.material.color.set(color)
      }
    })
    group.add(threeObject)
    this.reBuildBoundingBoxData();
    return group
  }

  // 当前对象是否需要重新生成3D模型状态
  create3DUnionKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      height: undefined,
      angleY: undefined,
      bone: undefined,
    }

    return JSON.stringify(cacheData)
  }

  change3DMeshState(): void {
    const data = this.getData();
    const { height, angleY } = data
    const scale = height / 180;// height的180的时候scale为1
    this.meshGroup.position.set(data.x, data.z, data.y)
    this.meshGroup.rotation.set(0, angleY, 0)
    this.meshGroup.scale.set(scale, scale, scale)

    if (this.meshGroup?.children[0] && data.bone && data.bone?.length > 0) {
      const boneListConfig = data.bone
      if (boneListConfig && typeof boneListConfig !== 'string') {
        // this.meshGroup?.children[0].traverse((child: any) => {
        //   if (child.isBone) {
        //     const findProp = boneListConfig.find((item) => item.name === child.name)
        //     if (findProp) {
        //       // console.log(`🦴 发现骨骼-1: ${child.name}`, findProp.value);
        //       child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
        //       child.position.set(findProp.value.px, findProp.value.py, findProp.value.pz)
        //     }
        //   }
        // })
      }
    }
  }

  getEditPropConfigData(data: PeopleData): editItem[] {
    return [
      {
        id: 'tipGroup',
        label: '基本信息',
        dataType: 'title',
      },
      {
        id: 'modelType',
        label: '模型',
        dataType: 'enum',
        value: data.modelType || 'man',
        enumList: [
          { id: 'man', name: '男性', img: '../assets/Empty.png' },
          { id: 'woman', name: '女性', img: '../assets/Empty.png' },
        ],
      },
      {
        id: 'height',
        label: '身高',
        dataType: 'number',
        min: 1,
        max: 500,
        step: 1,
        value: data.height,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 200,
        step: 1,
        value: data.z,
      },
      {
        id: 'boneEditButton',
        label: '姿态编辑',
        dataType: 'button',
        value: () => {
          // @ts-ignore
          window.showBoneEditIsShow();
        },
      },
      {
        id: 'bone',
        label: '骨骼',
        dataType: 'hidden',
        value: data.bone || [],
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color || '#DEDEDE',
      },
    ]
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow(this.getEditPropConfigData(data), (val) => {
      // 切换模型：先换 mesh（有缓存则同步，无缓存则等加载完），再 setData 触发重建
      if (val.modelType && val.modelType !== data.modelType) {
        const targetType = val.modelType as PeopleModelType
        const cached = modelCache[targetType]
        const applySwitch = (targetMesh: THREE.Group | THREE.Mesh) => {
          this.mesh = targetMesh
          this.initBasicBoxDataAnd2DPreview().then(() => {
            this.reBuildBoundingBoxData()
            canvas2DSceneManage.renderPreview()
          })
          this.setData({ ...val })
        }
        if (cached) {
          applySwitch(cached)
        } else {
          this.loadModel(targetType).then(applySwitch).catch((err) => {
            console.error('模型切换失败', err)
          })
        }
        return
      }

      this.setData({ ...val })
      console.log('editPropConfig', val)
      if (val.bone) {
        setTimeout(() => {
          this.initBasicBoxDataAnd2DPreview().then(() => {
            this.reBuildBoundingBoxData();
            canvas2DSceneManage.renderPreview()
          })
        }, 0)
      }
      if (val.color) {
        this.initBasicBoxDataAnd2DPreview().then(() => {
          canvas2DSceneManage.renderPreview()
        })
      }
    })
  }

  editAnimationDataColumn(column: string, a: any, b: any, t: number) {
    if (column === 'bone') {
      const centerBone: BoneStepItem[] = [];
      if (a === undefined || a.length === 0 || typeof a === 'string') {
        return b;
      }
      if (b === undefined || b.length === 0 || typeof b === 'string') {
        return a;
      }
      (a as BoneStepItem[]).forEach((aItem) => {
        const bItem = b.find((v: any) => v.name === aItem.name);
        if (bItem === undefined) {
          centerBone.push({
            ...aItem,
            value: {
              ...aItem.value,
              x: aItem.value.x,
              y: aItem.value.y,
              z: aItem.value.z,
              px: aItem.value.px,
              py: aItem.value.py,
              pz: aItem.value.pz,
            }
          })
        } else {
          centerBone.push({
            ...aItem,
            value: {
              ...aItem.value,
              x: lerpAngle(aItem.value.x, bItem.value.x, t),
              y: lerpAngle(aItem.value.y, bItem.value.y, t),
              z: lerpAngle(aItem.value.z, bItem.value.z, t),
              px: lerpPosition(aItem.value.px, bItem.value.px, t),
              py: lerpPosition(aItem.value.py, bItem.value.py, t),
              pz: lerpPosition(aItem.value.pz, bItem.value.pz, t),
            }
          })
        }
      })
      return centerBone;
    } else {
      return super.editAnimationDataColumn(column, a, b, t)
    }
  }

  getDataMeta(): { [key: string]: string } {
    return {
      ...super.getDataMeta(),
      height: '身高',
      color: '颜色',
      bone: '骨骼',
    }
  }

  // 可以动画编辑的列
  canEditAnimationDataColumn() {
    return [
      ...super.canEditAnimationDataColumn(),
      'bone',
      'height',
      'boneEditButton'
    ]
  }
}

/**
 * 角度最短路径线性插值
 * 确保从 start 到 end 走的是圆周上较近的旋转方向
 */
function lerpAngle(start: number, end: number, t: number): number {
  let diff = end - start
  if (diff > Math.PI) {
    diff -= Math.PI * 2
  } else if (diff < -Math.PI) {
    diff += Math.PI * 2
  }
  return start + diff * t
}
function lerpPosition(start: number, end: number, t: number): number {
  return start + (end - start) * t
}