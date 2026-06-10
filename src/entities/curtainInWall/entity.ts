import { HandelInfo, ObjData, Point } from '@/types/map2d'
import * as THREE from 'three'
import { CurtainInWallData } from './index.d'
import { EntityClass, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
import { CurtainInWallDataClass } from './dataClass';
import { EntityClassInWall } from '@/types/entityInWall'
import { MatchRectArea } from '@/utils/matchArea'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { importImgFileHead } from '../allObjs'

export class CurtainInWallEntity extends EntityClassInWall<CurtainInWallData> {
  name: string = '方形幕布(挂在墙上)'
  type: string = 'curtainInWall'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'
  private baseDrawAngelLength = 40;
  img: HTMLImageElement = new Image()
  private circleRadius = 6
  private depth = 5

  private static textureLoader = new THREE.TextureLoader();
  private static textureCache = new Map<string | File, THREE.Texture>();

  defaultValue(): CurtainInWallData {
    const data: CurtainInWallData = {
      width: 200,
      height: 200,
      wallPointId: -1,
      wallId: '',
      angle: 0,
      bottom: 40,
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      img: '',
      isOuter: false,
    }
    return new CurtainInWallDataClass(data)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: CurtainInWallData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { width, isOuter, angle, wallId } = data;
    const angleY = data.angle || 0;// 历史数据问题

    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth) * zoomLevel;
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth) * zoomLevel;

    // 绘制一个方块
    ctx.fillStyle = '#be4141'
    ctx.save(); // 保存当前状态

    ctx.translate(screenX + offsetX / 2, screenY + offsetY / 2); // 移动原点到目标中心
    ctx.rotate(angleY); // 围绕新原点旋转
    // 绘制一个方块
    ctx.fillRect(
      width / -2 * zoomLevel,
      this.depth / -2 * zoomLevel,
      width * zoomLevel,
      this.depth * zoomLevel
    )
    ctx.restore(); // 恢复原始状态
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: CurtainInWallData,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const { isOuter, angle, wallId } = data;
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth) * zoomLevel;
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth) * zoomLevel;
    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX + offsetX / 2, screenY + offsetY / 2, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  create3DMesh(): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { wallId, img, width, height, isOuter } = data
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    // 将方向向量旋转90度
    let material: THREE.MeshStandardMaterial | null = null;
    if (img) {
      let texture = CurtainInWallEntity.textureCache.get(img);
      if (!texture) {
        if (img.startsWith(importImgFileHead)) {
          const findImportFile = this.world.allImportImgs.find(item => item.fileTypeId === img);
          if (findImportFile) {
            const imgFile: File = findImportFile.file as File;
            const objectUrl = URL.createObjectURL(imgFile);
            texture = CurtainInWallEntity.textureLoader.load(objectUrl);
            // texture.flipY = false;
            CurtainInWallEntity.textureCache.set(img, texture);
          }
        } else {
          texture = CurtainInWallEntity.textureLoader.load(img);
          // texture.flipY = false;
          CurtainInWallEntity.textureCache.set(img, texture);
        }
      }
      material = new THREE.MeshStandardMaterial({
        map: texture,
        color: '#ffffff',
        transparent: true,
        alphaTest: 0.1,
      });
    } else {
      material = new THREE.MeshStandardMaterial({ color: '#8b8b8b' });
    }
    if (material) {
      material.side = THREE.DoubleSide;
    }
    const plane = new THREE.PlaneGeometry(width, height)
    const planeMesh = new THREE.Mesh(plane, material!)
    if (isOuter) {
      planeMesh.position.set(0, height / 2, (wallThickness + 3) / -2)
      planeMesh.rotation.y = Math.PI
    } else {
      planeMesh.position.set(0, height / 2, (wallThickness + 3) / 2)
      planeMesh.rotation.y = 0
    }
    group.add(planeMesh)
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, angle } = this.getData();
    return [
      new THREE.Vector3(width, height, this.depth),
      new THREE.Vector3(0, height / 2, 0),
      new THREE.Vector3(0, angle, 0)
    ]
  }

  // 当前对象是否需要重新生成3D模型状态
  meshNeedChangeKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      wallId: undefined,
      wallPointId: undefined,
      angle: undefined,
    }
    // console.log('dddd', this.type + JSON.stringify(cacheData))
    return this.type + JSON.stringify(cacheData)
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
    const { isOuter, angle, wallId } = data;

    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth);
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth);
    if (isPointInRotatedRect(x, y, {
      x: data.x + offsetX / 2,
      y: data.y + offsetY / 2,
      width: data.width + 30,
      depth: this.depth + this.circleRadius,
      angleY: angle,
    })) {
      return new MatchRectArea({
        x: data.x + offsetX / 2,
        y: data.y + offsetY / 2,
        width: data.width,
        depth: this.depth,
        angleY: angle * -1,
      })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const { isOuter, angle, wallId } = data;

    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth);
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * (wallThickness + this.depth);
    const dist = Math.hypot(x - (data.x + offsetX / 2), y - (data.y + offsetY / 2))
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
      this.changePosition({ x, y })
    }
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    return []
    // const { x, y, angle, id } = this.getData()
    // // 计算旋转后的点
    // // const rotatedX = x * Math.cos(angle) - y * Math.sin(angle)
    // // const rotatedY = x * Math.sin(angle) + y * Math.cos(angle)

    // return [{
    //   objType: this.type,
    //   objId: id,
    //   snapFromType: 'point',
    //   point: {
    //     index: 0,
    //     x,
    //     y,
    //   },
    // }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    const configList: editItem[] = [
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.height,
      },
      {
        id: 'img',
        label: '图片',
        dataType: 'img',
        value: data.img,
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
        id: 'isOuter',
        label: '是否挂在外墙',
        dataType: 'boolean',
        value: data.isOuter,
      },
    ]
    editShow(configList, (val) => {
      this.setData({
        ...this.getData(),
        ...val,
      })
    })
  }

  inSceneSnapLineArea(obj: EntityClass<ObjData>, line: [Point, Point], point: Point) {
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
