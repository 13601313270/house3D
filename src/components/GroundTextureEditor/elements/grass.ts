import { BaseElementDefinition } from '../types'

export class GrassDefinition extends BaseElementDefinition {
  id = 'grass'
  name = '草坪'
  icon = '🌿'
  type = 'polygon' as const
  drawType = 'polygon' as const
  color = '#228B22'
  defaultWidth = 200
  defaultHeight = 200
}

export const grassDefinition = new GrassDefinition()