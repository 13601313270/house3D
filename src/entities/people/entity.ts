import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { BoneStepItem, PeopleData } from './index.d'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { editItem } from '@/utils/editItem'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { MatchCircleArea } from '@/utils/matchArea'
import { OrigionSnapPoint } from '@/types/baseEntity'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { GroupBaseData } from '@/types/groupBase'
import { PointCanAngleEntity } from '@/types/pointCanAngleEntity'

const img = new Image()
img.src = 'people.png'

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

export class PeopleEntity extends PointCanAngleEntity<PeopleData> {
  name: string = '人物'
  type: string = 'people'
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  color3DActive: string = 'red'
  colorOpacity: string = '#14b737a5'
  colorOpacityActive: string = 'red'
  active: boolean = false // 这个不存在数据库里，只是在前端动态调整
  drawAngelLength: number = 40
  private circleRadius = 6
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
    super(world, data)
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      const loader = new FBXLoader()
      loader.load('./ManClean.fbx', (fbxModel: THREE.Mesh) => {
        this.mesh = fbxModel
        this.initBasicBoxData_().then(res => {
          resolve(res)
        })
      })
    })
  }

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const scale = 1;// data.height * singleHeight;
    const screenX = data.x * zoomLevel;
    const screenY = data.y * zoomLevel;
    const angleY = data.angleY
    const preImgScale = scale / this.imgBeCreateByScale;
    ctx.save(); // 保存当前状态
    const { width, height } = this.img;
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY * -1); // 围绕新原点旋转
    ctx.drawImage(
      this.img,
      preImgScale / -2 * width * zoomLevel,
      preImgScale / -2 * height * zoomLevel,
      preImgScale * width * zoomLevel,
      preImgScale * height * zoomLevel
    ); // 以新原点为中心绘制
    ctx.restore(); // 恢复原始状态
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number
  ): void {
    const data = this.getData();
    // 控制点
    super.draw2DActionHandle(ctx, zoomLevel)

    // 绘制轮廓
    const circleArea = new MatchCircleArea({
      x: data.x,
      y: data.y,
      r: data.height * 0.3 + 10
    })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      circleArea.data.x * zoomLevel,
      circleArea.data.y * zoomLevel
    );
    ctx.beginPath()
    ctx.arc(
      0,
      0,
      circleArea.data.r * zoomLevel,
      0,
      Math.PI * 2,
    )
    ctx.stroke()
    ctx.restore(); // 恢复原始状态
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

  // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  basicBoxData_: [THREE.Vector3, THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(10, 10, 10),
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(0, 0, 0)
  ]

  // 重新构造box基础data和2D预览图
  initBasicBoxData_(): Promise<void> {
    if (!this.mesh) { return Promise.resolve() }
    const previewImgMesh = clone(this.mesh);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const scene = new THREE.Scene()
    const cameraSize = 600;

    const box = new THREE.Box3().setFromObject(previewImgMesh)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const objZoomWidth = cameraSize / (size.x + Math.abs(center.x) * 2)
    const objZoomHeight = cameraSize / (size.z + Math.abs(center.z) * 2)
    const objZoom = Math.min(objZoomWidth, objZoomHeight)
    console.log('objZoom', previewImgMesh.children[1], objZoom)
    this.imgBeCreateByScale = objZoom
    previewImgMesh.scale.set(objZoom, 1, objZoom)

    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    this.basicBoxData_[0].x = size.x
    this.basicBoxData_[0].y = size.y
    this.basicBoxData_[0].z = size.z
    this.basicBoxData_[1].x = center.x
    this.basicBoxData_[1].y = center.y
    this.basicBoxData_[1].z = center.z

    const camera = new THREE.OrthographicCamera(-cameraSize / 2, cameraSize / 2, cameraSize / 2, -cameraSize / 2)
    scene.background = null
    const ambientLight = new THREE.AmbientLight(0xffffff, 5)
    scene.add(ambientLight)

    camera.position.set(0, 2000, 0)
    camera.lookAt(0, 0, 0)

    renderer.setPixelRatio(1)
    renderer.shadowMap.enabled = true

    const container = document.createElement('div')
    const allPanelHeight = cameraSize;
    container.style.width = `${allPanelHeight}px`
    container.style.height = `${allPanelHeight}px`
    renderer.setSize(allPanelHeight, allPanelHeight)

    container.appendChild(renderer.domElement)

    scene.add(previewImgMesh)
    renderer.render(scene, camera)

    return new Promise((resolve, reject) => {
      this.img.onload = () => {
        resolve()
      }
      this.img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      this.img.src = renderer.domElement.toDataURL()
    })
  }

  // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  // getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  //   const data = this.getData();
  //   let boxHeight = 0;// = data.height;
  //   if (this.meshList?.[0]?.children[0] && data.bone && data.bone?.length > 0) {
  //     const [boxSize, boxCenter] = this.getSkinnedMeshBoundingBox(this.meshList[0].children[0])
  //     boxHeight = boxSize.y;
  //     return [
  //       new THREE.Vector3(boxSize.x, boxHeight, boxSize.z),
  //       new THREE.Vector3(boxCenter.x - data.x, boxCenter.y - data.z, boxCenter.z - data.y),//  + boxHeight / 2
  //       // new THREE.Vector3(0, data.angle * -1, 0),
  //       new THREE.Vector3(0, 0, 0)
  //     ]
  //   } else {
  //     boxHeight = data.height;
  //     return [
  //       new THREE.Vector3(data.height * 2 / 5, boxHeight, data.height / 5),
  //       new THREE.Vector3(0, boxHeight / 2, 0),
  //       new THREE.Vector3(0, data.angleY, 0)
  //     ]
  //   }
  // }
  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { angleY } = this.getData()
    const scale = 1;
    const size = this.basicBoxData_[0].clone();
    size.set(size.x * scale, size.y * scale, size.z * scale)
    const center = this.basicBoxData_[1].clone();
    const offsetX = center.x;
    const offsetY = center.y;
    const offsetZ = center.z;
    // 计算偏移位置（考虑旋转）
    const finalOffsetX = offsetX * Math.cos(angleY) + offsetZ * Math.sin(angleY);
    const finalOffsetZ = -offsetX * Math.sin(angleY) + offsetZ * Math.cos(angleY);
    center.set(finalOffsetX * scale, offsetY * scale, finalOffsetZ * scale)
    const angel = this.basicBoxData_[2].clone();
    angel.setY(angleY)
    // console.log('size', size)
    return [
      size,
      center,
      angel
    ]
  }

  // getSkinnedMeshBoundingBox(object: THREE.Object3D): [THREE.Vector3, THREE.Vector3] {
  //   const box = new THREE.Box3()
  //   const tempVector = new THREE.Vector3()
  //   const tempMatrix = new THREE.Matrix4()
  //   const weightedMatrix = new THREE.Matrix4()
  //   const resultMatrix = new THREE.Matrix4()

  //   object.updateMatrixWorld(true)

  //   object.traverse((child: any) => {
  //     if (child.isSkinnedMesh) {
  //       const geometry = child.geometry
  //       const positionAttribute = geometry.attributes.position
  //       const skinIndex = geometry.attributes.skinIndex
  //       const skinWeight = geometry.attributes.skinWeight
  //       const skeleton = child.skeleton

  //       if (positionAttribute && skinIndex && skinWeight && skeleton) {
  //         skeleton.update()

  //         const boneMatrices = skeleton.boneMatrices

  //         for (let i = 0; i < positionAttribute.count; i++) {
  //           tempVector.fromBufferAttribute(positionAttribute, i)

  //           if (child.bindMatrix) {
  //             tempVector.applyMatrix4(child.bindMatrix)
  //           }

  //           const index0 = skinIndex.getX(i)
  //           const index1 = skinIndex.getY(i)
  //           const index2 = skinIndex.getZ(i)
  //           const index3 = skinIndex.getW(i)

  //           const weight0 = skinWeight.getX(i)
  //           const weight1 = skinWeight.getY(i)
  //           const weight2 = skinWeight.getZ(i)
  //           const weight3 = skinWeight.getW(i)

  //           weightedMatrix.fromArray(boneMatrices, index0 * 16).multiplyScalar(weight0)
  //           resultMatrix.copy(weightedMatrix)

  //           if (weight1 > 0) {
  //             tempMatrix.fromArray(boneMatrices, index1 * 16).multiplyScalar(weight1)
  //             this.matrixAdd(resultMatrix, tempMatrix)
  //           }
  //           if (weight2 > 0) {
  //             tempMatrix.fromArray(boneMatrices, index2 * 16).multiplyScalar(weight2)
  //             this.matrixAdd(resultMatrix, tempMatrix)
  //           }
  //           if (weight3 > 0) {
  //             tempMatrix.fromArray(boneMatrices, index3 * 16).multiplyScalar(weight3)
  //             this.matrixAdd(resultMatrix, tempMatrix)
  //           }

  //           tempVector.applyMatrix4(resultMatrix)

  //           if (child.bindMatrixInverse) {
  //             tempVector.applyMatrix4(child.bindMatrixInverse)
  //           }

  //           tempVector.applyMatrix4(child.matrixWorld)

  //           box.expandByPoint(tempVector)
  //         }
  //       }
  //     } else if (child.isMesh && !child.isSkinnedMesh) {
  //       box.expandByObject(child)
  //     }
  //   })

  //   const size = new THREE.Vector3()
  //   const center = new THREE.Vector3()
  //   box.getSize(size)
  //   box.getCenter(center)
  //   return [size, center]
  // }

  // private matrixAdd(a: THREE.Matrix4, b: THREE.Matrix4): void {
  //   const aArray = a.elements
  //   const bArray = b.elements
  //   for (let i = 0; i < 16; i++) {
  //     aArray[i] += bArray[i]
  //   }
  // }

  change3DMeshState(): void {
    const data = this.getData();
    const singleHeight = 0.213 * 0.0261
    const { angleY } = data
    const scale = 1;// data.height * singleHeight;
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.scale.set(scale, scale, scale)
      v.rotation.set(0, angleY, 0)
    })
    if (this.meshList?.[0]?.children[0] && data.bone && data.bone?.length > 0) {
      const boneListConfig = data.bone
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

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('dist', dist)
    if (dist < data.height * 0.3 + 10) {
      return new MatchCircleArea({
        x: data.x,
        y: data.y,
        r: data.height * 0.3 + 10
      })
    }
    return null;
  }

  // matchHandelInfo(x: number, y: number) {
  //   const data = this.getData();
  //   const angleY = data.angleY
  //   const dist = Math.hypot(x - data.x, y - data.y)
  //   if (dist < this.circleRadius + 3) {
  //     return {
  //       index: 0,
  //       type: this.type,
  //       id: data.id,
  //       dist,
  //     }
  //   }
  //   // 控制点向着angle角度延伸10个单位后的坐标
  //   const rotatedXAdd = data.x + Math.cos(angleY) * this.drawAngelLength
  //   const rotatedYAdd = data.y - Math.sin(angleY) * this.drawAngelLength

  //   const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
  //   // console.log('dist2', dist2)
  //   if (dist2 < this.circleRadius + 3) {
  //     return {
  //       index: 1,
  //       type: this.type,
  //       id: data.id,
  //       dist: dist2,
  //     }
  //   }
  //   return null;
  // }

  // matchHandelMoveCallback(position: {
  //   x: number,
  //   y: number,
  // }, matchHandelInfo: HandelInfo) {
  //   const { x, y } = position
  //   if (matchHandelInfo.index === 1) {
  //     const data = this.getData();
  //     // 根据x,y计算angleY
  //     const angleY = Math.atan2(y - data.y, x - data.x)
  //     this.setData({
  //       angleY,
  //     })
  //   } else {
  //     return super.matchHandelMoveCallback(position, matchHandelInfo)
  //   }
  // }

  inSceneSnapPointArea() {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const data = this.getData();
    return [{
      objType: this.type,
      snapFromType: 'point',
      point: {
        index: 0,
        x: data.x,
        y: data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  inSceneSnapLineArea() {
    return false;
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
          this.initBasicBoxData_();
          this.reBuildBoundingBoxData();
        }, 0)
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