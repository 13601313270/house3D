import * as THREE from 'three'
import { ImportFileType } from '@/entities/allObjs'
import { ImportFileData } from '@/entities/importFile/index.d';
import { ImportFileEntity } from '@/entities/importFile/entity';
import canvas2DSceneManage from './canvas2DSceneManage';

const handleLoadedObject = async (object: THREE.Group | THREE.Mesh, file: File, type: string, scaleFactor: number, position: THREE.Vector3) => {
  const fileTypeId = `custom_${Date.now()}.${type}`
  console.log('fileTypeId', fileTypeId)
  const customObjItem: ImportFileType = {
    fileTypeId,
    mesh: object,
    file,
  }
  window.worldState.allImportFiles.push(customObjItem)
  const data: ImportFileData = {
    fileTypeId,
    id: Date.now().toString(),
    x: position.x,
    y: position.y,
    z: position.z,
    angleY: 0,
    scale: scaleFactor,
  }
  const importFileEntity = new ImportFileEntity(window.globalEditGroup, data)
  if (importFileEntity) {
    importFileEntity.init()
    importFileEntity.reBuildBoundingBoxData()
  }
  if (window.globalEditGroup.insertTempObj) {
    window.globalEditGroup.insertTempObj.beforeRemove()
    window.globalEditGroup.insertTempObj = null
  }
  window.globalEditGroup.insertTempObj = importFileEntity
  canvas2DSceneManage.renderPreview()
}
export default handleLoadedObject
