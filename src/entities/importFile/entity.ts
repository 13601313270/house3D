import * as THREE from 'three'
import { HandelInfo } from '@/types/map2d'
import { ImportFileData } from './index.d'
import { editItem } from '@/utils/editItem'
import { ModelFileEntity } from '@/types/modelFileEntity'
import processUploadedFile from '@/utils/processUploadedFile'

export class ImportFileEntity extends ModelFileEntity<ImportFileData> {
  type: string = 'importFile'

  async init(): Promise<void> {
    const { fileTypeId, url } = this.getData();
    if (fileTypeId) {
      const findObjInfo = window.worldState.allImportFiles.find(item => item.fileTypeId === fileTypeId)
      if (!findObjInfo) { return Promise.resolve() }
      const mesh: THREE.Group | THREE.Mesh = await new Promise((resolve) => {
        processUploadedFile(findObjInfo.file, (object: THREE.Group | THREE.Mesh) => {
          // findObjInfo.mesh = object
          resolve(object)
        })
      })
      this.mesh = mesh
    } else if (url) {
      const response = await fetch(url)
      const blob = await response.blob()
      const urlPath = new URL(url).pathname
      const fileName = urlPath.split('/').pop() || 'model'
      const file = new File([blob], fileName, { type: blob.type })

      const mesh: THREE.Group | THREE.Mesh = await new Promise((resolve) => {
        processUploadedFile(file, (object: THREE.Group | THREE.Mesh) => {
          resolve(object)
        })
      })
      this.mesh = mesh
    }
    return this.initBasicBoxDataAnd2DPreview()
  }

  getEditPropConfigData(data: ImportFileData): editItem[] {
    return [
      {
        id: 'z',
        label: '高度',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      },
      {
        id: 'scale',
        label: '缩放',
        dataType: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
        value: data.scale,
      },
    ]
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    const configList: editItem[] = [
      ...this.getEditPropConfigData(data),
      {
        id: 'downLoadFile',
        label: '下载文件',
        dataType: 'button',
        value: () => {
          const { fileTypeId } = this.getData();
          const findObjInfo = window.worldState.allImportFiles.find(item => item.fileTypeId === fileTypeId)
          if (findObjInfo) {
            const file: File = findObjInfo.file
            const url = URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }
      },
    ]
    editShow(configList, (val) => {
      this.setData({
        // ...data,
        ...val,
      })
    })
  }

  getDataMeta(): { [key: string]: string; } {
    return {
      ...super.getDataMeta(),
      fileTypeId: '文件类型',
    }
  }
}
