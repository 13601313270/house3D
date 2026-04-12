import * as THREE from 'three';
/**
 * 线拉伸成平面
 * @param { {x: number, y: number}[] } points 点
 * @param { number } radius 拉伸半径(宽度)
 * @returns { THREE.Vector2[] }
 */
export function createShapeFromPoints(points: Array<{
  x: number,
  y: number,
}>, radius = 1): [number, number][] {
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0, len = points.length; i < len; i++) {
    let prev = points[i - 1] || {};
    const curr = points[i];
    const next = points[i + 1] || {};

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
    let vector: any = [v1[0] + v2[0], v1[1] + v2[1]];
    const modelVector = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
    vector = [vector[0] / modelVector, vector[1] / modelVector];

    // 扩散点的方向和转角处的角度偏移
    const Lvector = rotateVector(vector, -Math.PI / 2);
    const Rvector = rotateVector(vector, Math.PI / 2);
    const deflection = vectorAngleCosHalf(v1, v2);

    left.push([
      (+(curr.x + Lvector[0] * (radius / deflection)).toFixed(2)),
      (+(curr.y + Lvector[1] * (radius / deflection)).toFixed(2)),
    ]);
    right.unshift([
      (+(curr.x + Rvector[0] * (radius / deflection)).toFixed(2)),
      (+(curr.y + Rvector[1] * (radius / deflection)).toFixed(2)),
    ]);

    prev = curr;
  }

  return left.concat(right);
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
export function vectorAngleCosHalf(a, b) {
  return Math.sqrt((1 + vectorAngleCos(a, b)) / 2);
}

/**
 * 将点绕原点旋转
 * @param { [number, number] } param0
 * @param { number } angle
 * @returns { [number, number] }
 */
// @ts-ignore
export function rotateVector([x1, y1], angle) {
  const x2 = x1 * Math.cos(angle) - y1 * Math.sin(angle);
  const y2 = y1 * Math.cos(angle) + x1 * Math.sin(angle);

  return [x2, y2];
}