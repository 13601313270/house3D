import * as THREE from 'three'
// @ts-ignore
import img from './wooden.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
function getMaterial(vector: THREE.Vector3) {
  const material = createTriplanarMaterial({
    map: woodTexture,
    tileSize: 130, // 👈 控制密度
    direction: vector,
  });
  return material
}
export default {
  material: getMaterial,
  img,
};
