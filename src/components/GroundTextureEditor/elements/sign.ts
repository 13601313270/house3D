import { BaseElementDefinition } from '../types'

export class SignDefinition extends BaseElementDefinition {
  id = 'sign'
  name = '警示牌'
  icon = '⚠️'
  type = 'sprite' as const
  drawType = 'sprite' as const
  color = '#FFFF00'
  defaultWidth = 40
  defaultHeight = 40
}

export const signDefinition = new SignDefinition()