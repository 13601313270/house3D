import * as THREE from 'three'
import md5 from 'md5';
import { ImportFileType } from '@/entities/allObjs'
import { ImportFileData } from '@/entities/importFile/index.d';
import { ImportFileEntity } from '@/entities/importFile/entity';
import canvas2DSceneManage from './canvas2DSceneManage';
import { PointEntityClass } from '@/types/pointEntity';

const handleLoadedObject = async (object: THREE.Group | THREE.Mesh, file: File, type: string, scaleFactor: number, position: THREE.Vector3) => {
  const fileMd5 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // @ts-ignore
      const arrayBuffer = e.target.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      const hash = md5(uint8Array);
      resolve(hash);
    };
    reader.readAsArrayBuffer(file);
  })

  const fileTypeId = `${fileMd5}.${type}`
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
  canvas2DSceneManage.renderPreview();
  (() => {
    if (window.globalEditGroup.insertTempObj instanceof PointEntityClass) {
      window.scene2D.matchHandelObj = window.globalEditGroup.insertTempObj
      window.scene2D.matchedHandelInfo = {
        id: window.globalEditGroup.insertTempObj.getData().id, // 对象ID
        type: window.globalEditGroup.insertTempObj.type,
        index: 0,
        dist: 0,
      }
      window.scene2D.matchHandelStartPoint = { x: 0, y: 0 }
    }
  })();
}
export default handleLoadedObject
