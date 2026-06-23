import { BaseElementDefinition } from '../types'
// @ts-ignore
import redBrick from '@/material/redBrick/redBrick.jpg'

import { PolygonElement, PolygonElementData } from '../types/polygonElement'

class TileClass extends PolygonElement<PolygonElementData> {
  type = 'tile'
  texture = redBrick
  color = '#228B22'
  defaultTextureScale = 0.1
}

export const tileDefinition: BaseElementDefinition = {
  id: 'tile',
  name: '地砖',
  icon: '🧱',
  type: 'polygon',
  dataType: 'groundTexture',
  createClass: TileClass
}
