import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { ImportFileData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem'
import { MatchRectArea } from '@/utils/matchArea'
import { OrigionSnapPoint } from '@/types/baseEntity'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { angelIcon, moveIcon } from '@/utils/handleImgs'
import { PointCanAngleEntity } from '@/types/pointCanAngleEntity'

export class ImportFileEntity extends PointCanAngleEntity<ImportFileData> {
  name: string = '导入文件'
  type: string = 'importFile'
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'
  private circleRadius = 6

  img: HTMLImageElement = new Image()
  imgBeCreateByScale: number = 1; // 这个图片是以哪个缩放比例创建的
  canEditAnimationDataColumn: Array<keyof ImportFileData> = [];

  init(): Promise<void> {
    const { fileTypeId } = this.getData();
    const findObjInfo = window.worldState.allImportFiles.find(item => item.fileTypeId === fileTypeId)
    if (!findObjInfo) { return Promise.resolve() }
    const mesh = findObjInfo.mesh.clone()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const scene = new THREE.Scene()
    const cameraSize = 600;

    const box = new THREE.Box3().setFromObject(mesh)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const objZoomWidth = cameraSize / (size.x + Math.abs(center.x) * 2)
    const objZoomHeight = cameraSize / (size.z + Math.abs(center.z) * 2)
    const objZoom = Math.min(objZoomWidth, objZoomHeight)
    this.imgBeCreateByScale = objZoom
    mesh.scale.set(objZoom, 1, objZoom)

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

    scene.add(mesh)
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

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { x, y, scale } = data;
    const screenX = x * zoomLevel;
    const screenY = y * zoomLevel;
    const angleY = data.angleY;// * -1 + Math.PI / 2
    const preImgScale = scale / this.imgBeCreateByScale

    const { width, height } = this.img;
    ctx.save(); // 保存当前状态
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
    // 计算中心点到上下左右哪个边最远
    const [basicSize] = this.basicBoxData_!
    const renderBox = this.boundingBoxData;

    // 绘制 轮廓
    (() => {
      if (!renderBox) return
      const offset = renderBox[1];
      const matchArea = new MatchRectArea({
        x: data.x + offset.x,
        y: data.y + offset.z,
        width: basicSize.x,
        depth: basicSize.z,
        angleY: data.angleY,
      })
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.save(); // 保存当前状态
      ctx.translate(
        matchArea.data.x * zoomLevel,
        matchArea.data.y * zoomLevel
      ); // 移动原点到目标中心
      ctx.rotate(matchArea.data.angleY * -1); // 围绕新原点旋转
      // 绘制一个方块
      ctx.strokeRect(
        matchArea.data.width / -2 * zoomLevel * data.scale,
        matchArea.data.depth / -2 * zoomLevel * data.scale,
        matchArea.data.width * zoomLevel * data.scale,
        matchArea.data.depth * zoomLevel * data.scale,
      )
      ctx.restore(); // 恢复原始状态
    })();

    // 控制点
    super.draw2DActionHandle(ctx, zoomLevel)
  }

  create3DMesh(): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { fileTypeId } = data
    const findObjInfo = window.worldState.allImportFiles.find(item => item.fileTypeId === fileTypeId)
    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    // @ts-ignore
    const threeObject = findObjInfo.mesh as THREE.Group | undefined;

    // 如果有预加载的本地模型对象，直接使用
    if (threeObject) {
      const clonedObject = threeObject.clone()
      group.add(clonedObject)
      this.reBuildBoundingBoxData()
      return [group]
    }

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

  // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { scale, angleY } = this.getData()
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

  // 当前对象是否需要重新生成3D模型状态
  create3DUnionKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
      scale: undefined,
    }
    // console.log('dddd', this.type + JSON.stringify(cacheData))
    return JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等，模型本身不变
  change3DMeshState(): void {
    const data = this.getData();
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.rotation.y = data.angleY
      v.scale.set(data.scale, data.scale, data.scale)
    })
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const [box, center, angel] = this.getBoundingBoxData()
    if (isPointInRotatedRect(x, y, {
      x: data.x + center.x,
      y: data.y + center.z,
      width: box.x,
      depth: box.z,
      angleY: angel.y,
    })) {
      return new MatchRectArea({
        x: data.x + center.x,
        y: data.y + center.z,
        width: box.x,
        depth: box.z,
        angleY: angel.y,
      })
    }
    return null;
  }

  inSceneSnapPointArea() {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const { x, y, id } = this.getData()
    // 计算旋转后的点
    // const rotatedX = x * Math.cos(angleY) - y * Math.sin(angleY)
    // const rotatedY = x * Math.sin(angleY) + y * Math.cos(angleY)

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

  inSceneSnapLineArea() {
    return false
  }

  getEditPropConfigData(data: ImportFileData): editItem[] {
    return [
      {
        id: 'z',
        label: '高度',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      },
      {
        id: 'scale',
        label: '缩放',
        dataType: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
        value: data.scale,
      },
    ]
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    const configList: editItem[] = [
      ...this.getEditPropConfigData(data),
      {
        id: 'downLoadFile',
        label: '下载文件',
        dataType: 'button',
        value: () => {
          const { fileTypeId } = this.getData();
          const findObjInfo = window.worldState.allImportFiles.find(item => item.fileTypeId === fileTypeId)
          if (findObjInfo) {
            const file: File = findObjInfo.file
            const url = URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }
      },
    ]
    editShow(configList, (val) => {
      this.setData({
        // ...data,
        ...val,
      })
    })
  }
}
