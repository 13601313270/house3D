import * as THREE from 'three'
import { ImportFileType, ImportImgType, ObjOutputFileType } from "@/entities/allObjs"

class WorldState {
  // scene: THREE.Scene = new THREE.Scene()
  allImportImgs: ImportImgType[] = []
  allImportFiles: ImportFileType[] = []
  ObjFileTypes: ObjOutputFileType[] = []
  activeCameraIndex: number = -1
}
export default WorldState