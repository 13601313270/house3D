export interface Point {
  x: number
  y: number
}

export interface Wall {
  id: string
  points: Point[]
}

export interface Door {
  id: string
  wallId: string
  x: number
  y: number
  width: number
  angle: number
}

export interface Window {
  id: string
  wallId: string
  x: number
  y: number
  width: number
  angle: number
}
