import * as THREE from 'three'
// @ts-ignore
import img from './wooden.jpg'
import { createTriplanarMaterial } from '../createTriplanarMaterial';

const textureLoader = new THREE.TextureLoader();

export default function getWoodenMeshByGeometry(geometry: THREE.BufferGeometry) {
  const woodTexture = textureLoader.load(img);
  const material = createTriplanarMaterial({
    map: woodTexture,
    tileSize: 10, // 👈 控制密度
  });
  return new THREE.Mesh(geometry, material)
}
