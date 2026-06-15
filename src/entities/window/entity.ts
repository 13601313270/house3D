import { Point, HandelInfo } from '@/types/map2d'
import { EntityClassInWall } from '@/types/entityInWall'
import { WindowData } from './index.d'
import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { World } from '@/utils/world';
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { WindowDataClass } from './dataClass';
import { MatchRectArea } from '@/utils/matchArea'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { allSnapFromType } from '@/types/baseEntity';

export class WindowEntity extends EntityClassInWall<WindowData> {
  name: string = '窗户'
  type: string = 'window'
  isPointObj: boolean = true
  private circleRadius = 6

  constructor(world: World, window: WindowData) {
    super(world, window)
    if (window && window.wallId) {
      if (!this.world.allFileMapObjects.wall) {
        this.world.allFileMapObjects.wall = []
      }
      const wall = this.world.allFileMapObjects.wall.find((entity) => {
        return entity.getData().id === window.wallId
      });
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
  }

  defaultValue(): WindowData {
    const window: WindowData = {
      id: Date.now().toString(),
      wallPointId: -1,
      wallId: '',
      x: 0,
      y: 0,
      z: 0,
      width: 120,
      height: 120,
      angle: 0,
      bottom: 40,
      bqc: '#3498db',
      bmt: 1,
      tc: '#3498db',
      tmt: 1,
      ic: '#3498db',
      icmt: 1,
      hasBorder: false,// 是否有窗户框
      rightOpenAngle: 0, // 右门打开角度
      leftOpenAngle: 0, // 左门打开角度
    }
    return new WindowDataClass(window)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: WindowData, panOffset: Point, zoomLevel: number): void {
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const findWall = this.world.allFileMapObjects.wall.find((entity) => entity.getData().id === data.wallId);
    let wallThickness = 10;
    if (findWall) {
      wallThickness = findWall.getData().thickness;
    }
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    const {
      hasBorder,
      bqc,
      tc
    } = data
    const width = data.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(data.angle)

    ctx.fillStyle = hasBorder ? bqc : tc
    ctx.strokeStyle = hasBorder ? bqc : tc
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: WindowData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    ctx.beginPath()
    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === data.wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    // const dist = Math.hypot(x - data.x, y - data.y)
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: data.width,
      depth: Math.max(wallThickness + 20, 20),
      angleY: data.angle,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width: data.width,
        depth: Math.max(wallThickness + 20, 20),
        angleY: data.angle * -1,
      })
    }
    return null;
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number): HandelInfo | null {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        id: data.id,
        type: this.type,
        dist,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }) {
    const { x, y } = position
    this.changePosition({ x, y })
  }

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group();
    const {
      bqc,
      tc,
      ic,
    } = data
    const baseZ = data.height / 2 + (data.bottom || 0);
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === data.wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const geometry = new THREE.BoxGeometry(
      data.width * 1,
      data.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 'white', opacity: 0.1, transparent: true })
    const windowMesh = new THREE.Mesh(geometry, material)
    windowMesh.position.setY(baseZ)
    group.add(windowMesh);

    // group添加门框
    (() => {
      if (!data.hasBorder) return
      const border = 7;
      const geometryRight = new THREE.BoxGeometry(
        border,
        data.height * 1 + border,
        wallThickness + 4
      );
      const material = getMaterialById(data.bmt)?.material(new THREE.Vector3(0, 0, 0)) || new THREE.MeshStandardMaterial({ color: bqc })
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2 + border / 2 - 1)
      doorMeshRight.position.setY(baseZ)
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1 + border,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2 - border / 2 + 1)
      doorMeshLeft.position.setY(baseZ)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border * 2 - 2,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2 + border / 2 - 2 + baseZ)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + border * 2 - 2,
        border,
        wallThickness + 4
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2 - border / 2 + 1 + baseZ)
      group.add(doorMeshBottom);
    })();
    // 内部的框
    const innerKborder = 4;
    (() => {
      const material = getMaterialById(data.tmt)?.material(new THREE.Vector3(0, 0, 0)) || new THREE.MeshStandardMaterial({ color: tc })

      const geometryRight = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2)
      doorMeshRight.position.setY(baseZ)
      group.add(doorMeshRight);

      const geometryCenter = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );

      const doorMeshCenter = new THREE.Mesh(geometryCenter, material)
      doorMeshCenter.position.setX(0)
      doorMeshCenter.position.setY(baseZ)
      group.add(doorMeshCenter);

      const geometryLeft = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      doorMeshLeft.position.setY(baseZ)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + innerKborder,
        innerKborder,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2 - 1 + baseZ)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + innerKborder,
        innerKborder,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2 + baseZ)
      group.add(doorMeshBottom);
    })();
    const windowKWidth = 4;
    const windowMaterial = getMaterialById(data.icmt)?.material(new THREE.Vector3(0, 0, 0)) || new THREE.MeshStandardMaterial({ color: ic });
    (() => {
      const rightWindowGorup = new THREE.Group()
      // 两扇扇面

      const leftX = data.width / -2 + windowKWidth + innerKborder / 2
      const rightX = -windowKWidth / 2;
      // 右
      const geometryRight = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const meshRight = new THREE.Mesh(geometryRight, windowMaterial)
      meshRight.position.setX(rightX)
      rightWindowGorup.add(meshRight)
      // 左
      const geometryLeft = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, windowMaterial)
      doorMeshLeft.position.setX(leftX)
      rightWindowGorup.add(doorMeshLeft)
      // 上
      const geometryTop = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, windowMaterial)
      doorMeshTop.position.setY(data.height / 2 - windowKWidth)
      doorMeshTop.position.setX((leftX + rightX) / 2)
      rightWindowGorup.add(doorMeshTop)
      // 下
      const geometryBottom = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, windowMaterial)
      doorMeshBottom.position.setY(-data.height / 2 + windowKWidth)
      doorMeshBottom.position.setX((leftX + rightX) / 2)
      rightWindowGorup.add(doorMeshBottom)

      // 组合起来
      rightWindowGorup.position.setX(data.width / 2 - innerKborder / 2)
      rightWindowGorup.rotation.y = THREE.MathUtils.degToRad(data.rightOpenAngle * -1 || 0)
      rightWindowGorup.position.setY(baseZ)
      group.add(rightWindowGorup);
    })();
    (() => {
      const leftWindowGorup = new THREE.Group()
      const leftX = windowKWidth / 2;// data.width / -2 + windowKWidth + innerKborder / 2
      const rightX = data.width / 2 - windowKWidth - innerKborder / 2;
      // 右
      const geometryRight = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const doorMeshRight = new THREE.Mesh(geometryRight, windowMaterial)
      doorMeshRight.position.setX(rightX)
      leftWindowGorup.add(doorMeshRight)
      // 左
      const geometryLeft = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const meshLeft = new THREE.Mesh(geometryLeft, windowMaterial)
      meshLeft.position.setX(leftX)
      leftWindowGorup.add(meshLeft)
      // 上
      const geometryTop = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, windowMaterial)
      doorMeshTop.position.setY(data.height / 2 - windowKWidth)
      doorMeshTop.position.setX((leftX + rightX) / 2)
      leftWindowGorup.add(doorMeshTop)
      // 下
      const geometryBottom = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, windowMaterial)
      doorMeshBottom.position.setY(-data.height / 2 + windowKWidth)
      doorMeshBottom.position.setX((leftX + rightX) / 2)
      leftWindowGorup.add(doorMeshBottom)

      // 组合起来
      leftWindowGorup.position.setX(data.width / -2 + innerKborder / 2)
      leftWindowGorup.rotation.y = THREE.MathUtils.degToRad(data.leftOpenAngle || 0)
      leftWindowGorup.position.setY(baseZ)
      group.add(leftWindowGorup);
    })();
    // group.position.set(data.x, data.height / 2 + (data.bottom || 0), data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshList[data.wallPointId]) {
      const boxLength = wall.meshList.filter(v => 'isWall' in v).length;
      const countPerPoint = (boxLength - 1) / (wall.getData().points.length - 2)
      const wallGroup = wall.meshList[data.wallPointId * countPerPoint];
      const subtractGeometry = new THREE.BoxGeometry(
        data.width,
        data.height,
        wallThickness + 10
      );
      subtractGeometry.rotateY(data.angle * -1);
      const cylinderBrush = new Brush(subtractGeometry);
      cylinderBrush.position.set(data.x, data.height / 2 - 1 + (data.bottom || 0), data.y)
      cylinderBrush.updateMatrixWorld()
      // console.log('dddddddd', countPerPoint, wallGroup)
      const firstMesh = wallGroup.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh;
      const boxBrush = new Brush(firstMesh.geometry.clone());// 主体
      boxBrush.position.set(
        wallGroup.position.x,
        wallGroup.position.y,
        wallGroup.position.z
      )
      // 3. 执行布尔运算 (立方体减去圆柱体)
      const evaluator = new Evaluator();
      // 注意：这里 SUBTRACTION 的顺序很重要：主体减去洞模型
      const resultGeometry = evaluator.evaluate(boxBrush, cylinderBrush, SUBTRACTION);

      if (firstMesh) {
        firstMesh.geometry = resultGeometry.geometry;
      }
      // // 4. 创建最终的网格
      // const material = new THREE.MeshStandardMaterial({ color: 0x00aaff, side: THREE.DoubleSide });
      // const resultMesh = new THREE.Mesh(resultGeometry.geometry, material);
      // resultMesh.position.set(wallMesh.position.x, wallMesh.position.y, wallMesh.position.z + 3)
      // resultMesh.rotateY(this.data.angle * -1);
      return [
        group,
        // resultMesh
      ]
    } else {
      return [
        group
      ]
    }
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, bottom, z, angle } = this.getData();
    const thickness = 20;
    return [
      new THREE.Vector3(width, height, thickness),
      new THREE.Vector3(0, height / 2 + (bottom || 0) + z, 0),
      new THREE.Vector3(0, angle * -1, 0)
    ]
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    const data = this.getData();
    return [{
      objType: this.type,
      objId: data.id,
      snapFromType: key,
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

  setData(data: WindowData) {
    const oldData = this.getData()
    console.log('oldData-wallId', oldData.wallId)
    // 双向去除原有的关联对象的缓存，也需要重新渲染
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.remove3DCache()
      }
    })
    super.setData(data)
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'bottom',
        label: '距离地面',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.bottom,
      },
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.width,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.height,
      },
      {
        id: 'hasBorder',
        label: '是否有包墙',
        dataType: 'boolean',
        value: data.hasBorder,
      },
      {
        id: 'bqc',
        label: '包墙颜色',
        dataType: 'color',
        value: data.bqc,
      },
      {
        id: 'bmt',
        label: '包墙材质',
        dataType: 'material',
        value: data.bmt,
      },
      {
        id: 'tc',
        label: '门框颜色',
        dataType: 'color',
        value: data.tc,
      },
      {
        id: 'tmt',
        label: '门框材质',
        dataType: 'material',
        value: data.tmt,
      },
      {
        id: 'ic',
        label: '玻璃框颜色',
        dataType: 'color',
        value: data.ic,
      },
      {
        id: 'icmt',
        label: '玻璃框材质',
        dataType: 'material',
        value: data.icmt,
      },
      {
        id: 'rightOpenAngle',
        label: '右门打开角度',
        dataType: 'number',
        min: 0,
        max: 180,
        step: 15,
        value: data.rightOpenAngle,
      },
      {
        id: 'leftOpenAngle',
        label: '左门打开角度',
        dataType: 'number',
        min: 0,
        max: 180,
        step: 15,
        value: data.leftOpenAngle,
      },
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
