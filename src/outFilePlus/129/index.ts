import { OutFilePlusBase } from "@/outFilePlus/OutFilePlusBase";
import * as THREE from 'three'
import editItem from "@/utils/editItem";

export default class OutFilePlus71 extends OutFilePlusBase {
  static outFileDataExtension(data: Record<string, any>): editItem[] {
    return [
      {
        id: 'leftOpen',
        label: '左侧门开门',
        dataType: 'number',
        value: data.leftOpen || 0,
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        id: 'rightOpen',
        label: '右侧门开门',
        dataType: 'number',
        value: data.rightOpen || 0,
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
      }
    ]
  }

  static modify3DMesh(data: Record<string, any>, mesh: THREE.Group): void {
    const { leftOpen, rightOpen } = data
    // const material: THREE.MeshStandardMaterial = ((mesh.children[9] as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
    const list = mesh.children[0].children[0].children[0].children[1];
    // console.log('ddddddd', leftOpen);
    const right = list.children[4]
    const left = list.children[5]
    left.position.x = (leftOpen || 0) * -6.1;
    right.position.x = (rightOpen || 0) * 6.1;
  }
}