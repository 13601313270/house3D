import { BaseElementDefinition } from '../types'

export class TileDefinition extends BaseElementDefinition {
  id = 'tile'
  name = '地砖'
  icon = '🧱'
  type = 'polygon' as const
  drawType = 'polygon' as const
  color = '#D2B48C'
  defaultWidth = 150
  defaultHeight = 150
}

export const tileDefinition = new TileDefinition()