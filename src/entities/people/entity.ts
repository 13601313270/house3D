import * as THREE from 'three'
import { HandelInfo } from '@/types/map2d'
import { BoneStepItem, PeopleData } from './index.d'
import { editItem } from '@/utils/editItem'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { GroupBaseData } from '@/types/groupBase'
import { ModelFileEntity } from '@/types/modelFileEntity'
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'

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

export class PeopleEntity extends ModelFileEntity<PeopleData> {
  name: string = '人物'
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
    super(world, data)
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      const loader = new FBXLoader()
      loader.load('./ManClean.fbx', (fbxModel: THREE.Mesh) => {
        this.mesh = fbxModel
        this.initBasicBoxDataAnd2DPreview().then(res => {
          resolve(res)
        })
      })
    })
  }

  create3DMesh(): THREE.Group[] {
    console.log('00000000')
    const data = this.getData();
    const group = new THREE.Group()
    const { color } = data
    if (!this.mesh) {
      console.error('未找到对应的文件类型:')
      return []
    }
    const threeObject = this.mesh
    const boneListConfig = data.bone || [];
    threeObject.traverse((child: any) => {
      if (child.isBone) {
        // console.log(`🦴 发现骨骼: ${child.name}`);
        const findProp = boneListConfig.find((item) => item.name === child.name)
        if (findProp) {
          child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
        }
        // console.log(`🦴 发现骨骼-1:${child.name}: ${child.rotation.x}, ${child.rotation.y}, ${child.rotation.z}`);
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
    return [
      group
    ]
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
    super.change3DMeshState();
    const data = this.getData();
    if (this.meshList?.[0]?.children[0] && data.bone && data.bone?.length > 0) {
      const boneListConfig = data.bone
      if (boneListConfig) {
        this.meshList?.[0]?.children[0].traverse((child: any) => {
          if (child.isBone) {
            const findProp = boneListConfig.find((item) => item.name === child.name)
            if (findProp) {
              // console.log(`🦴 发现骨骼-1: ${child.name}`, findProp.value);
              child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
              child.position.set(findProp.value.px, findProp.value.py, findProp.value.pz)
            }
          }
        })
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
      this.setData({
        // ...data,
        ...val,
      })
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

  canEditAnimationDataColumn() {
    return [...super.canEditAnimationDataColumn(), 'boneEditButton']
  }

  editAnimationDataColumn(column: string, a: any, b: any, t: number) {
    if (column === 'bone') {
      const centerBone: BoneStepItem[] = [];
      if (a === undefined) {
        return b;
      }
      (a as BoneStepItem[]).forEach((aItem, index) => {
        const bItem = b[index];
        centerBone.push({
          ...aItem,
          value: {
            ...aItem.value,
            x: lerpAngle(aItem.value.x, bItem.value.x, t),
            y: lerpAngle(aItem.value.y, bItem.value.y, t),
            z: lerpAngle(aItem.value.z, bItem.value.z, t),
            px: lerpAngle(aItem.value.px, bItem.value.px, t),
            py: lerpAngle(aItem.value.py, bItem.value.py, t),
            pz: lerpAngle(aItem.value.pz, bItem.value.pz, t),
          }
        })
      })
      return centerBone;
    } else {
      return super.editAnimationDataColumn(column, a, b, t)
    }
  }
}

export function changePeopleBone(gltfScene: THREE.Group, boneListConfig: Array<{
  name: string
  value: {
    x: number
    y: number
    z: number
  }
}>): void {
  gltfScene.traverse((child: any) => {
    if (child.isBone) {
      // console.log(`🦴 发现骨骼: ${child.name}`)
      const findProp = boneListConfig.find((item) => item.name === child.name)
      if (findProp) {
        child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
      }
    }
  })
}