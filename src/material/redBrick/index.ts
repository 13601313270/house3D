import * as THREE from 'three'
// @ts-ignore
import img from './redBrick.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
const material = createTriplanarMaterial({
  map: woodTexture,
  tileSize: 160, // 👈 控制密度
});
export default material;
