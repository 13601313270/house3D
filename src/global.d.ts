import { Group } from './entities/group/entity'
import WorldState from './utils/worldState'

declare global {
  interface Window {
    worldApi: Group
    worldState: WorldState
  }
}
