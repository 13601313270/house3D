import * as THREE from 'three'
import brickMaterial from './redBrick'
import cementMaterial from './cement'
import woodMaterial from './wooden'

type MaterialDate = {
  id: number
  name: string
  material: THREE.Material
  img: string
}

const allMaterial: MaterialDate[] = [
  {
    id: 1,
    name: '砖墙',
    material: brickMaterial.material,
    img: brickMaterial.img,
  },
  {
    id: 2,
    name: '水泥墙',
    material: cementMaterial.material,
    img: cementMaterial.img,
  },
  {
    id: 3,
    name: '木头',
    material: woodMaterial.material,
    img: woodMaterial.img,
  }
]

export default allMaterial
