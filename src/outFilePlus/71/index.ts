import { OutFilePlusBase } from "@/outFilePlus/OutFilePlusBase";
import * as THREE from 'three'
import editItem from "@/utils/editItem";

export default class OutFilePlus71 extends OutFilePlusBase {
  static outFileDataExtension(data: Record<string, any>): editItem[] {
    return [
      {
        id: 'leftAngle',
        label: '左侧门开门角度',
        dataType: 'angle',
        value: data.leftAngle || 0,
        min: 0,
        max: 180,
      },
      {
        id: 'rightAngle',
        label: '右侧门开门角度',
        dataType: 'angle',
        value: data.rightAngle || 0,
        min: 0,
        max: 180,
      }
    ]
  }

  static modify3DMesh(data: Record<string, any>, mesh: THREE.Group): void {
    // const material: THREE.MeshStandardMaterial = ((mesh.children[9] as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
    // console.log('ddddddd', data, mesh.children);
    const leftAngle = data.leftAngle || 0
    const rightAngle = data.rightAngle || 0
    // material.color.set(data.frameColor || '#B70000');

    mesh.children[1].rotation.z = leftAngle
    mesh.children[2].rotation.z = rightAngle * -1
    // mesh.children[3].rotation.x = data.foldAngle || 0
    // (mesh.children[9] as THREE.Mesh).material = material;
    // (mesh.children[10] as THREE.Mesh).material = material;
    // (mesh.children[11] as THREE.Mesh).material = material;
    // (mesh.children[23] as THREE.Mesh).material = material;
    // (mesh.children[24] as THREE.Mesh).material = material;
    // (mesh.children[25] as THREE.Mesh).material = material;
    // (mesh.children[26] as THREE.Mesh).material = material;
  }
}