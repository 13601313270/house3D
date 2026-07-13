import * as THREE from 'three'
import { ImportFileType, ImportImgType, ObjOutputFileType } from "@/entities/allObjs"
import { EnvironmentConfig } from '../entities/group/entity'

class WorldState {
  scene: THREE.Scene
  allImportImgs: ImportImgType[] = []
  allImportFiles: ImportFileType[] = []
  ObjFileTypes: ObjOutputFileType[] = []
  activeCameraIndex: number = -1

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    gridHelper.layers.set(2)
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    axesHelper.layers.set(2)
    this.scene.add(axesHelper);
  }
}
export default WorldState