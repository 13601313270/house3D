import { BaseElementDefinition } from '../types'
import { PolygonElement, PolygonElementData } from '../types/polygonElement'
// @ts-ignore
import mossyGround from '@/material/mossyGround/index.jpg'

class GrassClass extends PolygonElement<PolygonElementData> {
  type = 'grass'
  texture = mossyGround
  color = '#228B22'
  defaultTextureScale = 0.1
}

export const grassDefinition: BaseElementDefinition = {
  id: 'grass',
  name: '草坪',
  icon: '🌿',
  type: 'polygon',
  createClass: GrassClass
}
