import { Point } from '@/types/map2d'
import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Door } from './index.d'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { editItem } from '..';
import { World } from '@/utils/world';
import { Wall } from '../wall/index.d';
import { getMaterialById } from '@/material';

export function createDoorData() {
  const door: Door = {
    id: Date.now().toString(),
    wallPointId: -1,
    x: 0,
    y: 0,
    z: 0,
    width: 110,
    height: 180,
    openAngle: 0,
    angle: 0,
    hasBorder: true,
    color: '#e67e22',
    mt: 3,
    openType: 1,
  }
  return door
}

export function editPropConfig(): editItem[] {
  return [
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
      id: 'mt',
      label: '门材质',
      dataType: 'material',
    },
    {
      id: 'color',
      label: '颜色',
      dataType: 'color',
    },
    {
      id: 'hasBorder',
      label: '是否有门框',
      dataType: 'boolean',
    },
    {
      id: 'openAngle',
      label: '门打开的角度',
      dataType: 'number',
    },
    {
      id: 'openType',
      label: '开门方式(1内左开 2内右开 3外左开 4外右开)',
      dataType: 'number',
    },
  ]
}

export class DoorEntity extends EntityClass<Door> {
  type: EntityType = 'door'
  isPointObj: boolean = true

  constructor(world: World, door: Door) {
    super(world, door)
    if (door.wallId) {
      const wall = this.world.allFileMapObjects.wall.find((entity) => entity.getData().id === door.wallId);
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    const findWall = this.world.allFileMapObjects.wall.find((entity) => entity.getData().id === data.wallId);
    let wallThickness = 10;
    if (findWall) {
      wallThickness = findWall.getData().thickness;
    }
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    // const wallThickness = 10; // walls.find((wall) => wall.id === this.wallId)?.thickness || 0;
    const color = data.color
    const width = data.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(data.angle)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, -Math.PI / 4, Math.PI / 4)
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  glbObj: THREE.Group | null = null;

  create3DMesh(scene: THREE.Scene) {
    // 加载 https://video-obj.oss-cn-beijing.aliyuncs.com/door.glb
    const data = this.getData();
    const group = new THREE.Group()
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === data.wallId
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const changeBLBState = () => {
      if (this.glbObj) {
        this.glbObj.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.material = material
          }
        })
        if (data.openType === 1) {
          this.glbObj.position.set(data.width / -2.1, data.height / -2, wallThickness / 2);
          this.glbObj.scale.set(data.width * 0.23, data.height * 0.11, wallThickness * 2);
          this.glbObj.rotation.y = THREE.MathUtils.degToRad(data.openAngle * -1 || 0);
        }
        else if (data.openType === 2) {
          this.glbObj.position.set(data.width / 2.1, data.height / -2, wallThickness / 2);
          this.glbObj.scale.set(data.width * -0.23, data.height * 0.11, wallThickness * 2);
          this.glbObj.rotation.y = THREE.MathUtils.degToRad(data.openAngle || 0);
        }
        else if (data.openType === 3) {
          this.glbObj.position.set(data.width / -2.1, data.height / -2, wallThickness / -2);
          this.glbObj.scale.set(data.width * 0.23, data.height * 0.11, wallThickness * -2);
          this.glbObj.rotation.y = THREE.MathUtils.degToRad(data.openAngle || 0);
        }
        else if (data.openType === 4) {
          this.glbObj.position.set(data.width / 2.1, data.height / -2, wallThickness / -2);
          this.glbObj.scale.set(data.width * -0.23, data.height * 0.11, wallThickness * -2);
          this.glbObj.rotation.y = THREE.MathUtils.degToRad(data.openAngle * -1 || 0);
        }
      }
    }
    if (this.glbObj === null) {
      const loader = new GLTFLoader();
      loader.load('https://video-obj.oss-cn-beijing.aliyuncs.com/door.glb', (gltf: any) => {
        this.glbObj = gltf.scene;
        // 旋转45度
        changeBLBState()
        group.add(gltf.scene)
      });
    }

    // group添加门
    const geometry = new THREE.BoxGeometry(
      data.width * 1,
      data.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));
    // const doorMesh = new THREE.Mesh(geometry, material);
    // group.add(doorMesh);

    // group添加门框
    (() => {
      if (!data.hasBorder) return
      const border = 7;
      const geometryRight = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2)
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2)
      group.add(doorMeshTop);
    })();
    if (this.glbObj) {
      changeBLBState()
      group.add(this.glbObj)
    }

    group.position.set(data.x, data.height / 2, data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshList[data.wallPointId]) {
      const wallGroup = wall.meshList[data.wallPointId];
      const subtractGeometry = new THREE.BoxGeometry(
        data.width,
        data.height,
        wallThickness + 10
      );
      subtractGeometry.rotateY(data.angle * -1);
      // subtractGeometry.position.set(data.x, data.height / 2 - 1, data.y)
      const cylinderBrush = new Brush(subtractGeometry);
      cylinderBrush.position.set(data.x, data.height / 2, data.y)
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
        firstMesh.geometry = resultGeometry.geometry
      }
      return [
        group,
      ]
    } else {
      return [
        group
      ]
    }
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 6 * zoomLevel) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
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

  afterBeSnapByLine(obj: EntityClass<Wall>, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const data = this.getData();
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      data.angle = nearestAngle
      data.wallId = obj.getData().id
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
