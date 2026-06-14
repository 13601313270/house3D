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
  for (let j = 0, len = wallitem.points.length; j < len; j++) {
    const prev = wallitem.points[j - 1] || {} as Point;
    const curr = wallitem.points[j];
    const next = wallitem.points[j + 1] || {} as Point;

    let v1: [number, number] = [curr.x - prev.x, curr.y - prev.y];
    let v2: [number, number] = [next.x - curr.x, next.y - curr.y];
    if (j === 0) {
      v1 = [...v2];
    } else if (j === len - 1) {
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

    if (j !== 0) {
      left.push({
        x: +(curr.x + (LvectorV1[0] * radius) - (v1[0] * halfSin * dist2)).toFixed(2),
        y: +(curr.y + (LvectorV1[1] * radius) - (v1[1] * halfSin * dist2)).toFixed(2),
      });
      right.unshift({
        x: +(curr.x + (RvectorV1[0] * radius) - (v1[0] * halfSin * dist2)).toFixed(2),
        y: +(curr.y + (RvectorV1[1] * radius) - (v1[1] * halfSin * dist2)).toFixed(2),
      });
    }
    if (j !== len - 1) {
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
  for (let j = 1, len = left.length; j < len; j++) {
    const point1: [number, number] = [
      Math.round(left[j - 1].x),
      Math.round(left[j - 1].y)
    ]
    const point2: [number, number] = [
      Math.round(left[j].x),
      Math.round(left[j].y)
    ]
    const point3: [number, number] = [
      Math.round(right[len - j - 1].x),
      Math.round(right[len - j - 1].y)
    ]
    const point4: [number, number] = [
      Math.round(right[len - j].x),
      Math.round(right[len - j].y)
    ]
    const ttt: {
      x: number
      y: number
    }[] = [];
    const cacheKey = new Set()
    const allWaitAddPoint = [
      point1,
      point2,
      point3,
      point4,
    ]
    allWaitAddPoint.forEach((item) => {
      if (!cacheKey.has(item[0] + ',' + item[1])) {
        cacheKey.add(item[0] + ',' + item[1])
        ttt.push({
          x: item[0],
          y: item[1],
        })
      }
    })

    allWallBox.push(ttt)
  }
  return allWallBox;
  // cache.set(key, margineds)
  // return margineds;
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
