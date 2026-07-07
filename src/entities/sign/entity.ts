import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { SignData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { SignDataClass } from './dataClass'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';
import { MatchRectArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';

import { loadImage as globalLoadImage } from '@/utils/imageCache'

export class SignEntity extends PointEntityClass<SignData> {
  name: string = '交通标识'
  type: string = 'sign'
  isPointObj: boolean = true
  private circleRadius = 6

  async init() {
    await super.init()
    const { img } = this.getData();
    const { viewImg } = img;
    if (viewImg) {
      await globalLoadImage(viewImg);
    }
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: SignData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { width } = data;
    const { angleY } = data;
    const length = 10;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(angleY * -1);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(
      width / -2 * zoomLevel,
      length / -2 * zoomLevel,
      width * zoomLevel,
      length * zoomLevel
    );

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1 * zoomLevel;
    ctx.strokeRect(
      width / -2 * zoomLevel,
      length / -2 * zoomLevel,
      width * zoomLevel,
      length * zoomLevel
    );

    ctx.restore();
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: SignData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    const { width } = data;
    const length = 10 + 4;

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const drawAngelLength = Math.max(width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angleY) * drawAngelLength
    const circleX = rotatedXAdd * zoomLevel + panOffset.x
    const circleY = rotatedYAdd * zoomLevel + panOffset.y
    const circleRadius = this.circleRadius * zoomLevel + 3

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel + panOffset.x, tempY * zoomLevel + panOffset.y]
    }

    // 绘制双向箭头表示旋转角度
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    // 绘制双向箭头的主线（圆弧）
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, angleY * -1 - Math.PI / 4, angleY * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(angleY + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(angleY + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(angleY + Math.PI / 4, drawAngelLength - 5)
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
    const [p1X, p1Y] = ttt(angleY - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(angleY - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(angleY - Math.PI / 4, drawAngelLength - 5)
    ctx.moveTo(
      p1X,
      p1Y
    )
    ctx.lineTo(p2X, p2Y)
    ctx.lineTo(p3X, p3Y)
    ctx.closePath()
    ctx.fill()
    // 绘制旋转角度线
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制 轮廓
    const matchArea = new MatchRectArea({
      x: data.x,
      y: data.y,
      width,
      depth: length,
      angleY,
    })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      matchArea.data.x * zoomLevel + panOffset.x,
      matchArea.data.y * zoomLevel + panOffset.y
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
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()
    const { width, height, signZ, img, poleRadius, bgColor, poleColor, shape } = data;
    const { viewImg } = img
    const angleY = data.angleY || 0;

    const poleHeight = signZ + height / 2;

    const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 32);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: poleColor });
    const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.setY(poleHeight / 2);
    group.add(poleMesh);

    const thickness = 2;
    const imageMaterial = new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load(viewImg)
    });
    const sideMaterial = new THREE.MeshStandardMaterial({ color: bgColor });

    let signMesh: THREE.Mesh;

    switch (shape) {
      case 'circle': {
        const circleShape = new THREE.Shape();
        const curve = new THREE.EllipseCurve(
          0, 0,
          width / 2, height / 2,
          0, 2 * Math.PI,
          false,
          0
        );
        const points = curve.getPoints(64);
        circleShape.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          circleShape.lineTo(points[i].x, points[i].y);
        }
        circleShape.closePath();

        const extrudeSettings = {
          depth: thickness,
          bevelEnabled: false,
        };
        const circleGeometry = new THREE.ExtrudeGeometry(circleShape, extrudeSettings);

        const positionAttr = circleGeometry.getAttribute('position');
        const uvAttr = circleGeometry.getAttribute('uv');

        for (let i = 0; i < positionAttr.count; i++) {
          const x = positionAttr.getX(i);
          const y = positionAttr.getY(i);
          const u = (x + width / 2) / width;
          const v = (y + height / 2) / height;
          uvAttr.setXY(i, u, v);
        }
        uvAttr.needsUpdate = true;

        const groups = circleGeometry.groups;
        if (groups.length >= 1) {
          const capGroup = groups[0];
          const capStart = capGroup.start;
          const capCount = capGroup.count;
          const halfCapCount = Math.floor(capCount / 2);

          circleGeometry.clearGroups();
          circleGeometry.addGroup(capStart, halfCapCount, 0);
          circleGeometry.addGroup(capStart + halfCapCount, capCount - halfCapCount, 1);
          if (groups.length >= 2) {
            const sideGroup = groups[1];
            circleGeometry.addGroup(sideGroup.start, sideGroup.count, 2);
          }
        }

        const materials = [
          sideMaterial,
          viewImg ? imageMaterial : sideMaterial,
          sideMaterial,
        ];
        signMesh = new THREE.Mesh(circleGeometry, materials);
        break;
      }
      case 'diamond': {
        const diamondShape = new THREE.Shape();
        diamondShape.moveTo(0, -height / 2);
        diamondShape.lineTo(width / 2, 0);
        diamondShape.lineTo(0, height / 2);
        diamondShape.lineTo(-width / 2, 0);
        diamondShape.closePath();

        const extrudeSettings = {
          depth: thickness,
          bevelEnabled: false,
        };
        const diamondGeometry = new THREE.ExtrudeGeometry(diamondShape, extrudeSettings);

        // 修正 UV 映射，使纹理填满菱形正面
        const positionAttr = diamondGeometry.getAttribute('position');
        const uvAttr = diamondGeometry.getAttribute('uv');

        for (let i = 0; i < positionAttr.count; i++) {
          const x = positionAttr.getX(i);
          const y = positionAttr.getY(i);
          // 将菱形坐标映射到 [0, 1] UV 范围
          const u = (x + width / 2) / width;
          const v = (y + height / 2) / height;
          uvAttr.setXY(i, u, v);
        }
        uvAttr.needsUpdate = true;

        // ExtrudeGeometry 默认只有两个 group：正面+背面共用材质0，侧面用材质1
        // 需要手动拆分 group，让正面和背面使用不同材质
        const groups = diamondGeometry.groups;
        if (groups.length >= 1) {
          // 原始 group 包含正面和背面的所有顶点
          const capGroup = groups[0];
          const capStart = capGroup.start;
          const capCount = capGroup.count;

          // 假设正面和背面各占一半顶点（ExtrudeGeometry 的生成顺序）
          const halfCapCount = Math.floor(capCount / 2);

          // 清除原有 groups，重新添加
          diamondGeometry.clearGroups();

          // 正面（前半部分）使用材质0
          diamondGeometry.addGroup(capStart, halfCapCount, 0);
          // 背面（后半部分）使用材质1
          diamondGeometry.addGroup(capStart + halfCapCount, capCount - halfCapCount, 1);
          // 侧面使用材质2
          if (groups.length >= 2) {
            const sideGroup = groups[1];
            diamondGeometry.addGroup(sideGroup.start, sideGroup.count, 2);
          }
        }
        const materials = [
          sideMaterial, // 背面
          viewImg ? imageMaterial : sideMaterial, // 正面
          sideMaterial, // 背面
        ];
        signMesh = new THREE.Mesh(diamondGeometry, materials);
        break;
      }
      case 'triangle': {
        const triangleShape = new THREE.Shape();
        triangleShape.moveTo(0, height / 2);
        triangleShape.lineTo(width / 2, -height / 2);
        triangleShape.lineTo(-width / 2, -height / 2);
        triangleShape.closePath();

        const extrudeSettings = {
          depth: thickness,
          bevelEnabled: false,
        };
        const triangleGeometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);

        const positionAttr = triangleGeometry.getAttribute('position');
        const uvAttr = triangleGeometry.getAttribute('uv');

        for (let i = 0; i < positionAttr.count; i++) {
          const x = positionAttr.getX(i);
          const y = positionAttr.getY(i);
          const u = (x + width / 2) / width;
          const v = (y + height / 2) / height;
          uvAttr.setXY(i, u, v);
        }
        uvAttr.needsUpdate = true;

        const groups = triangleGeometry.groups;
        if (groups.length >= 1) {
          const capGroup = groups[0];

          triangleGeometry.clearGroups();

          const halfCapCount = Math.floor(capGroup.count / 2);
          triangleGeometry.addGroup(capGroup.start, halfCapCount, 0);
          triangleGeometry.addGroup(capGroup.start + halfCapCount, capGroup.count - halfCapCount, 1);

          if (groups.length >= 2) {
            const sideGroup = groups[1];
            triangleGeometry.addGroup(sideGroup.start, sideGroup.count, 2);
          }
        }

        const materials = [
          sideMaterial,
          viewImg ? imageMaterial : sideMaterial,
          sideMaterial,
        ];
        signMesh = new THREE.Mesh(triangleGeometry, materials);
        break;
      }
      case 'rect': {
        const materials = [
          sideMaterial,
          sideMaterial,
          sideMaterial,
          sideMaterial,
          viewImg ? imageMaterial : sideMaterial,
          sideMaterial
        ];
        const box = new THREE.BoxGeometry(width, height, thickness);
        signMesh = new THREE.Mesh(box, materials);
        break;
      }
    }
    signMesh.position.setY(signZ + height / 2);
    signMesh.position.setZ(poleRadius / 2 + 2);

    group.add(signMesh);
    group.rotateY(angleY);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { angleY, width } = this.getData();
    const length = 10 + 4;

    return [
      new THREE.Vector3(width, 1, length),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { width, angleY } = data;
    const length = 10 + 4;
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: Math.max(width, length),
      depth: Math.max(width, length),
      angleY: angleY * -1,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width,
        depth: length,
        angleY,
      })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    const { width } = data;
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const drawAngelLength = Math.max(width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angleY) * drawAngelLength

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
      console.log(angleY)
      this.setData({
        ...this.getData(),
        angleY: angleY * -1,
      })
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

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'shape',
        label: '形状',
        dataType: 'enum',
        value: data.shape,
        enumList: [{
          id: 'rect',
          name: '矩形',
          img: '/shape/rect.png'
        }, {
          id: 'circle',
          name: '圆形',
          img: '/shape/circle.png'
        }, {
          id: 'diamond',
          name: '菱形',
          img: '/shape/diamond.png'
        }, {
          id: 'triangle',
          name: '三角形',
          img: '/shape/triangle.png'
        }],
      },
      {
        id: 'img',
        label: '图案',
        dataType: 'stitchImage',
        value: data.img,
        dataTypeList: ['roadSigns', 'basic'],
      },
      {
        id: 'bgColor',
        label: '牌子背景色',
        dataType: 'color',
        value: data.bgColor,
      },
      {
        id: 'poleColor',
        label: '柱子颜色',
        dataType: 'color',
        value: data.poleColor,
      },
      {
        id: 'width',
        label: '牌子宽度',
        dataType: 'number',
        min: 20,
        max: 500,
        step: 1,
        value: data.width,
        unit: 'cm',
      },
      {
        id: 'height',
        label: '牌子高度',
        dataType: 'number',
        min: 20,
        max: 500,
        step: 1,
        value: data.height,
        unit: 'cm',
      },
      {
        id: 'signZ',
        label: '牌子离地高度',
        dataType: 'number',
        min: 0,
        max: 500,
        step: 1,
        value: data.signZ,
        unit: 'cm',
      },
      {
        id: 'poleRadius',
        label: '柱子半径',
        dataType: 'number',
        min: 1,
        max: 30,
        step: 1,
        value: data.poleRadius,
        unit: 'cm',
      },
      {
        id: 'z',
        label: '距离地面高度',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
        unit: 'cm',
      },
    ], async (val) => {
      this.setData({
        ...data,
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

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
    return [];
  }
}
