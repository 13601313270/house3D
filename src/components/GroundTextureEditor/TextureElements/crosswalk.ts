import { BaseElementDefinition } from '../types'
import { PolylineElement, PolylineElementData } from '../types/polylineElement'

class CrosswalkClass extends PolylineElement<PolylineElementData> {
  type = 'crosswalk'
  texture = '🦓'
  color = '#228B22'
}

export const crosswalkDefinition: BaseElementDefinition = {
  id: 'crosswalk',
  name: '斑马线',
  icon: '🚦',
  type: 'polyline',
  dataType: 'road',
  createClass: CrosswalkClass,
}
