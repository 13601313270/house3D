import { BaseElementDefinition } from '../types'

export class RoadDefinition extends BaseElementDefinition {
  id = 'road'
  name = '道路'
  icon = '🛣️'
  type = 'polyline' as const
  drawType = 'polyline' as const
  color = '#8B4513'
  defaultWidth = 40
}

export const roadDefinition = new RoadDefinition()