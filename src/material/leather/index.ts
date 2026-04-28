import * as THREE from 'three'
// @ts-ignore
import img from './index.png'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
function getMaterial(vector: THREE.Vector3) {
  const material = createTriplanarMaterial({
    map: woodTexture,
    tileSize: 100,
    direction: vector,
  });
  return material
}
export default {
  material: getMaterial,
  img,
};
