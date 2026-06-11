import * as THREE from 'three'
// @ts-ignore
import img from './index.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(img);
function getMaterial(vector: THREE.Vector3) {
  const material = createTriplanarMaterial({
    map: texture,
    tileSize: 200,
    direction: vector,
  });
  return material
}
export default {
  material: getMaterial,
  img,
};
