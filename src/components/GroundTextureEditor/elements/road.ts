import { BaseElementDefinition } from '../types'

import { PolylineElement, PolylineElementData } from '../types/polylineElement'

class RoadClass extends PolylineElement<PolylineElementData> {
  texture = '路'
  color = '#228B22'
}

export const roadDefinition: BaseElementDefinition = {
  id: 'road',
  name: '道路',
  icon: '🚗️',
  type: 'polyline',
  createClass: RoadClass
}
