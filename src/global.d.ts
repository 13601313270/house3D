import WorldGroup from '@/world/world'
import WorldState from './utils/worldState'

declare global {
  interface Window {
    worldApi: WorldGroup
    worldState: WorldState
  }
}
