<template>
  <div class="canvas-3d-container" ref="containerRef">
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { World } from '@/utils/world'

export type CameraState = {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  radius: number
  angleX: number
  angleY: number
  aspectW: number,
  aspectH: number,
} | {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  positionX: number
  positionY: number
  positionZ: number
  fov: number,
  aspectW: number,
  aspectH: number,
}

const props = defineProps<{
  world: World,
  cameraState?: CameraState,
  aspectRatio?: number
}>()

const emit = defineEmits<{ (e: 'update:cameraState', value: CameraState): void }>()

const containerRef = ref<HTMLDivElement | null>(null)

// let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null

const cameraState = ref<CameraState>({
  targetPositionX: 0,
  targetPositionY: 0,
  targetPositionZ: 0,
  radius: 800, // 摄像机距离
  angleX: 0,
  angleY: Math.PI / 4,
  aspectW: 1,
  aspectH: 1,
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
        if (!containerRef.value || !renderer || !camera) return
        const width = containerRef.value.clientWidth
        const height = containerRef.value.clientHeight
        const vFov = calcVerticalFovByHorizontalFov(fov, width / height)
        console.log('distance', vFov)
        camera.fov = vFov
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

  const scene = props.world.scene
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
          angleY: cameraState.value.angleY,
          aspectW: cameraState.value.aspectW,
          aspectH: cameraState.value.aspectH,
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
          aspectW: cameraState.value.aspectW,
          aspectH: cameraState.value.aspectH,
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

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  if (container) {
    container.appendChild(renderer.domElement)
  }
}

const animate = () => {
  const scene = props.world.scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
}

const resize = () => {
  if (!containerRef.value || !renderer || !camera) return
  if (!cameraState.value) return;
  // const width = containerRef.value.clientWidth
  // const height = containerRef.value.clientHeight

  // camera.aspect = width / height
  // if ('fov' in cameraState.value) {
  //   const vFov = calcVerticalFovByHorizontalFov(cameraState.value.fov, width / height)
  //   console.log('distance', vFov)
  //   camera.fov = vFov
  // }
  // console.log('camera.aspect', camera.aspect)
  // camera.updateProjectionMatrix()
  updateContainerHeight(renderer)
}

const updateScene = () => {
  if (props.world.scene) {
    props.world.draw3D()
    resize();
  }
}

const updateContainerHeight = (renderer: THREE.WebGLRenderer) => {
  if (!containerRef.value || !renderer || !camera) return
  if (!containerRef.value || !props.aspectRatio) return

  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight

  const containerAspectRatio = containerWidth / containerHeight
  let renderWidth, renderHeight

  if (props.aspectRatio > containerAspectRatio) {
    // Width is the limiting factor
    renderWidth = containerWidth
    renderHeight = containerWidth / props.aspectRatio
  } else {
    // Height is the limiting factor
    renderHeight = containerHeight
    renderWidth = containerHeight * props.aspectRatio
  }
  console.log('renderWidth', renderWidth, 'renderHeight', renderHeight)

  camera.aspect = renderWidth / renderHeight
  if ('fov' in cameraState.value) {
    const vFov = calcVerticalFovByHorizontalFov(cameraState.value.fov, renderWidth / renderHeight)
    console.log('distance', vFov)
    camera.fov = vFov
  }
  console.log('camera.aspect', camera.aspect)
  camera.updateProjectionMatrix()
  renderer.setSize(renderWidth, renderHeight)
  // console.log('render size', renderWidth, renderHeight, props.aspectRatio, containerAspectRatio)
}

onMounted(() => {
  nextTick(() => {
    if (renderer) {
      updateContainerHeight(renderer)
    }
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

watch(() => props.cameraState, (newVal) => {
  if (newVal) {
    cameraState.value = { ...newVal }
    updateCameraAngel()
    updateScene()
  }
}, {
  deep: true
})

defineExpose({
  resize
})
function calcVerticalFovByHorizontalFov(hFov: number, aspect: number) {
  const vFov = 2 * Math.atan(Math.tan((hFov * Math.PI / 180) / 2) / aspect)
  return vFov * 180 / Math.PI
}
</script>

<style scoped lang="less">
.canvas-3d-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  height: 100%;

  /* background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
  :deep(>canvas) {
    border: 2px solid #d0d0d0;
    box-sizing: border-box;
    border-radius: 8px;
    width: 100%;
    height: 100%;
  }
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
