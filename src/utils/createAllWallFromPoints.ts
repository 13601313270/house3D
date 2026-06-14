/**
 * 线拉伸成平面
 * @param { {x: number, y: number}[] } points 点
 * @param { number } radius 拉伸半径(宽度)
 * @returns { THREE.Vector2[] }
 */
import { Point } from '@/types';

type wallBox = { x: number, y: number }[]

export function createAllWallFromPoints(wallitem: {
  points: {
    x: number
    y: number
  }[]
  thickness: number
}, type: 0 | 1 | 2 | 3 | 4 | 5): {
  data: wallBox[],
  countPerPoint: number
} {
  const left: Point[] = [];
  const right: Point[] = [];
  const allWallBox: wallBox[] = []
  // console.log('========线========')
  const radius = wallitem.thickness / 2;
  const countPerPoint = {
    0: 1,
    1: 1,
    2: 2,
    3: 3,
    4: 2,
    5: 2,
  }[type];
  if (!wallitem.points || wallitem.points.length < 2) {
    return {
      data: [],
      countPerPoint: 0
    }
  }
  // console.log('========点========')
  console.log('===============pppLeftX-set===============')
  for (let i = 0, len = wallitem.points.length; i < len; i++) {
    const prev = wallitem.points[i - 1] || {} as Point;
    const curr = wallitem.points[i];
    const next = wallitem.points[i + 1] || {} as Point;

    let v1: [number, number] = [curr.x - prev.x, curr.y - prev.y];
    let v2: [number, number] = [next.x - curr.x, next.y - curr.y];
    if (i === 0) {
      v1 = [...v2];
    } else if (i === len - 1) {
      v2 = [...v1];
    }

    const modelV1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
    const modelV2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
    // 单位向量
    v1 = [v1[0] / modelV1, v1[1] / modelV1];
    v2 = [v2[0] / modelV2, v2[1] / modelV2];

    const LvectorV1: [number, number] = rotateVector(v1, -Math.PI / 2);
    const RvectorV1: [number, number] = rotateVector(v1, Math.PI / 2);
    const LvectorV2: [number, number] = rotateVector(v2, -Math.PI / 2);
    const RvectorV2: [number, number] = rotateVector(v2, Math.PI / 2);

    // 方向和的单位向量
    let vector: [number, number] = [v1[0] + v2[0], v1[1] + v2[1]];
    const modelVector = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
    vector = [vector[0] / modelVector, vector[1] / modelVector];
    const halfCos = vectorAngleCosHalf(v1, v2);
    const dist2 = radius / halfCos;
    const halfSin = Math.sqrt(1 - halfCos ** 2);

    const Lvector: [number, number] = rotateVector(vector, -Math.PI / 2);
    const Rvector: [number, number] = rotateVector(vector, Math.PI / 2);
    const deflection = vectorAngleCosHalf(v1, v2);

    if (i !== 0) {
      left.push({
        x: +(curr.x + (LvectorV1[0] * radius) - (v1[0] * halfSin * dist2)).toFixed(2),
        y: +(curr.y + (LvectorV1[1] * radius) - (v1[1] * halfSin * dist2)).toFixed(2),
      });
      right.unshift({
        x: +(curr.x + (RvectorV1[0] * radius) - (v1[0] * halfSin * dist2)).toFixed(2),
        y: +(curr.y + (RvectorV1[1] * radius) - (v1[1] * halfSin * dist2)).toFixed(2),
      });
    }
    if (i !== 0 && i !== len - 1) {
      left.push({
        x: +(curr.x + Lvector[0] * (radius / deflection)).toFixed(2),
        y: +(curr.y + Lvector[1] * (radius / deflection)).toFixed(2),
      });
      right.unshift({
        x: +(curr.x + Rvector[0] * (radius / deflection)).toFixed(2),
        y: +(curr.y + Rvector[1] * (radius / deflection)).toFixed(2),
      });
    }
    if (i !== len - 1) {
      left.push({
        x: +(curr.x + (LvectorV2[0] * radius) + (v2[0] * halfSin * dist2)).toFixed(2),
        y: +(curr.y + (LvectorV2[1] * radius) + (v2[1] * halfSin * dist2)).toFixed(2),
      });
      right.unshift({
        x: +(curr.x + (RvectorV2[0] * radius) + (v2[0] * halfSin * dist2)).toFixed(2),
        y: +(curr.y + (RvectorV2[1] * radius) + (v2[1] * halfSin * dist2)).toFixed(2),
      });
    }
  }
  for (let i = 1, len = left.length; i < len; i++) {
    const point1: [number, number] = [
      Math.round(left[i - 1].x),
      Math.round(left[i - 1].y)
    ]
    const point2: [number, number] = [
      Math.round(left[i].x),
      Math.round(left[i].y)
    ]
    const point3: [number, number] = [
      Math.round(right[len - i - 1].x),
      Math.round(right[len - i - 1].y)
    ]
    const point4: [number, number] = [
      Math.round(right[len - i].x),
      Math.round(right[len - i].y)
    ]
    const pointList = [
      {
        x: point1[0],
        y: point1[1],
      },
      {
        x: point2[0],
        y: point2[1],
      },
      {
        x: point3[0],
        y: point3[1],
      },
      {
        x: point4[0],
        y: point4[1],
      },
    ]
    allWallBox.push(pointList)
  }
  const allWallBoxMerge: wallBox[] = []
  for (let i = 0; i < wallitem.points.length - 1; i++) {
    if (type === 1) {
      const cirPre1 = allWallBox[i * 3 - 1]
      const cir1 = allWallBox[i * 3 + 1]
      let point1 = allWallBox[i * 3][0];
      let point2 = allWallBox[i * 3][1];
      let point3 = allWallBox[i * 3][2];
      let point4 = allWallBox[i * 3][3];
      if (cirPre1) {
        if (JSON.stringify(cirPre1[2]) === JSON.stringify(cirPre1[3])) {
          point1 = cirPre1[0];
        } else {
          point4 = cirPre1[3];
        }
      }
      if (cir1) {
        if (JSON.stringify(cir1[2]) === JSON.stringify(cir1[3])) {
          point2 = cir1[1];
        } else {
          point3 = cir1[2];
        }
      }
      allWallBoxMerge.push([
        point1,
        point2,
        point3,
        point4,
      ])
    } else {
      allWallBoxMerge.push(allWallBox[i * 3])
    }
    if (i === wallitem.points.length - 2) {
      break;
    }
    const cir1 = allWallBox[i * 3 + 1]
    const cir2 = allWallBox[i * 3 + 2]
    if (type === 2) {
      if (JSON.stringify(cir1[2]) === JSON.stringify(cir1[3])) {
        allWallBoxMerge.push([
          cir1[0],
          cir2[1],
          cir2[2],
        ])
      } else {
        allWallBoxMerge.push([
          cir1[0],
          cir2[2],
          cir1[3],
        ])
      }
    } else if (type === 3) {
      allWallBoxMerge.push(cir1)
      allWallBoxMerge.push(cir2)
    } else if (type === 4) {
      if (JSON.stringify(cir1[2]) === JSON.stringify(cir1[3])) {
        allWallBoxMerge.push([
          cir1[0],
          cir1[1],
          cir2[1],
          cir2[2],
        ])
      } else {
        allWallBoxMerge.push([
          cir1[0],
          cir2[2],
          cir2[3],
          cir1[3],
        ])
      }
    } else if (type === 5) {
      const ddCount = 3;
      const cornerPoints = [];
      const {
        yuandian,
        leftPoint,
        rightPoint
      } = (function () {
        if (JSON.stringify(cir1[2]) === JSON.stringify(cir1[3])) {
          const yuandian = cir2[2];
          const leftPoint = cir1[0];
          const rightPoint = cir2[1];
          return {
            yuandian,
            leftPoint,
            rightPoint
          }
        } else {
          const yuandian = cir1[0];
          const leftPoint = cir2[2];
          const rightPoint = cir1[3];
          return {
            yuandian,
            leftPoint,
            rightPoint
          }
        }
      })()
      cornerPoints.push(yuandian, leftPoint)
      // 计算yuandian到leftPoint的角度
      const angle = Math.atan2(leftPoint.y - yuandian.y, leftPoint.x - yuandian.x)
      // 计算yuandian到rightPoint的角度
      const angle2 = Math.atan2(rightPoint.y - yuandian.y, rightPoint.x - yuandian.x)
      // 计算angle和angle2之间的夹角角度
      let diff = Math.abs(angle2 - angle);

      // 处理角度周期性（取最小夹角，范围 [0, π]）
      if (diff > Math.PI) {
        diff = 2 * Math.PI - diff;
      }
      for (let i = 0; i < ddCount; i++) {
        const fff = rotateVector([
          leftPoint.x - yuandian.x,
          leftPoint.y - yuandian.y
        ], diff / (ddCount + 1) * (i + 1));
        cornerPoints.push({
          x: yuandian.x + fff[0],
          y: yuandian.y + fff[1],
        })
      }
      cornerPoints.push(rightPoint)
      allWallBoxMerge.push(cornerPoints)
    }
  }
  return {
    data: allWallBoxMerge,
    countPerPoint,
  }
}

/**
 * 向量夹角的cos值
 * @param { [number, number] } a
 * @param { [number, number] } b
 * @returns
 */
export function vectorAngleCos(a: any, b: any) {
  return (
    (a[0] * b[0] + a[1] * b[1]) /
    (Math.sqrt(a[0] ** 2 + a[1] ** 2) * Math.sqrt(b[0] ** 2 + b[1] ** 2))
  );
}

/**
 * 向量夹角的一半的cos值
 * @param { [number, number] } a
 * @param { [number, number] } b
 * @returns
 */
// @ts-ignore
export function vectorAngleCosHalf(a: any, b: any) {
  return Math.sqrt((1 + vectorAngleCos(a, b)) / 2);
}

/**
 * 将点绕原点旋转
 * @param { [number, number] } param0
 * @param { number } angle
 * @returns { [number, number] }
 */

export function rotateVector([x1, y1]: [number, number], angle: number): [number, number] {
  const x2 = x1 * Math.cos(angle) - y1 * Math.sin(angle);
  const y2 = y1 * Math.cos(angle) + x1 * Math.sin(angle);

  return [x2, y2];
}
