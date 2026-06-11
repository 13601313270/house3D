import * as THREE from 'three'
import brickMaterial from './redBrick'
import cementMaterial from './cement'
import woodMaterial from './wooden'
import woodFloorMaterial from './woodFloor'
import roughPlankMaterial from './roughPlank'
import squareFloorTileMaterial from './squareFloorTile'
import clayRoofTilesMaterial from './clayRoofTiles'
import oldLinoleumFlooringMaterial from './oldLinoleumFlooring'
import sandstoneMaterial from './sandstone'
import brickPavementMaterial from './brickPavement'
import orientedStrandBoardMaterial from './orientedStrandBoard'
import marbleCliffMaterial from './marbleCliff'
import ginghamMaterial from './gingham'
import rockEmbeddedMaterial from './rockEmbedded'
import rustyMaterial from './rusty'
import leatherMaterial from './leather'
import leather2Material from './leather2'
import mossyGroundMaterial from './mossyGround'
import barkMaterial from './bark'
import cobblestonePavementMaterial from './cobblestonePavement'
import linenMaterial from './linen'
import oldStyleTilesMaterial from './oldStyleTiles'

export type MaterialDate = {
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
  {
    id: 14,
    name: '格林布料',
    material: ginghamMaterial.material,
    img: ginghamMaterial.img,
  },
  {
    id: 15,
    name: '岩嵌',
    material: rockEmbeddedMaterial.material,
    img: rockEmbeddedMaterial.img,
  },
  {
    id: 16,
    name: '锈色金属',
    material: rustyMaterial.material,
    img: rustyMaterial.img,
  },
  {
    id: 17,
    name: '皮革1',
    material: leatherMaterial.material,
    img: leatherMaterial.img,
  },
  {
    id: 18,
    name: '皮革2',
    material: leather2Material.material,
    img: leather2Material.img,
  },
  {
    id: 19,
    name: '苔藓地',
    material: mossyGroundMaterial.material,
    img: mossyGroundMaterial.img,
  },
  {
    id: 20,
    name: '树皮',
    material: barkMaterial.material,
    img: barkMaterial.img,
  },
  {
    id: 21,
    name: '鹅卵石地面',
    material: cobblestonePavementMaterial.material,
    img: cobblestonePavementMaterial.img,
  },
  {
    id: 22,
    name: '麻布',
    material: linenMaterial.material,
    img: linenMaterial.img,
  },
  {
    id: 23,
    name: '复古瓷砖',
    material: oldStyleTilesMaterial.material,
    img: oldStyleTilesMaterial.img,
  }
]

export { allMaterial }
export function getMaterialById(id: number) {
  return allMaterial.find(item => item.id === id)
}
