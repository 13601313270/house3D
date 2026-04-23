import * as THREE from 'three'
// @ts-ignore
import img from './wooden.jpg'

const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load(img);
const material = new THREE.MeshStandardMaterial({
  map: woodTexture,
})

export default material
