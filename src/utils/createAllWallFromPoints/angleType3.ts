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
}): wallBox[] {
  const left: Point[] = [];
  const right: Point[] = [];
  const allWallBox: wallBox[] = []
  // console.log('========线========')
  const radius = wallitem.thickness / 2;
  if (!wallitem.points || wallitem.points.length < 2) return []
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
    allWallBoxMerge.push(allWallBox[i * 3])
    if (i === wallitem.points.length - 2) {
      break;
    }
    const cir1 = allWallBox[i * 3 + 1]
    const cir2 = allWallBox[i * 3 + 2]
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
  }
  return allWallBoxMerge;
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
