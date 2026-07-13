import { OutFilePlusBase } from "@/outFilePlus/OutFilePlusBase";
import * as THREE from 'three'
import { editItem } from "@/utils/editItem";

export default class OutFilePlus40 extends OutFilePlusBase {
  static outFileDataExtension(data: Record<string, any>): editItem[] {
    return [
      {
        id: 'frameColor',
        label: '车架颜色',
        dataType: 'color',
        value: data.frameColor || '#B70000',
      }
    ]
  }

  static modify3DMesh(data: Record<string, any>, mesh: THREE.Group): void {
    const material: THREE.MeshStandardMaterial = ((mesh.children[9] as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
    // console.log('ddddddd', data, data.frameColor, material.color);
    material.color.set(data.frameColor || '#B70000');

    (mesh.children[9] as THREE.Mesh).material = material;
    (mesh.children[10] as THREE.Mesh).material = material;
    (mesh.children[11] as THREE.Mesh).material = material;
    (mesh.children[23] as THREE.Mesh).material = material;
    (mesh.children[24] as THREE.Mesh).material = material;
    (mesh.children[25] as THREE.Mesh).material = material;
    (mesh.children[26] as THREE.Mesh).material = material;
  }
}