import * as THREE from 'three'
import { HandelInfo, PointObjData, Point } from '@/types/map2d'
import { OutFileInWallData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMaterialById } from '@/material'
import { EntityClassInWall } from '@/types/entityInWall'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { OrigionSnapPoint } from '@/types/baseEntity'
import { WallEntity } from '../wall/entity'
import { modify3DMesh, outFileDataExtension } from '@/outFilePlus'

export class OutFileInWallEntity extends EntityClassInWall<OutFileInWallData> {
  name: string = '外部文件'
  type: string = 'outFileInWall'
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'
  private baseDrawAngelLength = 40;
  img: HTMLImageElement = new Image()
  private circleRadius = 6

  init(): Promise<void> {
    const findObjInfo = window.worldState.ObjFileTypes.find(item => item.id === this.getData().fileTypeId)
    const preImg = findObjInfo?.preImg || ''
    if (findObjInfo?.name) {
      this.name = findObjInfo.name
    }
    this.img.src = preImg
    return new Promise((resolve, reject) => {
      this.img.onload = () => {
        resolve()
      }
      this.img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    })
  }

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { x, y, isOuter, angle, wallId, fileTypeId } = data
    const screenX = x * zoomLevel;
    const screenY = y * zoomLevel;
    const findObjInfo = window.worldState.ObjFileTypes.find(item => item.id === fileTypeId)
    const preImgScale = findObjInfo?.preImgScale || 1
    const { width, height } = this.img;
    let wallThickness = 10;
    if (this.parentEntity) {
      const wall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === wallId;
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    // 沿着angleY角度移动10像素的偏移量
    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness / 2 * zoomLevel;
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness / 2 * zoomLevel;
    // console.log('=======', angleY, offsetX, offsetY)
    ctx.save(); // 保存当前状态
    ctx.translate(screenX + offsetX, screenY + offsetY); // 移动原点到目标中心
    ctx.rotate(isOuter ? angle + Math.PI : angle); // 围绕新原点旋转
    ctx.drawImage(
      this.img,
      preImgScale / -2 * width * zoomLevel,
      preImgScale / -2 * height * zoomLevel,
      preImgScale * width * zoomLevel,
      preImgScale * height * zoomLevel
    );
    ctx.restore(); // 恢复原始状态
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number
  ): void {
    const data = this.getData();
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { fileTypeId, bm, color, wallId, isOuter } = data
    const findObjInfo = window.worldState.ObjFileTypes.find(item => item.id === fileTypeId)

    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    let wallThickness = 10;
    if (this.parentEntity) {
      const wall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === wallId;
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    const { scaleX, scaleY, scaleZ, url, materialUrl, angleY, materialVec, defaultColor, materialId } = findObjInfo
    const materialUseId = (bm === null) ? (materialId || -1) : bm
    // console.log('materialId', color);
    // console.log('scaleX', scaleX, 'scaleY', scaleY, 'scaleZ', scaleZ)
    const offsetX = Math.cos(angleY + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness / 2;
    const offsetY = Math.sin(angleY + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness / 2;
    // 将方向向量旋转90度
    const rotatedDirection = materialVec ? new THREE.Vector3(...materialVec) : new THREE.Vector3(-1, 1, 1)
    const material: THREE.Material | undefined = (() => {
      if (materialId !== -1 && materialId !== null) {
        const mater = getMaterialById(materialId);
        if (mater) {
          return mater.material(rotatedDirection)
        }
      }
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1
      });
    })();
    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      const materLoader = new MTLLoader()

      function render(object: THREE.Group) {
        object.scale.set(scaleX, scaleY, scaleZ)
        object.rotation.y = angleY * -1 + (isOuter ? Math.PI : 0)
        object.position.set(offsetX, 0, offsetY)

        if (!materialUrl) {
          // @ts-ignore
          object.material = material
        }

        // 添加默认材质（如果模型没有材质）
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (materialId !== -1 && materialId !== null) {
              child.material = material
            } else {
              if (!materialUrl) {
                child.material = material
              }
            }
          }
        })
        group.add(object)
        modify3DMesh(fileTypeId, data, object)
        // console.log('OBJ文件加载成功:', url)
      }
      // console.log('material-material', getMaterialById(materialId))
      if (materialUrl) {
        materLoader.load(materialUrl, (mtl: any) => {
          mtl.preload();
          loader.setMaterials(mtl);
          loader.load(url, (object: THREE.Group) => {
            render(object)
          }, () => {
            // 加载进度
            // const percent = (progress.loaded / progress.total * 100).toFixed(2)
            // console.log('加载进度:', percent + '%')
          }, (error: any) => {
            console.error('OBJ文件加载失败:', error)
          })
        })
      } else {
        loader.load(url, (object: THREE.Group) => {
          render(object)
        }, () => {
          // 加载进度
          // const percent = (progress.loaded / progress.total * 100).toFixed(2)
          // console.log('加载进度:', percent + '%')
        }, (error: any) => {
          console.error('OBJ文件加载失败:', error)
        })
      }
    } else if (url.endsWith('.glb')) {
      const loader = new GLTFLoader()
      loader.load(url, (gltf: any) => {
        gltf.scene.scale.set(scaleX, scaleY, scaleZ)
        console.log('offsetX', offsetX, 'offsetY', offsetY)
        gltf.scene.rotation.y = angleY * -1 + (isOuter ? Math.PI : 0)
        gltf.scene.position.set(offsetX, 0, offsetY)
        if (defaultColor || materialId) {
          // @ts-ignore
          gltf.scene.material = material
          gltf.scene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              if (materialUseId !== -1 && materialUseId !== null) {
                child.material = material
              } else {
                child.material = material
              }
            }
          })
          gltf.scene.material = material
        }
        group.add(gltf.scene)
        modify3DMesh(fileTypeId, data, gltf.scene)
      }, () => {
        // 加载进度
        // const percent = (progress.loaded / progress.total * 100).toFixed(2)
        // console.log('加载进度:', percent + '%')
      }, (error: any) => {
        console.error('OBJ文件加载失败:', error)
      })
    }
    // group.position.set(data.x, data.z, data.y)

    return [
      group
    ]
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    let wallThickness = 10;
    const { wallId, fileTypeId, isOuter, angle } = this.getData()
    if (this.parentEntity) {
      const wall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === wallId;
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    const findObjInfo = window.worldState.ObjFileTypes.find(item => item.id === fileTypeId)

    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return [
        new THREE.Vector3(10, 10, wallThickness),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ]
    }

    const {
      matchAreaNumber1,
      matchAreaDepth,
    } = findObjInfo

    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
    return [
      new THREE.Vector3(matchAreaNumber1, matchAreaDepth, wallThickness),
      new THREE.Vector3(offsetX, matchAreaDepth / 2, offsetY),
      new THREE.Vector3(0, angle * -1, 0)
    ]
  }

  // 当前对象是否需要重新生成3D模型状态
  create3DUnionKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      wallId: undefined,
      wallPointId: undefined,
      angle: undefined,
    }
    return JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等，模型本身不变
  change3DMeshState(): void {
    const data = this.getData();
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.rotation.y = data.angle * -1
    })
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    const { fileTypeId, angle, isOuter, wallId } = data
    const findObjInfo = window.worldState.ObjFileTypes.find(item => item.id === fileTypeId)
    if (findObjInfo) {
      const { matchAreaType, matchAreaNumber1, matchAreaNumber2 } = findObjInfo
      if (matchAreaType === 1) {
        let wallThickness = 10
        let wall: WallEntity | null = null
        if (this.parentEntity) {
          wall = this.parentEntity.getTypeListEntity('wall').find((entity) => {
            return entity.getData().id === wallId;
          }) as WallEntity
          wallThickness = wall ? wall.getData().thickness : 10;
        }

        const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
        const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
        const dataX = data.x + offsetX;
        const dataY = data.y + offsetY;
        if (isPointInRotatedRect(x, y, {
          x: dataX,
          y: dataY,
          width: Math.max(matchAreaNumber1, 30),
          depth: Math.max(matchAreaNumber2 + wallThickness * 4, 30),
          angleY: data.angle * -1,
        })) {
          return new MatchRectArea({
            x: dataX,
            y: dataY,
            width: Math.max(matchAreaNumber1, 10),
            depth: Math.max(matchAreaNumber2 + wallThickness * 4, 30),
            angleY: data.angle * -1,
          })
        }
      } else if (matchAreaType === 2) {
        if (dist < matchAreaNumber1) {
          return new MatchCircleArea({
            x: data.x,
            y: data.y,
            r: matchAreaNumber1
          })
        }
      }
      return null;
    } else {
      if (dist < this.circleRadius + 3) {
        return new MatchCircleArea({ x: data.x, y: data.y, r: this.circleRadius })
      }
      return null;
    }
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('dist', dist)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y } = position
    if (matchHandelInfo.index === 0) {
      this.setData({
        ...this.getData(),
        x,
        y,
      })
    }
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const { x, y, id } = this.getData()
    // 计算旋转后的点
    // const rotatedX = x * Math.cos(angle) - y * Math.sin(angle)
    // const rotatedY = x * Math.sin(angle) + y * Math.cos(angle)

    return [{
      objType: this.type,
      snapFromType: 'point',
      point: {
        index: 0,
        x,
        y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    outFileDataExtension(data.fileTypeId, data).then(moreConfig => {
      const configList: editItem[] = [
        {
          id: 'bm',
          label: '材质',
          dataType: 'material',
          value: data.bm,
        },
        {
          id: 'z',
          label: '距离地面',
          dataType: 'number',
          min: 0,
          max: 200,
          step: 1,
          value: data.z,
        },
        {
          id: 'color',
          label: '颜色',
          dataType: 'color',
          value: data.color,
        },
        {
          id: 'isOuter',
          label: '是否挂在外墙',
          dataType: 'boolean',
          value: data.isOuter,
        },
        ...moreConfig,
      ]
      editShow(configList, (val) => {
        this.setData({
          ...this.getData(),
          ...val,
        })
      })
    })
  }

  inSceneSnapLineArea(obj: PointEntityClass<PointObjData>, line: [Point, Point], point: Point) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      const data = this.getData();
      const objData = obj.getData()
      this.setData({
        ...data,
        x: point.x,
        y: point.y,
        angle: nearestAngle,
        wallId: objData.id,
        wallPointId: index,
      })
      return true;
    }
    return false;
  }

  notInSceneSnapLineArea() {
    const data = this.getData();
    if (data.wallId) {
      const data = this.getData();
      this.setData({
        ...data,
        wallId: undefined,
        wallPointId: -1,
      })
      return true;
    }
  }
}
