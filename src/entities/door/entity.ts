import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DoorData } from './index.d'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { allSnapFromType } from '@/types/pointEntity'
import { EntityClassInWall } from '@/types/entityInWall'
import { editItem } from '..';
import { World } from '@/utils/world';
import { getMaterialById } from '@/material';
import { DoorDataClass } from './dataClass';
import { MatchRectArea } from '@/utils/matchArea';
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';

export class DoorEntity extends EntityClassInWall<DoorData> {
  name: string = '门'
  type: string = 'door'
  isPointObj: boolean = true
  private circleRadius = 6

  constructor(world: World, door: DoorData) {
    super(world, door)
    if (door && door.wallId) {
      if (!this.world.allFileMapObjects.wall) {
        this.world.allFileMapObjects.wall = []
      }
      const wall = this.world.allFileMapObjects.wall.find((entity) => entity.getData().id === door.wallId);
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
  }

  defaultValue(): DoorData {
    const door: DoorData = {
      id: Date.now().toString(),
      wallPointId: -1,
      x: 0,
      y: 0,
      z: 0,
      width: 110,
      height: 180,
      bottom: 0,
      openAngle: 0,
      angle: 0,
      hasBorder: true,
      color: '#e67e22',
      mt: 3,
      openType: 1,
    }
    return new DoorDataClass(door)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: DoorData, panOffset: Point, zoomLevel: number): void {
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
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
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: DoorData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    // console.log('zoomLevel---1', zoomLevel)
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    // 加载 https://video-obj.oss-cn-beijing.aliyuncs.com/door.glb
    const data = this.getData();
    const group = new THREE.Group()
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
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
        gltf.scene.position.setY(0)
        group.add(gltf.scene)
      });
    }
    const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));

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
      doorMeshRight.position.setY(data.height / 2)
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      doorMeshLeft.position.setY(data.height / 2)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height)
      group.add(doorMeshTop);
    })();
    if (this.glbObj) {
      changeBLBState()
      this.glbObj.position.setY(0)
      group.add(this.glbObj)
    }

    // group.position.set(data.x, data.height / 2, data.y)
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
      cylinderBrush.position.set(data.x, data.height / 2 + data.z, data.y)
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

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, bottom, z, angle } = this.getData();
    const thickness = 20;
    return [
      new THREE.Vector3(width, height, thickness + 10),
      new THREE.Vector3(0, height / 2 + (bottom || 0) + z, 0),
      new THREE.Vector3(0, angle * -1, 0)
    ]
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
    // console.log('zoomLevel---2', zoomLevel)
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: data.width,
      depth: Math.max(wallThickness + 20, 20),
      angleY: data.angle,
    })) {
      return new MatchRectArea({ x: data.x, y: data.y, width: data.width, depth: Math.max(wallThickness + 20, 20), angleY: data.angle * -1 })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('zoomLevel---2', zoomLevel)
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
  }) {
    const { x, y } = position
    this.changePosition({ x, y })
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

  setData(data: DoorData) {
    // 双向去除原有的关联对象
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
        min: 0,
        max: Infinity,
        step: 10,
        value: data.height,
      },
      {
        id: 'mt',
        label: '门材质',
        dataType: 'material',
        value: data.mt,
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'hasBorder',
        label: '是否有门框',
        dataType: 'boolean',
        value: data.hasBorder,
      },
      {
        id: 'openAngle',
        label: '门打开的角度',
        dataType: 'number',
        min: 0,
        max: 180,
        step: 15,
        value: data.openAngle,
      },
      {
        id: 'openType',
        label: '开门方式(1内左开 2内右开 3外左开 4外右开)',
        dataType: 'number',
        min: 1,
        max: 4,
        step: 1,
        value: data.openType,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -300,
        max: 300,
        step: 1,
        value: data.z,
      }
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
