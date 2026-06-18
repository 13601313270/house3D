import { BaseElementDefinition } from '../types'

export class LampDefinition extends BaseElementDefinition {
  id = 'lamp'
  name = '路灯'
  icon = '💡'
  type = 'sprite' as const
  drawType = 'sprite' as const
  color = '#FFD700'
  defaultWidth = 30
  defaultHeight = 80
}

export const lampDefinition = new LampDefinition()