import { BaseElementDefinition } from '../types'

import { PolygonElement, PolygonElementData } from '../types/polygonElement'

class GrassClass extends PolygonElement<PolygonElementData> {
  texture = '草坪'
  color = '#228B22'
}

export const grassDefinition: BaseElementDefinition = {
  id: 'grass',
  name: '草坪',
  icon: '🌿',
  type: 'polygon',
  createClass: GrassClass
}
