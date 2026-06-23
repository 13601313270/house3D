import { BaseElementDefinition } from '../types'
import { PolylineElement, PolylineElementData } from '../types/polylineElement'
// @ts-ignore
import asphaltImg from '@/material/asphalt/index.jpg'

class LineClass extends PolylineElement<PolylineElementData> {
  type = 'line'
  texture = asphaltImg
  color = '#228B22'

  static defaultData(): PolylineElementData {
    return {
      ...PolylineElement.defaultData(),
      width: 1,
    }
  }
}

export const lineDefinition: BaseElementDefinition = {
  id: 'line',
  name: '折线',
  icon: '线',
  type: 'polyline',
  dataType: 'basic',
  createClass: LineClass
}
