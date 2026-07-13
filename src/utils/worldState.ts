import * as THREE from 'three'
import { ImportFileType, ImportImgType, ObjOutputFileType } from "@/entities/allObjs"
import { EnvironmentConfig } from './world/entity'

class WorldState {
  scene: THREE.Scene
  allImportImgs: ImportImgType[] = []
  allImportFiles: ImportFileType[] = []
  ObjFileTypes: ObjOutputFileType[] = []
  environmentConfig: EnvironmentConfig = { skyType: 1, ambientLightIntensity: 1, showGround: true }

  groundMesh: THREE.Mesh | null = null
  ambientLight: THREE.AmbientLight | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    gridHelper.layers.set(2)
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    axesHelper.layers.set(2)
    this.scene.add(axesHelper);
  }

  // setEnvironMent(config?: EnvironmentConfig) {
  //   if (config) {
  //     window.worldState.environmentConfig = config
  //   }
  //   const intensity = window.worldState.environmentConfig.ambientLightIntensity !== undefined ? window.worldState.environmentConfig.ambientLightIntensity : 1.5
  //   console.log('intensity', intensity, window.worldState.environmentConfig.ambientLightIntensity);

  //   if (window.worldState.ambientLight) {
  //     window.worldState.ambientLight.intensity = intensity === 0 ? 0.1 : intensity
  //   } else {
  //     window.worldState.ambientLight = new THREE.AmbientLight(0xffffff, intensity)
  //     window.worldState.scene.add(window.worldState.ambientLight)
  //   }

  //   // if (!this.directionalLight) {
  //   //   this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  //   //   this.directionalLight.position.set(100, 200, 100)
  //   //   this.scene.add(this.directionalLight)
  //   // }

  //   const skyType = window.worldState.environmentConfig.skyType || 1;
  //   const skyImgMap: Record<number, string> = {
  //     1: '/skyImg/sky.jpg',
  //     2: '/skyImg/sky2.jpg',
  //     3: '/skyImg/sky3.jpg',
  //     4: '/skyImg/sky4.jpg',
  //     5: '/skyImg/sky5.jpg',
  //     6: '/skyImg/sky6.jpg',
  //     7: '/skyImg/sky7.jpg',
  //   };
  //   const path = skyImgMap[skyType] || '/skyImg/sky.jpg';
  //   // === 加载 JPG 全景 ===
  //   const loaderSky = new THREE.TextureLoader();
  //   loaderSky.load(path, (texture) => {
  //     texture.mapping = THREE.EquirectangularReflectionMapping;

  //     window.worldState.scene.background = texture;
  //     window.worldState.scene.environment = texture; // 可选：简单环境光
  //   });

  //   // 添加地面
  //   const showGround = window.worldState.environmentConfig.showGround ?? true

  //   if (window.worldState.groundMesh) {
  //     window.worldState.groundMesh.visible = showGround
  //     return
  //   }

  //   if (!showGround) return

  //   const loaderGround = new THREE.TextureLoader();
  //   loaderGround.load('grand.jpg', (texture) => {
  //     // 增加一个地面平面
  //     const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1)
  //     // 设置纹理重复两次
  //     texture.wrapS = THREE.RepeatWrapping;
  //     texture.wrapT = THREE.RepeatWrapping;
  //     texture.repeat.set(12, 12);

  //     const groundMaterial = new THREE.MeshStandardMaterial({
  //       map: texture,
  //       roughness: 0.8,
  //       metalness: 0.2,
  //     })
  //     window.worldState.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
  //     window.worldState.groundMesh.rotation.x = -Math.PI / 2
  //     window.worldState.groundMesh.position.y = -10
  //     window.worldState.scene.add(window.worldState.groundMesh)
  //   });
  // }
}
export default WorldState