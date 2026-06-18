import { BaseElementDefinition } from '../types'
import { RoadClass } from './roadClass'

export class RoadDefinition extends BaseElementDefinition {
  id = 'road'
  name = '道路'
  icon = '🛣️'
  type = 'polyline' as const
  createClass = RoadClass
  defaultWidth = 40
}

export const roadDefinition = new RoadDefinition()