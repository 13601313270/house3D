import * as THREE from 'three'
import { Point } from '../../types'
import { DoorEntity } from '@/entities/door/entity'
import { allFileKeys, EntityConstructor, fileData, fileDataKeyToClass } from '@/entities/index'
import { PointEntityClass } from '@/types/pointEntity'
import { ImportFileType, ImportImgType, ObjOutputFileType } from '@/entities/allObjs';
import { BaseEntityClass } from '@/types/baseEntity'
import { BaseObjData } from '@/types/map2d'
import { CameraBase } from '@/types/CameraBase'
import { GroupData } from './index.d'

export const canvasHeight = 600
export const snapThreshold = 20
type WorldChangeType = 'add' | 'remove' | 'change'

export interface EnvironmentConfig {
  skyType: number
  ambientLightIntensity?: number
  showGround?: boolean
}

export class World {
  protected data: GroupData

  public children: BaseEntityClass<BaseObjData>[] = []

  private allObjectsByGroup: {
    [key in string]?: BaseEntityClass<BaseObjData>[]
  } = {}

  // 锁定状态的对象列表
  lockedObjList: BaseEntityClass<BaseObjData>[] = []

  ObjFileTypes: ObjOutputFileType[] = []

  allImportFiles: ImportFileType[] = []

  allImportImgs: ImportImgType[] = []

  activeCameraIndex: number = -1

  environmentConfig: EnvironmentConfig = { skyType: 1, ambientLightIntensity: 1, showGround: true }

  ambientLight: THREE.AmbientLight | null = null

  directionalLight: THREE.DirectionalLight | null = null

  groundMesh: THREE.Mesh | null = null

  scene: THREE.Scene

  isShowBoundingBox: boolean = true

  constructor(data: GroupData) {
    this.data = data
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    gridHelper.layers.set(2)
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    axesHelper.layers.set(2)
    this.scene.add(axesHelper);

    (async () => {
      const apiList = [];
      for (const item of data.childrenData) {
        const type = item.type
        const EntityClassItem: EntityConstructor = fileDataKeyToClass[type];
        if (EntityClassItem) {
          const api = new EntityClassItem(this, item.value);
          await api.init()
          apiList.push(api)
          if (!this.allObjectsByGroup[type]) {
            this.allObjectsByGroup[type] = []
          }
          this.allObjectsByGroup[type].push(api)
          this.children.push(api)
          this.worldAddBindList.forEach(callback => callback(api))
          if (api.getData().isLocked) {
            this.lockedObjList.push(api)
          }
        }
      }
      if (apiList.length > 0) {
        this._callAllOnChangeCallback('add', apiList)
      }
    })();

    this.setEnvironMent()
  }

  setEnvironMent(config?: EnvironmentConfig) {
    if (config) {
      this.environmentConfig = config
    }
    const intensity = this.environmentConfig.ambientLightIntensity !== undefined ? this.environmentConfig.ambientLightIntensity : 1.5
    console.log('intensity', intensity, this.environmentConfig.ambientLightIntensity);

    if (this.ambientLight) {
      this.ambientLight.intensity = intensity === 0 ? 0.1 : intensity
    } else {
      this.ambientLight = new THREE.AmbientLight(0xffffff, intensity)
      this.scene.add(this.ambientLight)
    }

    // if (!this.directionalLight) {
    //   this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    //   this.directionalLight.position.set(100, 200, 100)
    //   this.scene.add(this.directionalLight)
    // }

    const skyType = this.environmentConfig.skyType || 1;
    const skyImgMap: Record<number, string> = {
      1: '/skyImg/sky.jpg',
      2: '/skyImg/sky2.jpg',
      3: '/skyImg/sky3.jpg',
      4: '/skyImg/sky4.jpg',
      5: '/skyImg/sky5.jpg',
      6: '/skyImg/sky6.jpg',
      7: '/skyImg/sky7.jpg',
    };
    const path = skyImgMap[skyType] || '/skyImg/sky.jpg';
    // === 加载 JPG 全景 ===
    const loaderSky = new THREE.TextureLoader();
    loaderSky.load(path, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = texture;
      this.scene.environment = texture; // 可选：简单环境光
    });

    // 添加地面
    const showGround = this.environmentConfig.showGround ?? true

    if (this.groundMesh) {
      this.groundMesh.visible = showGround
      return
    }

    if (!showGround) return

    const loaderGround = new THREE.TextureLoader();
    loaderGround.load('grand.jpg', (texture) => {
      // 增加一个地面平面
      const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1)
      // 设置纹理重复两次
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 12);

      const groundMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
      })
      this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
      this.groundMesh.rotation.x = -Math.PI / 2
      this.groundMesh.position.y = -10
      this.scene.add(this.groundMesh)
    });
  }

  draw2DPreview(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number
  ) {
    const data = this.getData();
    this.draw2DPreviewByData2(ctx, data, panOffset, zoomLevel)
  }

  draw2DPreviewByData2(
    ctx: CanvasRenderingContext2D,
    data: GroupData,
    panOffset: Point,
    zoomLevel: number,
  ) {
    // 绘制墙体
    const allObj: BaseEntityClass<BaseObjData>[] = [];
    this.children.forEach(item => {
      if (item.type !== 'pointGroup') {
        allObj.push(item)
      }
    })
    allObj.sort((a, b) => {
      let aZ = 0;
      if (a instanceof PointEntityClass) {
        const aData = a.getData()
        aZ = aData.z + (a.boundingBoxData ? a.boundingBoxData[0].y : 0)
      }
      let bZ = 0;
      if (b instanceof PointEntityClass) {
        const bData = b.getData()
        bZ = bData.z + (b.boundingBoxData ? b.boundingBoxData[0].y : 0)
      }
      return aZ - bZ
    }).forEach((item) => {
      item.draw2DPreview(ctx, panOffset, zoomLevel)
    })

    // 绘制所有ObjFile的中心点
    // this.allObjFiles.forEach((item) => {
    //   drawPoint(ctx, item.x * zoomLevel + panOffset.x, item.y * zoomLevel + panOffset.y, '#42b983')
    // })
  }

  // 绘制操作句柄
  // draw2DActionHandle(
  //   canvasActionRef: HTMLCanvasElement,
  //   fileData: fileData,
  //   panOffset: Point = { x: 0, y: 0 },
  //   zoomLevel: number = 1,
  // ) {
  //   const ctxAction = canvasActionRef.getContext('2d')!
  //   ctxAction.clearRect(0, 0, canvasActionRef.width, canvasActionRef.height)
  //   allFileKeys.forEach((key) => {
  //     if (fileData[key]) {
  //       fileData[key].forEach((item, index) => {
  //         // @ts-ignore
  //         const itemApi: DoorEntity = this.allFileMapObjects[key][index];
  //         if (itemApi) {
  //           itemApi.draw2D(ctxAction, panOffset, zoomLevel)
  //         }
  //       })
  //     }
  //   })
  // }

  getTypeObjectsData(type: string) {
    const returnData: BaseObjData[] = [];
    this.getTypeListEntity(type).forEach((item) => {
      returnData.push(item.getData())
    })
    return returnData
  }

  boundingBoxList(): THREE.Group[] {
    const boundingBoxList: THREE.Group[] = []
    this.children.forEach((item) => {
      if (item instanceof PointEntityClass && item.boundingBox) {
        boundingBoxList.push(item.boundingBox)
      }
    });
    return boundingBoxList
  }

  moveZBoxList(): THREE.Group[] {
    const boundingBoxList: THREE.Group[] = []
    this.children.forEach((item) => {
      if (item instanceof PointEntityClass && item.moveZBox) {
        boundingBoxList.push(item.moveZBox)
      }
    });
    console.log('boundingBoxList-1', boundingBoxList)
    return boundingBoxList
  }

  draw3D() {
    this.children.forEach(item => {
      item.reCreate3DMeshIfNeed()
      item.change3DMeshState()
      if (item instanceof PointEntityClass && !(item instanceof CameraBase)) {
        setTimeout(() => {
          const boundingBox = item.createBoundingBox();
          if (boundingBox && this.isShowBoundingBox) {
            const data = item.getData();
            // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
            const [boxVector3, offsetVector3, rotateVector3] = boundingBox;
            item.boundingBoxData = [boxVector3, offsetVector3, rotateVector3]
            item.boundingBox.position.set(data.x, data.z, data.y)
            item.boundingBox.children[0].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
            item.boundingBox.children[0].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
            item.boundingBox.children[0].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)

            item.boundingBox.children[1].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
            item.boundingBox.children[1].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
            item.boundingBox.children[1].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)

            item.boundingBox.visible = this.isShowBoundingBox
            if (item.spriteGroup) {
              item.spriteGroup.position.set(data.x, data.z, data.y)
              item.spriteGroup.children[0].position.set(0, boxVector3.y / 2 + offsetVector3.y + 12, 0)
            }
            if (item.moveZBox) {
              item.moveZBox.position.set(data.x, data.z, data.y)
              // const height = Math.max(Math.min(40, boxVector3.y), 20);
              const radio = Math.max(Math.min(boxVector3.x / 8, boxVector3.z / 8, 20), 8);
              const height = radio * 3;
              item.moveZBox.children[0].scale.set(
                radio,
                height,
                radio
              )
              item.moveZBox.children[0].position.set(offsetVector3.x, boxVector3.y / 2 + height / 2 + offsetVector3.y, offsetVector3.z)
              item.moveZBox.visible = false
            }
          } else {
            item.boundingBox.visible = false
          }
        })
      }
    })
  }

  getAllFileObjects(): fileData {
    const returnData: fileData = {};
    allFileKeys.forEach((key) => {
      returnData[key] = []
      if (this.getTypeListEntity(key)) {
        (this.getTypeListEntity(key) as PointEntityClass<any>[]).forEach((item) => {
          // @ts-ignore
          returnData[key].push(item.getData())
        })
      }
    })
    return returnData
  }

  async add(type: string, data: BaseObjData[]): Promise<BaseEntityClass<any>[]> {
    const EntityClassItem: EntityConstructor = fileDataKeyToClass[type] as any;
    if (!this.allObjectsByGroup[type]) {
      this.allObjectsByGroup[type] = []
    }
    const apiList = [];
    for (let i = 0; i < data.length; i++) {
      const api: BaseEntityClass<any> = new EntityClassItem(this, data[i]);
      await api.init()
      apiList.push(api);
      this.allObjectsByGroup[type].push(api)
      this.data.childrenData.push(api.getData())
      this.children.push(api);
      this.worldAddBindList.forEach(callback => callback(api))
      if (api.getData().isLocked) {
        this.lockedObjList.push(api)
      }
    }
    this._callAllOnChangeCallback('add', apiList)
    return apiList;
  }

  delete(type: string, index: number) {
    if (this.allObjectsByGroup[type]) {
      const backup = this.allObjectsByGroup[type][index];
      this.allObjectsByGroup[type][index].beforeRemove()
      this.allObjectsByGroup[type].splice(index, 1)

      const index2 = this.children.indexOf(backup)
      this.children.splice(index2, 1)
      this.data.childrenData.splice(index2, 1)

      if (backup.getData().isLocked) {
        const index = this.lockedObjList.indexOf(backup)
        if (index !== -1) {
          this.lockedObjList.splice(index, 1)
        }
      }
      this._callAllOnChangeCallback('remove', [backup])
    }
  }

  clearAll() {
    const willRemoveList: BaseEntityClass<any>[] = [];
    allFileKeys.forEach((type) => {
      if (this.allObjectsByGroup[type]) {
        (this.allObjectsByGroup[type] as BaseEntityClass<any>[]).forEach((item) => {
          willRemoveList.push(item);
        });
      }
    })
    allFileKeys.forEach((type) => {
      if (this.allObjectsByGroup[type]) {
        (this.allObjectsByGroup[type] as BaseEntityClass<any>[]).forEach((item) => {
          if (item.getData().isLocked) {
            const index = this.lockedObjList.indexOf(item)
            if (index !== -1) {
              this.lockedObjList.splice(index, 1)
            }
          }
          item.beforeRemove()
        });
        this.allObjectsByGroup[type] = []
      }
    })
    this.data.childrenData = []
    this._callAllOnChangeCallback('remove', willRemoveList);
  }

  // 世界变化
  worldChangeBindList: ((type: WorldChangeType, obj: BaseEntityClass<BaseObjData>[]) => void)[] = [];
  onWorldChange(callback: (type: WorldChangeType, obj: BaseEntityClass<BaseObjData>[]) => void) {
    this.worldChangeBindList.push(callback)
  }

  private _callAllOnChangeCallback(type: WorldChangeType, obj: BaseEntityClass<BaseObjData>[]) {
    this.worldChangeBindList.forEach(callback => callback(type, obj))
  }

  // 世界添加对象
  worldAddBindList: ((obj: BaseEntityClass<BaseObjData>) => void)[] = [];
  onWorldAddObj(callback: (obj: BaseEntityClass<BaseObjData>) => void) {
    this.worldAddBindList.push(callback)
  }

  // 世界对象修改
  worldObjChangeDataBindList: ((obj: BaseEntityClass<BaseObjData>) => void)[] = [];
  onWorldObjChangeData(callback: (obj: BaseEntityClass<BaseObjData>) => void) {
    this.worldObjChangeDataBindList.push(callback)
  }

  public _callObjDataChange(obj: BaseEntityClass<BaseObjData>) {
    this.worldObjChangeDataBindList.forEach(callback => callback(obj))
    if (obj.getData().isLocked) {
      if (!this.lockedObjList.includes(obj)) {
        this.lockedObjList.push(obj)
      }
    } else {
      const index = this.lockedObjList.indexOf(obj)
      if (index !== -1) {
        this.lockedObjList.splice(index, 1)
      }
    }
    this._callAllOnChangeCallback('change', [obj])
  }

  // 世界对象删除
  worldObjRemoveBindList: ((obj: BaseEntityClass<BaseObjData>) => void)[] = [];
  onWorldObjRemove(callback: (obj: BaseEntityClass<BaseObjData>) => void) {
    this.worldObjRemoveBindList.push(callback)
  }

  getData(): GroupData {
    return this.data
  }

  getTypeListEntity(key: string): BaseEntityClass<BaseObjData>[] {
    return this.allObjectsByGroup[key] || []
  }

  getAllObjectTypes() {
    return Object.keys(this.allObjectsByGroup)
  }

  getAllObjectCount() {
    return this.children.length
  }
}
