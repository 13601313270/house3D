import { BaseElementDefinition } from '../types'
import { PolylineElement, PolylineElementData } from '../types/polylineElement'
// @ts-ignore
import asphaltImg from '@/material/asphalt/index.jpg'

class RoadClass extends PolylineElement<PolylineElementData> {
  type = 'road'
  texture = asphaltImg
  color = '#228B22'

  static defaultData(): PolylineElementData {
    return {
      ...PolylineElement.defaultData(),
      width: 200,
    }
  }
}

export const roadDefinition: BaseElementDefinition = {
  id: 'road',
  name: '道路',
  icon: '🚗️',
  type: 'polyline',
  dataType: 'road',
  createClass: RoadClass
}
