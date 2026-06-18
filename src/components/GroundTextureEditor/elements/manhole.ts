import { BaseElementDefinition } from '../types'

export class ManholeDefinition extends BaseElementDefinition {
  id = 'manhole'
  name = '井盖'
  icon = '🗑️'
  type = 'sprite' as const
  drawType = 'sprite' as const
  color = '#4a4a4a'
  defaultWidth = 60
  defaultHeight = 60
}

export const manholeDefinition = new ManholeDefinition()