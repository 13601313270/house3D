import * as THREE from 'three'
// @ts-ignore
import img from './redBrick.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
function getMaterial(vector: THREE.Vector3) {
  return createTriplanarMaterial({
    map: woodTexture,
    tileSize: 160, // 👈 控制密度
    direction: vector,
  })
}
export default {
  material: getMaterial,
  img,
};
