import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { CubeData } from './index.d'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { MatchRectArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';
import { PointCanAngleEntity } from '@/types/pointCanAngleEntity';

export class CubeEntity extends PointCanAngleEntity<CubeData> {
  name: string = '方块'
  type: string = 'cube'

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const screenX = data.x * zoomLevel;
    const screenY = data.y * zoomLevel;
    const { width, depth, angleY } = data;

    // 绘制一个方块
    ctx.fillStyle = data.color
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.fillRect(
      width / -2 * zoomLevel,
      depth / -2 * zoomLevel,
      width * zoomLevel,
      depth * zoomLevel
    )
    ctx.restore(); // 恢复原始状态
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();

    // 绘制 轮廓
    const matchArea = new MatchRectArea({
      x: data.x,
      y: data.y,
      width: data.width,
      depth: data.depth,
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
      matchArea.data.width / -2 * zoomLevel,
      matchArea.data.depth / -2 * zoomLevel,
      matchArea.data.width * zoomLevel,
      matchArea.data.depth * zoomLevel,
    )
    ctx.restore(); // 恢复原始状态
    // 控制点
    super.draw2DActionHandle(ctx, zoomLevel)
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { width, height, depth, color, mt, angleY } = data;

    const geometry = new THREE.BoxGeometry(
      width,
      height,
      depth
    );

    const materials = [];
    if (mt) {
      const getMat = getMaterialById(mt);
      if (getMat) {
        materials.push(getMat.material(new THREE.Vector3(1, 0, 0)));
        materials.push(getMat.material(new THREE.Vector3(1, 0, 0)));
        materials.push(getMat.material(new THREE.Vector3(0, 1, 0)));
        materials.push(getMat.material(new THREE.Vector3(0, 1, 0)));
        materials.push(getMat.material(new THREE.Vector3(0, 0, 1)));
        materials.push(getMat.material(new THREE.Vector3(0, 0, 1)));
      } else {
        const defaultMat = new THREE.MeshStandardMaterial({ color });
        for (let i = 0; i < 6; i++) {
          materials.push(defaultMat);
        }
      }
    } else {
      const defaultMat = new THREE.MeshStandardMaterial({ color });
      for (let i = 0; i < 6; i++) {
        materials.push(defaultMat);
      }
    }

    const mesh = new THREE.Mesh(geometry, materials)
    mesh.position.setY(data.height / 2)
    group.add(mesh);
    group.rotateY(angleY);
    return [
      group
    ]
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, depth, angleY } = this.getData();
    return [
      new THREE.Vector3(width, height, depth),
      new THREE.Vector3(0, height / 2, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: data.width,
      depth: data.depth,
      angleY: data.angleY,
    })) {
      return new MatchRectArea(data)
    }
    return null;
  }

  // matchHandelInfo(x: number, y: number) {
  //   const data = this.getData();
  //   const drawAngelLength = Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
  //   // 控制点向着angleY角度延伸10个单位后的坐标
  //   const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
  //   const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

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
  //   const parentHandle = super.matchHandelInfo(x, y)
  //   if (parentHandle) {
  //     return parentHandle
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
  //       // ...this.getData(),
  //       angleY: angleY * -1,
  //     })
  //   } else {
  //     return super.matchHandelMoveCallback(position, matchHandelInfo)
  //   }
  // }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    const data = this.getData();
    return [{
      objType: this.type,
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

  getEditPropConfigData(data: CubeData): editItem[] {
    return [
      {
        id: 'width',
        label: '长度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'depth',
        label: '宽度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 10,
        value: data.depth,
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
        label: '材质',
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
        id: 'angleY',
        label: '旋转角度',
        dataType: 'number',
        min: -180,
        max: 180,
        step: 1,
        value: data.angleY,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      }
    ];
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow(this.getEditPropConfigData(data), (val) => {
      this.setData({
        // ...data,
        ...val,
      })
    })
  }

  inSceneSnapPointArea() {
    return false
  }

  inSceneSnapLineArea() {
    return false
  }

  create3DUnionKey() {
    const data = this.getData();
    const cacheData = {
      ...data,
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
    }
    return JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等，模型本身不变
  change3DMeshState(): void {
    const data = this.getData();
    this.meshList.position.set(data.x, data.z, data.y)
    this.meshList.rotation.y = data.angleY
  }
}
