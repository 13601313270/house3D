import { Door } from './door/index.d'
import { Wall } from './wall/index.d'
import { Window } from './window/index.d'
import { CameraData } from './camera/index.d'
import { WallEntity } from './wall'
import { DoorEntity } from './door'
import { WindowEntity } from './window'
import { CameraEntity } from './camera'

export type fileData = {
  wall: Wall[],
  door: Door[],
  window: Window[],
  camera: CameraData[],
}

export type fileDataKeyToClass = {
  walls: WallEntity,
  doors: DoorEntity,
  windows: WindowEntity,
  cameras: CameraEntity,
}