import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { PeopleData } from './index.d'
import { EntityClass, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { PeopleDataClass } from './dataClass'
import { MatchCircleArea } from '@/utils/matchArea'

const img = new Image()
img.src = 'people.png'

export class PeopleEntity extends EntityClass<PeopleData> {
  name: string = '人物'
  type: string = 'people'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  color3DActive: string = 'red'
  colorOpacity: string = '#14b737a5'
  colorOpacityActive: string = 'red'
  active: boolean = false // 这个不存在数据库里，只是在前端动态调整
  drawAngelLength: number = 40
  private circleRadius = 6

  ManClean: THREE.Group | null = null

  defaultValue(): PeopleData {
    const people: PeopleData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      angle: 0,
      color: '#DEDEDE',
      height: 170,
      bone: [],
    }
    return new PeopleDataClass(people)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: PeopleData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angle
    const preImgScale = 0.24
    ctx.save(); // 保存当前状态
    const { width, height } = img;
    const zoom = data.height / 170
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY); // 围绕新原点旋转
    ctx.drawImage(
      img,
      preImgScale / -2 * width * zoomLevel * zoom,
      preImgScale / -2 * height * zoomLevel * zoom,
      preImgScale * width * zoomLevel * zoom,
      preImgScale * height * zoomLevel * zoom
    ); // 以新原点为中心绘制
    ctx.restore(); // 恢复原始状态
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: PeopleData,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const { angle: angleY } = data
    const angle = angleY * -1
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const drawAngelLength = this.drawAngelLength * data.height / 170

    // 控制点向着angle角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angle) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angle) * drawAngelLength

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel + panOffset.x, tempY * zoomLevel + panOffset.y]
    }

    // 绘制双向箭头表示旋转角度
    ctx.strokeStyle = '#e67e22'
    ctx.fillStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    // 绘制双向箭头的主线（圆弧）
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, angle * -1 - Math.PI / 4, angle * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(angle + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(angle + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(angle + Math.PI / 4, drawAngelLength - 5)
      ctx.moveTo(
        p1X,
        p1Y
      )
      ctx.lineTo(p2X, p2Y)
      ctx.lineTo(p3X, p3Y)
      ctx.closePath()
      ctx.fill()
    })();

    // 右侧箭头
    ctx.beginPath()
    const [p1X, p1Y] = ttt(angle - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(angle - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(angle - Math.PI / 4, drawAngelLength - 5)
    ctx.moveTo(
      p1X,
      p1Y
    )
    ctx.lineTo(p2X, p2Y)
    ctx.lineTo(p3X, p3Y)
    ctx.closePath()
    ctx.fill()

    // 在(rotatedXAdd, rotatedYAdd)位置绘制一个圆圈
    const circleX = rotatedXAdd * zoomLevel + panOffset.x
    const circleY = rotatedYAdd * zoomLevel + panOffset.y
    const circleRadius = this.circleRadius * zoomLevel + 3
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      const loader = new FBXLoader()
      loader.load('./ManClean.fbx', (fbxModel: THREE.Group) => {
        this.ManClean = fbxModel
        resolve()
      })
    })
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    console.log('create3DMesh', 1)

    const data = this.getData();
    const loader = new FBXLoader()
    const group = new THREE.Group()
    const { color, tip } = data
    if (this.ManClean) {
      const fbxModel = this.ManClean

      fbxModel.rotateX(Math.PI);
      fbxModel.rotateY(Math.PI)
      fbxModel.rotateZ(Math.PI);
      const boneListConfig = data.bone || [];
      fbxModel.traverse((child: any) => {
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
      fbxModel.traverse((child: any) => {
        if (child.isMesh) {
          child.material.color.set(color)
        }
      })

      // const canvas = document.createElement('canvas');
      // const ctx = canvas.getContext('2d');
      // ctx!.fillText('标签文字', 10, 20);
      // const texture = new THREE.CanvasTexture(canvas);
      // const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      // const sprite = new THREE.Sprite(spriteMaterial);
      // // sprite.position.y = 17 // 在模型上方
      // // @ts-ignore
      // window.ssss = sprite
      // // @ts-ignore
      // window.ddd = () => {
      //   sprite.position.y++
      // }
      // group.add(sprite);

      group.add(fbxModel)
    }
    return [
      group
    ]
  }

  // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const data = this.getData();
    let boxHeight = 0;// = data.height;
    if (this.meshList?.[0]?.children[0] && data.bone && data.bone?.length > 0) {
      const [boxSize, boxCenter] = this.getSkinnedMeshBoundingBox(this.meshList[0].children[0])
      boxHeight = boxSize.y;
      return [
        new THREE.Vector3(boxSize.x, boxHeight, boxSize.z),
        new THREE.Vector3(boxCenter.x - data.x, boxCenter.y - data.z, boxCenter.z - data.y),//  + boxHeight / 2
        // new THREE.Vector3(0, data.angle * -1, 0),
        new THREE.Vector3(0, 0, 0)
      ]
    } else {
      boxHeight = data.height;
      return [
        new THREE.Vector3(data.height * 2 / 5, boxHeight, data.height / 5),
        new THREE.Vector3(0, boxHeight / 2, 0),
        new THREE.Vector3(0, data.angle * -1, 0)
      ]
    }
  }

  getSkinnedMeshBoundingBox(object: THREE.Object3D): [THREE.Vector3, THREE.Vector3] {
    const box = new THREE.Box3()
    const tempVector = new THREE.Vector3()
    const tempMatrix = new THREE.Matrix4()
    const weightedMatrix = new THREE.Matrix4()
    const resultMatrix = new THREE.Matrix4()

    object.updateMatrixWorld(true)

    object.traverse((child: any) => {
      if (child.isSkinnedMesh) {
        const geometry = child.geometry
        const positionAttribute = geometry.attributes.position
        const skinIndex = geometry.attributes.skinIndex
        const skinWeight = geometry.attributes.skinWeight
        const skeleton = child.skeleton

        if (positionAttribute && skinIndex && skinWeight && skeleton) {
          skeleton.update()

          const boneMatrices = skeleton.boneMatrices

          for (let i = 0; i < positionAttribute.count; i++) {
            tempVector.fromBufferAttribute(positionAttribute, i)

            if (child.bindMatrix) {
              tempVector.applyMatrix4(child.bindMatrix)
            }

            const index0 = skinIndex.getX(i)
            const index1 = skinIndex.getY(i)
            const index2 = skinIndex.getZ(i)
            const index3 = skinIndex.getW(i)

            const weight0 = skinWeight.getX(i)
            const weight1 = skinWeight.getY(i)
            const weight2 = skinWeight.getZ(i)
            const weight3 = skinWeight.getW(i)

            weightedMatrix.fromArray(boneMatrices, index0 * 16).multiplyScalar(weight0)
            resultMatrix.copy(weightedMatrix)

            if (weight1 > 0) {
              tempMatrix.fromArray(boneMatrices, index1 * 16).multiplyScalar(weight1)
              this.matrixAdd(resultMatrix, tempMatrix)
            }
            if (weight2 > 0) {
              tempMatrix.fromArray(boneMatrices, index2 * 16).multiplyScalar(weight2)
              this.matrixAdd(resultMatrix, tempMatrix)
            }
            if (weight3 > 0) {
              tempMatrix.fromArray(boneMatrices, index3 * 16).multiplyScalar(weight3)
              this.matrixAdd(resultMatrix, tempMatrix)
            }

            tempVector.applyMatrix4(resultMatrix)

            if (child.bindMatrixInverse) {
              tempVector.applyMatrix4(child.bindMatrixInverse)
            }

            tempVector.applyMatrix4(child.matrixWorld)

            box.expandByPoint(tempVector)
          }
        }
      } else if (child.isMesh && !child.isSkinnedMesh) {
        box.expandByObject(child)
      }
    })

    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    return [size, center]
  }

  private matrixAdd(a: THREE.Matrix4, b: THREE.Matrix4): void {
    const aArray = a.elements
    const bArray = b.elements
    for (let i = 0; i < 16; i++) {
      aArray[i] += bArray[i]
    }
  }

  change3DMeshState(): void {
    const data = this.getData();
    const singleHeight = 0.213 * 0.0261
    const { height, angle, tip } = data
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.scale.set(singleHeight * height, singleHeight * height, singleHeight * height)
      v.rotation.set(0, angle * -1, 0)
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
  meshNeedChangeKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      height: undefined,
      angle: undefined,
      bone: undefined,
    }
    return this.type + JSON.stringify(cacheData)
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

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const { angle } = data
    const angleY = angle * -1
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    // 控制点向着angle角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angleY) * this.drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angleY) * this.drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    // console.log('dist2', dist2)
    if (dist2 < this.circleRadius + 3) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: dist2,
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
      this.changePosition({ x, y })
    } else if (matchHandelInfo.index === 1) {
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      this.setData({
        ...this.getData(),
        angle: angleY,
      })
    }
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const data = this.getData();
    return [{
      objType: this.type,
      objId: data.id,
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

  inSceneSnapLineArea(obj: EntityClass<PeopleData>, line: [Point, Point]) {
    return false;
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
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
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
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