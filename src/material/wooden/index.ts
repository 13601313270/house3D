import * as THREE from 'three'
// @ts-ignore
import img from './wooden.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
const material = createTriplanarMaterial({
  map: woodTexture,
  tileSize: 20, // 👈 控制密度
});
export default {
  material,
  img,
};
