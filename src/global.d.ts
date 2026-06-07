import { World } from './utils/world'

declare global {
  interface Window {
    worldApi: World
  }
}
