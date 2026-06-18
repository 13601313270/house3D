import { BaseElementDefinition } from '../types'

export class CrosswalkDefinition extends BaseElementDefinition {
  id = 'crosswalk'
  name = '斑马线'
  icon = '🚦'
  type = 'polyline' as const
  drawType = 'polyline' as const
  color = '#FFFFFF'
  defaultWidth = 60
}

export const crosswalkDefinition = new CrosswalkDefinition()