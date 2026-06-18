import { BaseElementDefinition } from '../types'
import { GrassClass } from './grassClass'

export class GrassDefinition extends BaseElementDefinition {
  id = 'grass'
  name = '草坪'
  icon = '🌿'
  type = 'polygon' as const
  createClass = GrassClass
}

export const grassDefinition = new GrassDefinition()