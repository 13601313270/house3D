import * as THREE from 'three'
// @ts-ignore
import img from './cement.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
const material = createTriplanarMaterial({
  map: woodTexture,
  tileSize: 100, // 👈 控制密度
});
export default material;
