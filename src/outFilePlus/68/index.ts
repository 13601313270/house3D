import { OutFilePlusBase } from "@/outFilePlus/OutFilePlusBase";
import * as THREE from 'three'
import { editItem } from "@/entities";

export default class OutFilePlus68 extends OutFilePlusBase {
  static outFileDataExtension(fileTypeId: string, data: Record<string, any>): editItem[] {
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

  static modify3DMesh(fileTypeId: string, data: Record<string, any>, mesh: THREE.Group): void {
    console.log(1)
    const foldAngle = data.foldAngle || 0
    mesh.children[0].children[2].rotation.x = foldAngle * -1
  }
}