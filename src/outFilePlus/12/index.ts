import { OutFilePlusBase } from "@/outFilePlus/OutFilePlusBase";
import * as THREE from 'three'
import { editItem } from "@/entities";
import { importImgFileHead } from "@/entities/allObjs";

export default class OutFilePlus71 extends OutFilePlusBase {
  static outFileDataExtension(data: Record<string, any>): editItem[] {
    return [
      {
        id: 'screenImg',
        label: '屏幕图片',
        dataType: 'img',
        value: data.screenImg || '',
      },
    ]
  }

  static modify3DMesh(data: Record<string, any>, mesh: THREE.Group): void {
    const material: THREE.MeshStandardMaterial = ((mesh.children[1] as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
    console.log('screenImg-dd', data, mesh.children);
    // mesh.children[0].visible = false
    const screenImg = data.screenImg || ''
    console.log('screenImg', screenImg);
    material.map = new THREE.TextureLoader().load(screenImg);

    if (screenImg) {
      if (screenImg.startsWith(importImgFileHead)) {
        const findImportFile = window.worldApi.allImportImgs.find(item => item.fileTypeId === screenImg);
        if (findImportFile) {
          const imgFile: File = findImportFile.file as File;
          const objectUrl = URL.createObjectURL(imgFile);
          const texture = new THREE.TextureLoader().load(objectUrl);
          texture.flipY = false;
          const imageMaterial = new THREE.MeshStandardMaterial({
            map: texture
          });

          // material.needsUpdate = true;
          if (screenImg) {
            material.side = THREE.DoubleSide;
            (mesh.children[1] as THREE.Mesh).material = imageMaterial;
          }
        }
      } else {
        const texture = new THREE.TextureLoader().load(screenImg);
        texture.flipY = false;
        const imageMaterial = new THREE.MeshStandardMaterial({
          map: texture
        });

        // material.needsUpdate = true;
        if (screenImg) {
          material.side = THREE.DoubleSide;
          (mesh.children[1] as THREE.Mesh).material = imageMaterial;
        }
      }
    }
  }
}