import * as THREE from 'three'
import { editItem } from "@/entities";

// type sss = Record<string, any>;
// 暂时没有扩展项，原本是考虑根据fileTypeId来扩展项，比如窗帘，控制是否折叠
export function outFileDataExtension(fileTypeId: string, data: Record<string, any>): editItem[] {
  console.log('fileTypeId', fileTypeId)
  if (+fileTypeId === 68) {
    return [
      {
        id: 'foldAngle',
        label: '闸杆折叠角度',
        dataType: 'angle',
        value: data.foldAngle || 0,
        min: 0,
        max: 90,
      }
    ]
  }
  return []
}

export function modify3DMesh(fileTypeId: string, data: Record<string, any>, mesh: THREE.Group): void {
  if (+fileTypeId === 68) {
    const foldAngle = data.foldAngle || 0
    mesh.children[0].children[2].rotation.x = foldAngle * -1
  }
}