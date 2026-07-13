import { Group } from './utils/world/entity'
import WorldState from './utils/worldState'

declare global {
  interface Window {
    worldApi: Group
    worldState: WorldState
  }
}
