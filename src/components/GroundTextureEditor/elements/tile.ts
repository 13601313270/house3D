import { BaseElementDefinition } from '../types'

import { PolygonElement, PolygonElementData } from '../types/polygonElement'

class TileClass extends PolygonElement<PolygonElementData> {
  texture = '🌿'
  color = '#228B22'
}

export const tileDefinition: BaseElementDefinition = {
  id: 'tile',
  name: '地砖',
  icon: '🧱',
  type: 'polygon' as const,
  createClass: TileClass
}
