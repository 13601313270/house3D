import * as THREE from 'three'
import brickMaterial from './redBrick'
import cementMaterial from './cement'
import woodMaterial from './wooden'
import woodFloorMaterial from './woodFloor'
import roughPlankMaterial from './roughPlank'
import squareFloorTileMaterial from './squareFloorTile'
import clayRoofTilesMaterial from './clayRoofTiles'
import ironMaterial from './iron'
import oldLinoleumFlooringMaterial from './oldLinoleumFlooring'
import sandstoneMaterial from './sandstone'
import brickPavementMaterial from './brickPavement'
import orientedStrandBoardMaterial from './orientedStrandBoard'
import marbleCliffMaterial from './marbleCliff'

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
  },
  {
    id: 7,
    name: '粘土瓦片',
    material: clayRoofTilesMaterial.material,
    img: clayRoofTilesMaterial.img,
  },
  // {
  //   id: 8,
  //   name: '铁',
  //   material: ironMaterial.material,
  //   img: ironMaterial.img,
  // },
  {
    id: 9,
    name: '复古地砖',
    material: oldLinoleumFlooringMaterial.material,
    img: oldLinoleumFlooringMaterial.img,
  },
  {
    id: 10,
    name: '沙石',
    material: sandstoneMaterial.material,
    img: sandstoneMaterial.img,
  },
  {
    id: 11,
    name: '砖铺',
    material: brickPavementMaterial.material,
    img: brickPavementMaterial.img,
  },
  {
    id: 12,
    name: '定向刨花板',
    material: orientedStrandBoardMaterial.material,
    img: orientedStrandBoardMaterial.img,
  },
  {
    id: 13,
    name: '大理石崖',
    material: marbleCliffMaterial.material,
    img: marbleCliffMaterial.img,
  },
]

export { allMaterial }
export function getMaterialById(id: number) {
  return allMaterial.find(item => item.id === id)
}
