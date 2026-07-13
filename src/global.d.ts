import { World } from './utils/world/entity'

declare global {
  interface Window {
    worldApi: World
  }
}
