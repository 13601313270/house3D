import { Point, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Window } from './index.d'
import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { World } from '@/utils/world';
import woodenMaterial from '@/material/wooden'
import { editItem } from '..';
import { getMaterialById } from '@/material';

export function createWindowData() {
  const window: Window = {
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
  return window
}

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'bottom',
      label: '距离地面',
      dataType: 'number',
    },
    {
      id: 'width',
      label: '宽度',
      dataType: 'number',
    },
    {
      id: 'height',
      label: '高度',
      dataType: 'number',
    },
    {
      id: 'hasBorder',
      label: '是否有包墙',
      dataType: 'boolean',
    },
    {
      id: 'bqc',
      label: '包墙颜色',
      dataType: 'color',
    },
    {
      id: 'bmt',
      label: '包墙材质',
      dataType: 'material',
    },
    {
      id: 'tc',
      label: '门框颜色',
      dataType: 'color',
    },
    {
      id: 'tmt',
      label: '门框材质',
      dataType: 'material',
    },
    {
      id: 'ic',
      label: '玻璃框颜色',
      dataType: 'color',
    },
    {
      id: 'icmt',
      label: '玻璃框材质',
      dataType: 'material',
    },
    {
      id: 'rightOpenAngle',
      label: '右门打开角度',
      dataType: 'number',
    },
    {
      id: 'leftOpenAngle',
      label: '左门打开角度',
      dataType: 'number',
    },
  ]
}

export class WindowEntity extends EntityClass<Window> {
  type: EntityType = 'window'
  isPointObj: boolean = true

  constructor(world: World, window: Window) {
    super(world, window)
    if (window.wallId) {
      const wall = this.world.allFileMapObjects.wall.find((entity) => {
        return entity.getData().id === window.wallId
      });
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    const data = this.getData();
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
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 6 * zoomLevel) {
      return {
        index: 0,
        id: data.id,
        type: this.type,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group();
    const {
      bqc,
      tc,
      ic,
    } = data
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
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1 + border,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2 - border / 2 + 1)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border * 2 - 2,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2 + border / 2 - 2)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + border * 2 - 2,
        border,
        wallThickness + 4
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2 - border / 2 + 1)
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
      group.add(doorMeshRight);

      const geometryCenter = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );

      const doorMeshCenter = new THREE.Mesh(geometryCenter, material)
      doorMeshCenter.position.setX(0)
      group.add(doorMeshCenter);

      const geometryLeft = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + innerKborder,
        innerKborder,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2 - 1)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + innerKborder,
        innerKborder,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2)
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
      group.add(leftWindowGorup);
    })();
    group.position.set(data.x, data.height / 2 + (data.bottom || 0), data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshList[data.wallPointId]) {
      const wallGroup = wall.meshList[data.wallPointId];
      const subtractGeometry = new THREE.BoxGeometry(
        data.width,
        data.height,
        wallThickness + 10
      );
      subtractGeometry.rotateY(data.angle * -1);
      const cylinderBrush = new Brush(subtractGeometry);
      cylinderBrush.position.set(data.x, data.height / 2 - 1 + (data.bottom || 0), data.y)
      cylinderBrush.updateMatrixWorld()
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

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      this.changePosition(newPosition.point)
      return true
    }
    return false
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

  afterBeSnapByLine(obj: EntityClass<Window>, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      const data = this.getData();
      const objData = obj.getData()
      data.angle = nearestAngle
      data.wallId = objData.id
      data.wallPointId = index

      // 双向去除原有的关联对象
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.associationEntity.splice(entity.associationEntity.indexOf(this), 1)
          entity.remove3DCache()
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      if (!this.associationEntity.includes(obj)) {
        this.associationEntity.push(obj)
      }
      if (!obj.associationEntity.includes(this)) {
        obj.associationEntity.push(this)
      }
      this.remove3DCache()
    }
  }
}
