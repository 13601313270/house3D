import * as THREE from 'three'
// @ts-ignore
import img from './demo.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
function getMaterial(vector: THREE.Vector3) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,   // 金属底色（灰银）
    metalness: 0.7,    // 👈 关键：完全金属
    roughness: 0.4,    // 👈 光滑程度（越小越亮）
  });
  return material
}
export default {
  material: getMaterial,
  img,
};
