import { Door } from './door/index.d'
import { Wall } from './wall/index.d'
import { Window } from './window/index.d'
import { CameraData } from './camera/index.d'

export { WallEntity } from './wall'
export { DoorEntity } from './door'
export { WindowEntity } from './window'

export type fileData = {
    walls: Wall[],
    doors: Door[],
    windows: Window[],
    cameras: CameraData[],
}