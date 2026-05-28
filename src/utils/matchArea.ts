export interface RectData {
  x: number
  y: number
  width: number
  depth: number
  angleY: number
}

export class MatchRectArea {
  data: RectData
  constructor(data: RectData) {
    this.data = data
  }
}

export interface CircleData {
  x: number
  y: number
  r: number
}

export class MatchCircleArea {
  data: CircleData
  constructor(data: CircleData) {
    this.data = data
  }
}