import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { CirclePlaneData } from './index.d'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchCircleArea } from '@/utils/matchArea';
import { importImgFileHead } from '../allObjs';
import { allSnapFromType } from '@/types/baseEntity';
import { PointCanAngleEntity } from '@/types/pointCanAngleEntity';
import { resize } from '@/utils/handleImgs';

export class CirclePlaneEntity extends PointCanAngleEntity<CirclePlaneData> {
  name: string = '圆形平面'
  type: string = 'circlePlane'
  private circleRadius = 6
  private static textureLoader = new THREE.TextureLoader();
  private static textureCache = new Map<string | File, THREE.Texture>();

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { r } = data;
    const screenX = data.x * zoomLevel;
    const screenY = data.y * zoomLevel;

    // 绘制一个圆形
    ctx.fillStyle = data.color
    ctx.strokeStyle = 'grey'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(
      screenX,
      screenY,
      r * zoomLevel,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();

    // 绘制轮廓
    const circleArea = new MatchCircleArea({ x: data.x, y: data.y, r: data.r })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      circleArea.data.x * zoomLevel,
      circleArea.data.y * zoomLevel
    );
    ctx.beginPath()
    ctx.arc(
      0,
      0,
      circleArea.data.r * zoomLevel,
      0,
      Math.PI * 2,
    )
    ctx.stroke()
    ctx.restore(); // 恢复原始状态

    // 控制点
    super.draw2DActionHandle(ctx, zoomLevel);
    // 调整半径的控制点
    (() => {
      const circleRadius = this.getCircleRadius() * zoomLevel + 3;
      const imgSize = circleRadius * 1.5;
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      const screenX = (data.x + data.r) * zoomLevel;
      const screenY = data.y * zoomLevel;

      ctx.beginPath()
      ctx.arc(screenX, screenY, circleRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke();
      ctx.drawImage(resize, screenX - imgSize / 2, screenY - imgSize / 2, imgSize, imgSize);
    })();
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { color, mt, r, ds, img, angleY } = data;

    const geometry = new THREE.CircleGeometry(r, 32);
    let material: THREE.Material | null = null;

    if (img) {
      let texture = CirclePlaneEntity.textureCache.get(img);
      if (!texture) {
        if (img.startsWith(importImgFileHead)) {
          const findImportFile = window.worldState.allImportImgs.find(item => item.fileTypeId === img);
          if (findImportFile) {
            const imgFile: File = findImportFile.file as File;
            const objectUrl = URL.createObjectURL(imgFile);
            texture = CirclePlaneEntity.textureLoader.load(objectUrl);
            texture.flipY = false;
            CirclePlaneEntity.textureCache.set(img, texture);
          }
        } else {
          texture = CirclePlaneEntity.textureLoader.load(img);
          texture.flipY = false;
          CirclePlaneEntity.textureCache.set(img, texture);
        }
      }
      material = new THREE.MeshStandardMaterial({
        map: texture,
        color: '#ffffff',
        transparent: true,
        alphaTest: 0.1,
      });
    } else {
      const materialById = mt ? getMaterialById(mt) : null;
      if (mt && materialById) {
        material = materialById.material(new THREE.Vector3(0, 1, 0))
      } else {
        material = (new THREE.MeshStandardMaterial({ color }));
      }
    }

    if (material && ds) {
      material.side = THREE.DoubleSide;
    }
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    group.add(mesh);
    group.rotateY(angleY);
    return [
      group
    ]
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r } = this.getData();
    return [
      new THREE.Vector3(r * 2, 0, r * 2),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < data.r) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: data.r })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const circleRadius = this.getCircleRadius();

    const dist = Math.hypot(x - (data.x + data.r), y - data.y)
    if (dist < circleRadius) {
      return {
        index: 2,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    return super.matchHandelInfo(x, y)
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index === 2) {
      const data = this.getData()
      const dist = Number((position.x - data.x).toFixed(1));
      this.setData({
        r: dist,
      } as Partial<CirclePlaneData>)
      return [dist + 'cm']
    } else {
      super.matchHandelMoveCallback(position, matchHandelInfo)
    }
  }

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

  getEditPropConfigData(data: CirclePlaneData): editItem[] {
    return [
      {
        id: 'r',
        label: '半径',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 1,
        value: data.r,
      },
      {
        id: 'z',
        label: '距离地面高度',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
      },
      {
        id: 'mt',
        label: '材质',
        dataType: 'material',
        value: data.mt,
      },
      {
        id: 'img',
        label: '图片',
        dataType: 'img',
        value: data.img || '',
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'ds',
        label: '是否双面可见',
        dataType: 'boolean',
        value: data.ds,
      },
    ]
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
}
