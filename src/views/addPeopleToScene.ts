import * as THREE from 'three'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const objLoader = new OBJLoader();
// const mtlLoader = new MTLLoader();
async function addPeopleToScene(
  scene: THREE.Scene,
  type: 'people' | 'peopleSit',
  x: number,
  y: number,
  z: number,
  rotationY: number = 0
) {
  const mtlLoader = new MTLLoader();
  mtlLoader.load(
    type === 'people' ? './people/1.mtl' : './peoplesit/1.mtl', // 你的材质文件路径，通常和 .obj 放在同一目录
    (materials: any) => {
      // 关键步骤：预加载所有材质，让纹理图片准备好
      materials.preload();

      // 3. 将加载好的材质集传给 OBJLoader
      objLoader.setMaterials(materials);

      objLoader.load(
        type === 'people' ? './people/1.obj' : './peoplesit/1.obj',
        function (object: any) {
          // object.scale.set(0.3, 0.3, 0.3); // FBX通常很大
          object.position.set(x, y, z);
          object.rotation.y = rotationY;
          scene.add(object);
        }
      );
      // // 4. 加载 OBJ 模型文件
      // objLoader.load(
      //     'path/to/your/model.obj',
      //     (object) => {
      //         // 模型已经自动应用了材质，直接添加到场景即可
      //         scene.add(object);
      //     },
      //     (xhr) => {
      //         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      //     },
      //     (error) => {
      //         console.error('An error happened while loading the OBJ file', error);
      //     }
      // );
    },
    (xhr: any) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error: any) => {
      console.error('An error happened while loading the MTL file', error);
    }
  );
}
export default addPeopleToScene