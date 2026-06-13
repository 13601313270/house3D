/**
 * 线拉伸成平面
 * @param { {x: number, y: number}[] } points 点
 * @param { number } radius 拉伸半径(宽度)
 * @returns { THREE.Vector2[] }
 */
import { Point } from '@/types';

// const cache = new Map<string, [number, number][][]>();

type wallBox = [{ x: number, y: number }, { x: number, y: number }, { x: number, y: number }, { x: number, y: number }]

export function createAllWallFromPoints(wallList: {
  points: {
    x: number
    y: number
  }[]
  thickness: number
}[]): wallBox[] {
  // const key = `${wallList.map((item) => item.points.map((point: Point) => `${point.x},${point.y}`).join(',')).join(',')}`
  // if (cache.has(key)) return cache.get(key) || []
  const left: Point[] = [];
  const right: Point[] = [];
  // let margineds: Geometry | null = null;
  const allWallBox: wallBox[] = []
  // console.log('========线========')
  for (let i = 0; i < wallList.length; i++) {
    const wallitem = wallList[i];
    const radius = wallitem.thickness / 2;
    if (!wallitem.points || wallitem.points.length < 2) return []
    // console.log('========点========')
    for (let j = 0, len = wallitem.points.length; j < len; j++) {
      let prev = wallitem.points[j - 1] || {} as Point;
      const curr = wallitem.points[j];
      const next = wallitem.points[j + 1] || {} as Point;

      let v1 = [curr.x - prev.x, curr.y - prev.y];
      let v2 = [next.x - curr.x, next.y - curr.y];
      if (!prev.x && prev.x !== 0) {
        v1 = [...v2];
      } else if (!next.x && next.x !== 0) {
        v2 = [...v1];
      }

      const modelV1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
      const modelV2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
      // 单位向量
      v1 = [v1[0] / modelV1, v1[1] / modelV1];
      v2 = [v2[0] / modelV2, v2[1] / modelV2];
      // 方向和的单位向量
      let vector: [number, number] = [v1[0] + v2[0], v1[1] + v2[1]];
      const modelVector = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
      vector = [vector[0] / modelVector, vector[1] / modelVector];

      // 扩散点的方向和转角处的角度偏移
      const Lvector: [number, number] = rotateVector(vector, -Math.PI / 2);
      const Rvector: [number, number] = rotateVector(vector, Math.PI / 2);
      const deflection = vectorAngleCosHalf(v1, v2);
      // console.log('center点', curr.x, curr.y)
      // console.log('left点', (+(curr.x + Lvector[0] * (radius / deflection)).toFixed(2)), (+(curr.y + Lvector[1] * (radius / deflection)).toFixed(2)))
      // console.log('right点', (+(curr.x + Rvector[0] * (radius / deflection)).toFixed(2)), (+(curr.y + Rvector[1] * (radius / deflection)).toFixed(2)))
      left.push({
        x: (+(curr.x + Lvector[0] * (radius / deflection)).toFixed(2)),
        y: (+(curr.y + Lvector[1] * (radius / deflection)).toFixed(2)),
      });
      right.unshift({
        x: (+(curr.x + Rvector[0] * (radius / deflection)).toFixed(2)),
        y: (+(curr.y + Rvector[1] * (radius / deflection)).toFixed(2)),
      });
      if (j !== 0) {
        const point1: [number, number] = [
          Math.round(left[left.length - 2].x),
          Math.round(left[left.length - 2].y)
        ]
        // console.log('point2额外伸长', Lvector[0], Lvector[1], v1[0], v1[1])
        const point2: [number, number] = [
          Math.round(left[left.length - 1].x),
          Math.round(left[left.length - 1].y)
        ]
        const point3: [number, number] = [
          Math.round(right[0].x),
          Math.round(right[0].y)
        ]
        const point4: [number, number] = [
          Math.round(right[1].x),
          Math.round(right[1].y)
        ]
        allWallBox.push([
          { x: point1[0], y: point1[1] },
          { x: point2[0], y: point2[1] },
          { x: point3[0], y: point3[1] },
          { x: point4[0], y: point4[1] },
        ])
        // try {
        //   // if (margineds) {
        //   //   margineds = union(margineds, [[point1, point2, point3, point4, point1]])
        //   // } else {
        //   //   margineds = [[point1, point2, point3, point4, point1]];
        //   // }
        // } catch (error) {
        //   console.log('error', error)
        //   continue;
        // }
      }
      prev = curr;
    }
    // const allPoint = left.concat(right);
    // allPoint.push(allPoint[0]);
    // console.log('last result', margineds, [allPoint.map((item) => ([item.x, item.y] as [number, number]))]);
    // return [allPoint.map((item) => ([item.x, item.y] as [number, number]))];
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
