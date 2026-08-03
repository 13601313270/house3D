import * as THREE from 'three'
import { GroupBaseEntity } from '@/types/groupBase/entity';
import { BaseObjData, HandelInfo, Point } from '@/types/map2d';
import { GroupBaseData } from '@/types/groupBase';
import { BaseEntityClass } from '@/types/baseEntity';
import { PointEntityClass } from '@/types/pointEntity';
import drawAxes from '@/utils/drawAxes';

type WorldData = GroupBaseData & {
  temp: boolean,
}

export interface EnvironmentConfig {
  skyType: number
  ambientLightIntensity?: number
  showGround?: boolean
}

class WorldGroup extends GroupBaseEntity<WorldData> {
  name: string = 'world'
  type: string = 'world'
  // parentEntity: null;
  scene: THREE.Scene = new THREE.Scene()
  environmentConfig: EnvironmentConfig = { skyType: 1, ambientLightIntensity: 1, showGround: true }
  groundMesh: THREE.Mesh | null = null
  ambientLight: THREE.AmbientLight | null = null
  directionalLight: THREE.DirectionalLight | null = null
  canEditAnimationDataColumn: Array<keyof WorldData> = [];

  constructor(parent: null, data: WorldData) {
    super(parent, data)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0)
    this.setEnvironMent()
    this.scene.add(this.group)
    this.showGridHelper()
    this.showAxesHelper()
  }

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number) {
    super.draw2DPreview(ctx, zoomLevel)
    const angleY = this.getData().angleY;
    const canvasRect = ctx.canvas.getBoundingClientRect()
    const width = Math.floor(canvasRect.width)
    const height = Math.floor(canvasRect.height)
    drawAxes(ctx, angleY * -1, zoomLevel, width, height)
  }

  setEnvironMent(config?: EnvironmentConfig) {
    if (config) {
      this.environmentConfig = config
    }
    const intensity = this.environmentConfig.ambientLightIntensity !== undefined ? this.environmentConfig.ambientLightIntensity : 1.5
    console.log('intensity', intensity, this.environmentConfig.ambientLightIntensity);

    if (this.ambientLight) {
      this.ambientLight.intensity = intensity === 0 ? 0.1 : intensity
    } else {
      this.ambientLight = new THREE.AmbientLight(0xffffff, intensity)
      this.group.add(this.ambientLight)
    }

    // if (!this.directionalLight) {
    //   this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    //   this.directionalLight.position.set(100, 200, 100)
    //   this.scene.add(this.directionalLight)
    // }

    const skyType = this.environmentConfig.skyType || 1;
    const skyImgMap: Record<number, string> = {
      1: '/skyImg/sky.jpg',
      2: '/skyImg/sky2.jpg',
      3: '/skyImg/sky3.jpg',
      4: '/skyImg/sky4.jpg',
      5: '/skyImg/sky5.jpg',
      6: '/skyImg/sky6.jpg',
      7: '/skyImg/sky7.jpg',
    };
    const path = skyImgMap[skyType] || '/skyImg/sky.jpg';
    // === 加载 JPG 全景 ===
    const loaderSky = new THREE.TextureLoader();
    loaderSky.load(path, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = texture;
      this.scene.environment = texture; // 可选：简单环境光
    });

    // 添加地面
    const showGround = this.environmentConfig.showGround ?? true

    if (this.groundMesh) {
      this.groundMesh.visible = showGround
      return
    }

    if (!showGround) return

    const loaderGround = new THREE.TextureLoader();
    loaderGround.load('grand.jpg', (texture) => {
      // 增加一个地面平面
      const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1)
      // 设置纹理重复两次
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 12);

      const groundMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
      })
      this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
      this.groundMesh.rotation.x = -Math.PI / 2
      this.groundMesh.position.y = -10
      this.group.add(this.groundMesh)
    });
  }

  showMatchHandel(x: number, y: number) {
    return null
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
  }

  matchHandelInfo(x: number, y: number) {
    return null;
  }

  setPrepareState(x: number, y: number): string[] {
    return [];
  }
}
export default WorldGroup
