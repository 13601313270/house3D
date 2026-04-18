<template>
  <div class="canvas-3d-container" ref="containerRef">
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
// import { createShapeFromPoints } from '@/utils/createShapeFromPoints'
import { Geometry } from 'martinez-polygon-clipping'
import { Wall } from '@/entities/wall/index.d'
import { Door } from '@/entities/door/index.d'
import { Window } from '@/entities/window/index.d'
import { DoorEntity } from '@/entities/door'
import { WindowEntity } from '@/entities/window'
import { WallEntity } from '@/entities/wall'
import { fileData } from '@/entities'
import { CameraEntity } from '@/entities/camera'

export type CameraState = {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  radius: number
  angleX: number
  angleY: number
} | {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  positionX: number
  positionY: number
  positionZ: number
  fov: number
}

const props = defineProps<{
  data: fileData,
  cameraState?: CameraState
}>()

const emit = defineEmits<{(e: 'update:cameraState', value: CameraState): void}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null

const cameraState = ref<CameraState>({
  targetPositionX: 0,
  targetPositionY: 0,
  targetPositionZ: 0,
  radius: 800, // 摄像机距离
  angleX: 0,
  angleY: Math.PI / 4,
})

function updateCameraAngel() {
  if ('radius' in cameraState.value && cameraState.value.radius) {
    const camera1X = cameraState.value.radius * Math.sin(cameraState.value.angleX) * Math.cos(cameraState.value.angleY) * -1;
    const camera1Y = cameraState.value.radius * Math.sin(cameraState.value.angleY);
    const camera1Z = cameraState.value.radius * Math.cos(cameraState.value.angleX) * Math.cos(cameraState.value.angleY);

    if (camera) {
      camera.position.set(
        cameraState.value.targetPositionX + camera1X, // 镜头左右摇摆
        cameraState.value.targetPositionY + camera1Y,
        cameraState.value.targetPositionZ + camera1Z
      );
      camera.lookAt(
        cameraState.value.targetPositionX,
        cameraState.value.targetPositionY,
        cameraState.value.targetPositionZ
      );
    }
  } else if ('positionX' in cameraState.value) {
    if (camera) {
      const fov = cameraState.value.fov
      if (fov > 10 && fov < 180) {
        console.log('distance', fov)
        camera.fov = fov
      }

      camera.position.set(
        cameraState.value.positionX,
        cameraState.value.positionZ,
        cameraState.value.positionY,
      );
      camera.lookAt(
        cameraState.value.targetPositionX,
        cameraState.value.targetPositionZ,
        cameraState.value.targetPositionY
      );
      camera.updateProjectionMatrix()
    }
  }

  // if (camera) {
  //   camera.lookAt(
  //     camera.position.x - camera2X,
  //     camera.position.y - camera2Y,
  //     camera.position.z - camera2Z,
  //   );
  // }
  // camera2Cube.position.set(
  //   camera2.position.x,
  //   camera2.position.y,
  //   camera2.position.z
  // );
  // camera2Cube.rotation.set(
  //   camera2.rotation.x,
  //   camera2.rotation.y,
  //   camera2.rotation.z
  // );
}
const initThree = () => {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)
  const maxCamera1Radius = 10000;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, maxCamera1Radius)
  camera.position.set(0, 800, 1200)
  camera.lookAt(0, 0, 0);

  (() => {
    // let canvas2IsMouseAngel = false;
    // let canvas2IsMouseMove = false;
    // let canvas2LastMouseX = 0;
    // let canvas2LastMouseY = 0;

    const camera2AngleY = 0; // 摄像机垂直移动
    const camera2AngleX = 0; // 摄像机横移
    // let camera2AngelStartX = 0;
    // let camera2AngelStartY = 0;
    // let camera2PositionStartX = 0;
    // let camera2PositionStartZ = 0;
    let camera1TargetPositionStartX = 0;
    let camera1TargetPositionStartY = 0;
    let camera1TargetPositionStartZ = 0;

    let canvas1IsMouseAngel = false;
    let canvas1IsMouseMove = false;
    let canvas1LastMouseX = 0;
    let canvas1LastMouseY = 0;

    let camera1AngelStartX = 0;
    let camera1AngelStartY = 0;

    updateCameraAngel()

    const emitCameraState = () => {
      if ('radius' in cameraState.value) {
        emit('update:cameraState', {
          targetPositionX: cameraState.value.targetPositionX,
          targetPositionY: cameraState.value.targetPositionY,
          targetPositionZ: cameraState.value.targetPositionZ,
          radius: cameraState.value.radius,
          angleX: cameraState.value.angleX,
          angleY: cameraState.value.angleY
        })
      } else if ('positionX' in cameraState.value) {
        emit('update:cameraState', {
          targetPositionX: cameraState.value.targetPositionX,
          targetPositionY: cameraState.value.targetPositionZ,
          targetPositionZ: cameraState.value.targetPositionY,
          positionX: cameraState.value.positionX,
          positionY: cameraState.value.positionZ,
          positionZ: cameraState.value.positionY,
          fov: cameraState.value.fov,
        })
      }
    }

    const container = containerRef.value
    if (!container) return

    container.addEventListener('mousedown', (e) => {
      if ('radius' in cameraState.value) {
        if (e.button === 2) {
          // 旋转
          camera1AngelStartX = cameraState.value.angleX;
          camera1AngelStartY = cameraState.value.angleY;
          canvas1IsMouseAngel = true;
          canvas1LastMouseX = e.clientX;
          canvas1LastMouseY = e.clientY;
          e.preventDefault();
        } else if (e.button === 0) {
          // 移动
          camera1TargetPositionStartX = cameraState.value.targetPositionX;
          camera1TargetPositionStartY = cameraState.value.targetPositionY;
          camera1TargetPositionStartZ = cameraState.value.targetPositionZ;
          canvas1IsMouseMove = true;
          canvas1LastMouseX = e.clientX;
          canvas1LastMouseY = e.clientY;
          e.preventDefault();
        }
      }
    })
    container.addEventListener('mousemove', (e) => {
      if ('radius' in cameraState.value) {
        if (canvas1IsMouseAngel) {
          // 镜头旋转
          const delta2DDiffX = e.clientX - canvas1LastMouseX;
          const delta2DDiffY = e.clientY - canvas1LastMouseY;
          cameraState.value.angleX = camera1AngelStartX + delta2DDiffX * 0.01;
          const angleY = camera1AngelStartY + delta2DDiffY * 0.01;
          cameraState.value.angleY = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, angleY)); // 因为camera，是采用控制position和lookat的逻辑，所以在angleY==Math.PI/2的定点的时候，无法控制方向，所以这里限制一下，只允许angleY在[-Math.PI/2+0.05, Math.PI/2-0.05]之间
          updateCameraAngel()
        } else if (canvas1IsMouseMove) {
          const deltaX = e.clientX - canvas1LastMouseX;
          const deltaY = e.clientY - canvas1LastMouseY;
          const sensitivity = 1;

          cameraState.value.targetPositionX = camera1TargetPositionStartX - (deltaX * Math.cos(cameraState.value.angleX) - deltaY * Math.sin(cameraState.value.angleX)) * sensitivity;
          cameraState.value.targetPositionZ = camera1TargetPositionStartZ - (deltaX * Math.sin(cameraState.value.angleX) + deltaY * Math.cos(cameraState.value.angleX)) * sensitivity;
          updateCameraAngel()
        }
      }
    })
    container.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        canvas1IsMouseAngel = false
        emitCameraState()
      } else if (e.button === 0) {
        canvas1IsMouseMove = false
        emitCameraState()
      }
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      if ('radius' in cameraState.value) {
        const zoomSpeed = 0.001;
        const delta = e.deltaY * zoomSpeed;
        const newRadius = Math.max(5, Math.min(maxCamera1Radius, cameraState.value.radius * (1 + delta)));
        cameraState.value.radius = newRadius;
        updateCameraAngel();
        emitCameraState()
      }
    }, { passive: false });

    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  })();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  scene.add(directionalLight)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  if (container) {
    container.appendChild(renderer.domElement)
  }
}

let wallEntityList: WallEntity[] = []

const renderWalls = () => {
  if (!scene) return

  wallEntityList = [];
  props.data.wall.forEach((wall) => {
    const api = new WallEntity(wall);
    wallEntityList.push(api)
    const meshList = api.draw3DAndCache()
    meshList.forEach(mesh => scene!.add(mesh))
  })

  // const margineds: Geometry | null = createShapeFromPoints(props.data.walls);
  // if (!margineds) return

  // // console.log('margineds', margineds)
  // for (const poly of margineds || []) {
  //   for (let i = 0; i < poly.length; i++) {
  //     const ring = poly[i] as any
  //     const points = []; // wall.points.map((p) => new THREE.Vector2(p.x, p.y))
  //     for (let j = 0; j < ring.length; j++) {
  //       if (ring[j] === null) continue
  //       points.push(new THREE.Vector2(ring[j][0], ring[j][1] * -1))
  //     }

  //     const shape = new THREE.Shape(points)

  //     const extrudeSettings = {
  //       steps: 1,
  //       depth: 280,
  //       bevelEnabled: true,
  //       // bevelThickness: 2,
  //       // bevelSize: 2,
  //       // bevelSegments: 1
  //     }

  //     const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  //     geometry.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
  //     const material = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, side: THREE.DoubleSide })
  //     const wallMesh = new THREE.Mesh(geometry, material)
  //     wallMesh.position.set(0, 0, 0)
  //     wallMesh.castShadow = true
  //     wallMesh.receiveShadow = true
  //     scene!.add(wallMesh)
  //   }
  // }
  // props.data.walls.forEach((wall) => {
  //   if (wall.points.length < 2) return
  //   console.log(11111, wall.points)
  //   const points = wall.points.map((p) => new THREE.Vector2(p.x, p.y))
  //   const shape = new THREE.Shape(points)

  //   const extrudeSettings = {
  //     steps: 1,
  //     depth: 20,
  //     bevelEnabled: true,
  //     bevelThickness: 2,
  //     bevelSize: 2,
  //     bevelSegments: 1
  //   }

  //   const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  //   const material = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, side: THREE.DoubleSide })
  //   const wallMesh = new THREE.Mesh(geometry, material)
  //   wallMesh.position.set(0, 10, 0)
  //   wallMesh.castShadow = true
  //   wallMesh.receiveShadow = true
  //   scene!.add(wallMesh)

  //   wall.points.forEach((point) => {
  //     const pointGeometry = new THREE.SphereGeometry(3, 8, 8)
  //     const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x1890ff })
  //     const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
  //     pointMesh.position.set(point.x, 0, point.y)
  //     scene!.add(pointMesh)
  //   })
  // })
}

const renderDoors = () => {
  if (!scene) return

  props.data.door.forEach((door) => {
    const api = new DoorEntity(door);

    const wall = props.data.wall.find((wall) => wall.id === door.wallId);

    const findWall = wallEntityList.find((entity) => entity.data.id === door.wallId)

    const meshList = api.draw3DAndCache(findWall)
    meshList.forEach(mesh => scene!.add(mesh))
  })
}

const renderWindows = () => {
  if (!scene) return

  props.data.window.forEach((win) => {
    const api = new WindowEntity(win)
    const findWall = wallEntityList.find((entity) => entity.data.id === win.wallId)
    const meshList = api.draw3DAndCache(findWall)
    meshList.forEach(mesh => scene!.add(mesh))

    // const geometry = new THREE.CylinderGeometry(3, 3, 20, 8)
    // const material = new THREE.MeshStandardMaterial({ color: 0x3498db })
    // const winMesh = new THREE.Mesh(geometry, material)
    // winMesh.position.set(win.x, 10, win.y)
    // scene!.add(winMesh)
  })
}

const renderCameras = () => {
  if (!scene) return
  props.data.camera.forEach((camera) => {
    const api = new CameraEntity(camera)
    const meshList = api.draw3DAndCache()
    meshList.forEach(mesh => scene!.add(mesh))
  })
}

const animate = () => {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
}

const resize = () => {
  if (!containerRef.value || !renderer || !camera) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const updateScene = () => {
  if (scene) {
    while (scene.children.length > 0) {
      scene.remove(scene.children[0])
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 200, 100)
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    scene.add(axesHelper)

    renderWalls()
    renderDoors()
    renderWindows()
    renderCameras()
    resize();
  }
}

onMounted(() => {
  nextTick(() => {
    initThree()
    if (props.cameraState) {
      cameraState.value = { ...props.cameraState }
      updateCameraAngel()
    }
    updateScene()
    animate()
  })
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)

  if (renderer) {
    renderer.dispose()
  }
})

watch(() => props.data, () => {
  updateScene()
}, { deep: true })

watch(() => props.cameraState, (newVal) => {
  if (newVal) {
    cameraState.value = { ...newVal }
    updateCameraAngel()
  }
})

defineExpose({
  resize
})
</script>

<style scoped>
.canvas-3d-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
