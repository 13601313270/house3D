import * as THREE from 'three'
import { HandelInfo } from '@/types/map2d'
import { ImportFileData } from './index.d'
import { editItem } from '@/utils/editItem'
import { ModelFileEntity } from '@/types/modelFileEntity'

export class ImportFileEntity extends ModelFileEntity<ImportFileData> {
  name: string = '导入文件'
  type: string = 'importFile'

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
}
