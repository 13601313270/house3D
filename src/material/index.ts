import * as THREE from 'three'
import brickMaterial from './redBrick'
import cementMaterial from './cement'
import woodMaterial from './wooden'
import woodFloorMaterial from './woodFloor'
import roughPlankMaterial from './roughPlank'
import squareFloorTileMaterial from './squareFloorTile'

type MaterialDate = {
  id: number
  name: string
  material: (vector: THREE.Vector3) => THREE.Material
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
    name: '水泥',
    material: cementMaterial.material,
    img: cementMaterial.img,
  },
  {
    id: 3,
    name: '木头',
    material: woodMaterial.material,
    img: woodMaterial.img,
  },
  {
    id: 4,
    name: '木地板',
    material: woodFloorMaterial.material,
    img: woodFloorMaterial.img,
  },
  {
    id: 5,
    name: '粗糙木板',
    material: roughPlankMaterial.material,
    img: roughPlankMaterial.img,
  },
  {
    id: 6,
    name: '方形地砖',
    material: squareFloorTileMaterial.material,
    img: squareFloorTileMaterial.img,
  }
]

export { allMaterial }
export function getMaterialById(id: number) {
  return allMaterial.find(item => item.id === id)
}
