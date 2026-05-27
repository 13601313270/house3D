export interface RectData {
  x: number
  y: number
  width: number
  depth: number
  angleY: number
}

export function isPointInRotatedRect(x: number, y: number, rect: RectData): boolean {
  const { x: centerX, y: centerY, width, depth, angleY } = rect
  const dx = x - centerX
  const dy = y - centerY
  const cos = Math.cos(angleY)
  const sin = Math.sin(angleY)
  const localX = dx * cos + dy * sin
  const localY = -dx * sin + dy * cos
  return localX < width / 2 && localX > -width / 2 && localY < depth / 2 && localY > -depth / 2
}