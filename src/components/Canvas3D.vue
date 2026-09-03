<template>
  <div class="canvas-3d-container" ref="containerRef" @mouseleave="mouseLeave">
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { CameraState, OrthographicCamera } from '@/types/camera'
import { PointEntityClass } from '@/types/pointEntity';
import { BaseEntityClass } from '@/types/baseEntity';

const props = defineProps<{
  cameraState: CameraState,//  | OrthographicCamera,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  aspectRatio: number
  showCamera: boolean
  cameraType: 'perspective'// | 'orthographic'
}>()

const emit = defineEmits<{
  (e: 'update:cameraState', value: CameraState | OrthographicCamera): void
  (e: 'objectHover', object: THREE.Object3D | null): void
  (e: 'objectClick', object: THREE.Object3D | null): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

// let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
const raycaster: THREE.Raycaster = new THREE.Raycaster()
raycaster.layers.set(2)

const cameraStateZ = ref<CameraState | OrthographicCamera>({
  targetPositionX: 0,
  targetPositionY: 0,
  targetPositionZ: 0,
  radius: 800, // 摄像机距离
  angleX: 0,
  angleY: Math.PI / 4,
  aspectW: 1,
  aspectH: 1,
})

function raycastObjects(list: THREE.Group[], event: MouseEvent): THREE.Object3D | null {
  if (!camera || !containerRef.value || !renderer) return null

  // const rect = containerRef.value.getBoundingClientRect()
  // const canvasRect = renderer.domElement.getBoundingClientRect()

  // const scaleX = canvasRect.width / rect.width
  // const scaleY = canvasRect.height / rect.height

  // const x = ((event.clientX - rect.left) * scaleX / canvasRect.width) * 2 - 1
  // const y = -((event.clientY - rect.top) * scaleY / canvasRect.height) * 2 + 1
  // @ts-ignore
  const x = event.offsetX / event.target!.offsetWidth * 2 - 1
  // @ts-ignore
  const y = -(event.offsetY / event.target!.offsetHeight) * 2 + 1

  const mouse = new THREE.Vector2(x, y)
  // @ts-ignore
  // window.fffff = event;
  // console.log('hoveredObject-x', x)
  // console.log('hoveredObject-y', y)
  mouse.set(x, y)
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(list, true)

  if (intersects.length > 0) {
    return intersects[0].object
  }
  return null
}

function updateCameraAngel() {
  // if (props.cameraType === 'orthographic') {
  //   if ('size' in cameraStateZ.value) {
  //     if (camera instanceof THREE.OrthographicCamera) {
  //       camera.left = -cameraStateZ.value.size * props.aspectRatio;
  //       camera.right = cameraStateZ.value.size * props.aspectRatio;
  //       camera.top = cameraStateZ.value.size;
  //       camera.bottom = -cameraStateZ.value.size;
  //       camera.updateProjectionMatrix()
  //       camera.position.set(
  //         cameraStateZ.value.targetPositionX,
  //         cameraStateZ.value.targetPositionZ + cameraStateZ.value.length,
  //         cameraStateZ.value.targetPositionY,
  //       );
  //       camera.lookAt(
  //         cameraStateZ.value.targetPositionX,
  //         cameraStateZ.value.targetPositionZ,
  //         cameraStateZ.value.targetPositionY
  //       );
  //       camera.updateProjectionMatrix()
  //     }
  //   }
  // }
  if ('radius' in cameraStateZ.value && cameraStateZ.value.radius) {
    const camera1X = cameraStateZ.value.radius * Math.sin(cameraStateZ.value.angleX) * Math.cos(cameraStateZ.value.angleY) * -1;
    const camera1Y = cameraStateZ.value.radius * Math.sin(cameraStateZ.value.angleY);
    const camera1Z = cameraStateZ.value.radius * Math.cos(cameraStateZ.value.angleX) * Math.cos(cameraStateZ.value.angleY);

    if (camera) {
      camera.position.set(
        cameraStateZ.value.targetPositionX + camera1X, // 镜头左右摇摆
        cameraStateZ.value.targetPositionY + camera1Y,
        cameraStateZ.value.targetPositionZ + camera1Z
      );
      camera.lookAt(
        cameraStateZ.value.targetPositionX,
        cameraStateZ.value.targetPositionY,
        cameraStateZ.value.targetPositionZ
      );
    }
  } else if ('fov' in cameraStateZ.value) {
    if (camera) {
      // camera.position.set(
      //   cameraStateZ.value.positionX,
      //   cameraStateZ.value.positionZ,
      //   cameraStateZ.value.positionY,
      // );
      // camera.lookAt(
      //   cameraStateZ.value.targetPositionX,
      //   cameraStateZ.value.targetPositionZ,
      //   cameraStateZ.value.targetPositionY
      // );
      camera.updateProjectionMatrix()
    }
  }
}
const initThree = () => {
  const container = containerRef.value
  if (!container) return
  const maxCamera1Radius = 20000;
  // if (props.cameraType === 'orthographic' && ('size' in props.cameraState)) {
  //   camera = new THREE.OrthographicCamera(
  //     -props.cameraState.size * props.aspectRatio,
  //     props.cameraState.size * props.aspectRatio,
  //     props.cameraState.size,
  //     -props.cameraState.size,
  //     0.1,
  //     1000
  //   )
  //   camera.position.set(
  //     props.cameraState.targetPositionX,
  //     props.cameraState.targetPositionZ + props.cameraState.length,
  //     props.cameraState.targetPositionY
  //   )
  //   camera.lookAt(
  //     props.cameraState.targetPositionX,
  //     props.cameraState.targetPositionZ,
  //     props.cameraState.targetPositionY
  //   )
  // } else {
  camera = props.camera;// || new THREE.PerspectiveCamera(55, props.aspectRatio, 0.1, maxCamera1Radius)
  camera.position.set(0, 800, 1200)
  camera.lookAt(0, 0, 0);
  // }

  if (props.showCamera) {
    camera.layers.enable(2);
  } else {
    camera.layers.disable(2);
  }

  renderer = new THREE.WebGLRenderer({ antialias: true })
  // pixelRatio=1：使 canvas.width/height 等于 setSize 传入的逻辑尺寸（固定 2048）
  renderer.setPixelRatio(1)
  renderer.shadowMap.enabled = true

  if (container) {
    container.appendChild(renderer.domElement)
  }

  (() => {
    let canvas1IsMouseAngel = false;
    let camera1AngelStartX = 0;
    let camera1AngelStartY = 0;

    let canvas1IsMouseMove = false;
    let camera1TargetPositionStartX = 0;
    let camera1TargetPositionStartY = 0;
    let camera1TargetPositionStartZ = 0;

    let canvas1IsMouseMoveObj = false;
    let camera1MouseMoveStartZ = 0;
    let canvas1HoveredObject: THREE.Object3D<THREE.Object3DEventMap> | null = null;

    let canvas1LastMouseX = 0;
    let canvas1LastMouseY = 0;

    updateCameraAngel()

    const emitCameraState = () => {
      // if (props.cameraType === 'orthographic') {
      //   if ('size' in cameraStateZ.value) {
      //     // alert(cameraStateZ.value.length);
      //     emit('update:cameraState', {
      //       targetPositionX: cameraStateZ.value.targetPositionX,
      //       targetPositionY: cameraStateZ.value.targetPositionY,
      //       targetPositionZ: cameraStateZ.value.targetPositionZ,
      //       size: cameraStateZ.value.size,
      //       length: cameraStateZ.value.length,
      //     })
      //   }
      // }
      if ('radius' in cameraStateZ.value) {
        emit('update:cameraState', {
          targetPositionX: cameraStateZ.value.targetPositionX,
          targetPositionY: cameraStateZ.value.targetPositionY,
          targetPositionZ: cameraStateZ.value.targetPositionZ,
          radius: cameraStateZ.value.radius,
          angleX: cameraStateZ.value.angleX,
          angleY: cameraStateZ.value.angleY,
          aspectW: cameraStateZ.value.aspectW,
          aspectH: cameraStateZ.value.aspectH,
        })
      } else if ('fov' in cameraStateZ.value) {
        emit('update:cameraState', {
          targetPositionX: cameraStateZ.value.targetPositionX,
          targetPositionY: cameraStateZ.value.targetPositionZ,
          targetPositionZ: cameraStateZ.value.targetPositionY,
          positionX: cameraStateZ.value.positionX,
          positionY: cameraStateZ.value.positionZ,
          positionZ: cameraStateZ.value.positionY,
          fov: cameraStateZ.value.fov,
          aspectW: cameraStateZ.value.aspectW,
          aspectH: cameraStateZ.value.aspectH,
        })
      }
    }

    const container = containerRef.value
    if (!container) return

    function mouseDown(e: MouseEvent) {
      // if (props.cameraType === 'orthographic') {
      //   if (e.button === 2) {
      //   } else if (e.button === 0) {
      //     // 移动
      //     camera1TargetPositionStartX = cameraStateZ.value.targetPositionX;
      //     camera1TargetPositionStartY = cameraStateZ.value.targetPositionY;
      //     camera1TargetPositionStartZ = cameraStateZ.value.targetPositionZ;
      //     canvas1IsMouseMove = true;
      //     canvas1LastMouseX = e.clientX;
      //     canvas1LastMouseY = e.clientY;
      //     e.preventDefault();
      //   }
      // }
      if ('radius' in cameraStateZ.value) {
        if (e.button === 2) {
          // 旋转
          camera1AngelStartX = cameraStateZ.value.angleX;
          camera1AngelStartY = cameraStateZ.value.angleY;
          canvas1IsMouseAngel = true;
          canvas1LastMouseX = e.clientX;
          canvas1LastMouseY = e.clientY;
          e.preventDefault();
        } else if (e.button === 0) {
          const hoveredObject = raycastObjects(window.globalEditGroup.moveZBoxList(), e)
          if (hoveredObject) {
            // 移动对象
            // @ts-ignore
            const entity = hoveredObject.entity as BaseEntityClass<any>
            if (entity instanceof PointEntityClass) {
              canvas1IsMouseMoveObj = true;
              canvas1LastMouseX = e.clientX;
              canvas1LastMouseY = e.clientY;
              canvas1HoveredObject = hoveredObject
              camera1MouseMoveStartZ = entity.getData().z;
            }
          } else {
            // 移动相机
            camera1TargetPositionStartX = cameraStateZ.value.targetPositionX;
            camera1TargetPositionStartY = cameraStateZ.value.targetPositionY;
            camera1TargetPositionStartZ = cameraStateZ.value.targetPositionZ;
            canvas1IsMouseMove = true;
            canvas1LastMouseX = e.clientX;
            canvas1LastMouseY = e.clientY;
            e.preventDefault();
          }
        }
      }
    }
    function mouseMove(e: MouseEvent) {
      // if (props.cameraType === 'orthographic') {
      //   if (canvas1IsMouseAngel) {

      //   }
      //   else if (canvas1IsMouseMove) {
      //     if ('size' in cameraStateZ.value) {
      //       const deltaX = e.clientX - canvas1LastMouseX;
      //       const deltaY = e.clientY - canvas1LastMouseY;
      //       const sensitivity = cameraStateZ.value.size / 200;

      //       cameraStateZ.value.targetPositionX = camera1TargetPositionStartX - deltaX * sensitivity;
      //       cameraStateZ.value.targetPositionY = camera1TargetPositionStartY - deltaY * sensitivity;
      //       updateCameraAngel()
      //     }
      //   } else {
      //     // const hoveredObject = raycastObjects(e)
      //     // // console.log('hoveredObject', hoveredObject)
      //     // emit('objectHover', hoveredObject)
      //   }
      // }
      if ('radius' in cameraStateZ.value) {
        const deltaX = e.clientX - canvas1LastMouseX;
        const deltaY = e.clientY - canvas1LastMouseY;
        if (canvas1IsMouseAngel) {
          // 镜头旋转
          cameraStateZ.value.angleX = camera1AngelStartX + deltaX * 0.01;
          const angleY = camera1AngelStartY + deltaY * 0.01;
          cameraStateZ.value.angleY = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, angleY)); // 因为camera，是采用控制position和lookat的逻辑，所以在angleY==Math.PI/2的定点的时候，无法控制方向，所以这里限制一下，只允许angleY在[-Math.PI/2+0.05, Math.PI/2-0.05]之间
          updateCameraAngel()
        } else if (canvas1IsMouseMove) {
          // 移动相机
          const sensitivity = cameraStateZ.value.radius / 450;
          cameraStateZ.value.targetPositionX = camera1TargetPositionStartX - (deltaX * Math.cos(cameraStateZ.value.angleX) - deltaY * Math.sin(cameraStateZ.value.angleX)) * sensitivity;
          cameraStateZ.value.targetPositionZ = camera1TargetPositionStartZ - (deltaX * Math.sin(cameraStateZ.value.angleX) + deltaY * Math.cos(cameraStateZ.value.angleX)) * sensitivity;
          updateCameraAngel()
        } else if (canvas1IsMouseMoveObj) {
          // 移动对象
          // @ts-ignore
          if (canvas1HoveredObject && canvas1HoveredObject?.entity) {
            const allBoundingBox = window.globalEditGroup.boundingBoxList()
            allBoundingBox.forEach((item) => {
              item.visible = false
            })
            // @ts-ignore
            const entity = canvas1HoveredObject.entity as BaseEntityClass<any>
            if (entity instanceof PointEntityClass) {
              entity.setData({
                // ...entity.getData(),
                z: camera1MouseMoveStartZ + (deltaY * -1)
              })
              entity.moveZBox.visible = true
              entity.boundingBox.visible = true
              entity.boundingBox.children[1].visible = true
            }
          }
        }
      }
    }
    function mouseUp(e: MouseEvent) {
      // if (props.cameraType === 'orthographic') {
      //   canvas1IsMouseMove = false
      //   emitCameraState()
      // } else {
      if (e.button === 2) {
        canvas1IsMouseAngel = false
        emitCameraState()
      } else if (e.button === 0) {
        canvas1IsMouseMoveObj = false
        canvas1IsMouseMove = false
        emitCameraState()
      }
      // }
    }
    renderer.domElement.addEventListener('mousedown', (e) => {
      mouseDown(e)
      document.addEventListener('mousemove', mouseMove)
      document.addEventListener('mouseup', (e) => {
        mouseUp(e)
        document.removeEventListener('mousemove', mouseMove)
        document.removeEventListener('mouseup', mouseUp)
      });
    })

    renderer.domElement.addEventListener('mousemove', (e) => {
      if ('radius' in cameraStateZ.value) {
        if (canvas1IsMouseAngel || canvas1IsMouseMove || canvas1IsMouseMoveObj) {
          return
        }
        const allBoundingBox = window.globalEditGroup.boundingBoxList()
        allBoundingBox.forEach((item) => {
          item.visible = false
        })

        const allMoveZBox = window.globalEditGroup.moveZBoxList()
        const allLastTextBox: any[] = [];
        allMoveZBox.forEach((item) => {
          // @ts-ignore
          const entity = item.children[0].entity as BaseEntityClass<any>
          if (entity instanceof PointEntityClass) {
            entity.moveZBox.visible = false
          }
          allLastTextBox.push(item.children[0]);
        })
        // @ts-ignore
        const hoveredObject = raycastObjects([...allBoundingBox, ...allLastTextBox], e)
        if (hoveredObject) {
          // 移动对象
          // @ts-ignore
          const entity = hoveredObject.entity as BaseEntityClass<any>
          if (entity instanceof PointEntityClass) {
            entity.moveZBox.visible = true
            entity.boundingBox.visible = true
            entity.boundingBox.children[1].visible = true
          }
        }
      }
    })

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      // if (props.cameraType === 'orthographic') {
      //   if ('size' in cameraStateZ.value) {
      //     const zoomSpeed = 0.001;
      //     const delta = e.deltaY * zoomSpeed;
      //     const newSize = Math.max(1, Math.min(1000, cameraStateZ.value.size * (1 + delta)));
      //     cameraStateZ.value.size = newSize;
      //     console.log(newSize)
      //     updateCameraAngel();
      //     emitCameraState()
      //   }
      // }
      if ('radius' in cameraStateZ.value) {
        const zoomSpeed = 0.001;
        const delta = e.deltaY * zoomSpeed;
        const newRadius = Math.max(5, Math.min(maxCamera1Radius, cameraStateZ.value.radius * (1 + delta)));
        cameraStateZ.value.radius = newRadius;
        updateCameraAngel();
        emitCameraState()
      }
    }, { passive: false });

    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    container.addEventListener('click', () => {
      if (!canvas1IsMouseMove && !canvas1IsMouseAngel) {
        // const clickedObject = raycastObjects(e)
        // emit('objectClick', clickedObject)
      }
    });
  })();
}

const animate = () => {
  const scene = window.worldApi.scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
}

const resize = () => {
  if (!containerRef.value || !renderer || !camera) return
  if (!cameraStateZ.value) return;
  updateContainerHeight(renderer)
}

const updateContainerHeight = (renderer: THREE.WebGLRenderer) => {
  if (!containerRef.value || !renderer || !camera) return
  if (!props.aspectRatio) return

  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight

  const containerAspectRatio = containerWidth / containerHeight
  let displayWidth, displayHeight

  if (props.aspectRatio > containerAspectRatio) {
    // 宽度受限，按容器宽度计算显示尺寸
    displayWidth = containerWidth
    displayHeight = containerWidth / props.aspectRatio
  } else {
    // 高度受限，按容器高度计算显示尺寸
    displayHeight = containerHeight
    displayWidth = containerHeight * props.aspectRatio
  }

  // canvas 绘制缓冲区固定为 2048 宽（逻辑分辨率），与 CSS 显示尺寸解耦
  const drawingWidth = 2048
  const drawingHeight = Math.round(drawingWidth / props.aspectRatio)

  let hasChangeCamera = false
  const newAspect = drawingWidth / drawingHeight
  if (camera instanceof THREE.PerspectiveCamera) {
    if (camera.aspect !== newAspect) {
      camera.aspect = newAspect
      hasChangeCamera = true
    }
    if ('fov' in cameraStateZ.value) {
      const vFov = calcVerticalFovByHorizontalFov(cameraStateZ.value.fov, newAspect)
      // console.log('distance', vFov)
      if (camera.fov !== vFov) {
        camera.fov = vFov
        hasChangeCamera = true
      }
    }
  } else if (camera instanceof THREE.OrthographicCamera) {
    // if ('size' in cameraState.value) {
    //   const newLeft = -cameraState.value.size * newAspect
    //   const newRight = cameraState.value.size * newAspect
    //   const newTop = -cameraState.value.size
    //   const newBottom = cameraState.value.size

    //   if (camera.left !== newLeft || camera.right !== newRight || camera.top !== newTop || camera.bottom !== newBottom) {
    //     camera.left = newLeft
    //     camera.right = newRight
    //     camera.top = newTop
    //     camera.bottom = newBottom
    //     hasChangeCamera = true
    //   }
    // }
  }
  // 设置绘制缓冲区分辨率（updateStyle=false：不覆盖 CSS 样式，实现与显示尺寸解耦）
  renderer.setSize(drawingWidth, drawingHeight, false)
  // CSS 显示尺寸按容器 letterbox，保持宽高比避免拉伸
  const canvasEl = renderer.domElement
  canvasEl.style.width = `${displayWidth}px`
  canvasEl.style.height = `${displayHeight}px`

  if (hasChangeCamera) {
    camera.updateProjectionMatrix()
  }
}
function mouseLeave() {
  console.log('mouseLeave')
  const allBoundingBox = window.globalEditGroup.boundingBoxList()
  allBoundingBox.forEach((item) => {
    item.visible = false
  })
  const allMoveZBox = window.globalEditGroup.moveZBoxList()
  allMoveZBox.forEach((item) => {
    // @ts-ignore
    const entity = item.children[0].entity as BaseEntityClass<any>
    if (entity instanceof PointEntityClass) {
      entity.moveZBox.visible = false
    }
  })
}

onMounted(() => {
  nextTick(() => {
    if (renderer) {
      updateContainerHeight(renderer)
    }
    initThree()
    if (props.cameraState) {
      cameraStateZ.value = { ...props.cameraState }
      updateCameraAngel()
    }
    resize();
    animate()
  })
  window.addEventListener('resize', resize)
})

const exportImage = (targetWidth: number) => {
  if (renderer && renderer.domElement) {
    // 确保渲染器完成当前帧渲染
    const scene = window.worldApi.scene
    if (scene && camera) {
      renderer.render(scene, camera)
    }

    // 创建一个临时的 canvas 来正确导出
    const link = document.createElement('a')
    link.download = `3d-preview-${Date.now()}.png`

    // 使用 preserveDrawingBuffer 确保能正确获取渲染内容
    const canvas = renderer.domElement

    let dataURL: string
    if (targetWidth < canvas.width) {
      // 按目标宽度等比缩小后导出
      const scale = targetWidth / canvas.width
      const targetHeight = Math.round(canvas.height * scale)
      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = targetWidth
      tmpCanvas.height = targetHeight
      const ctx = tmpCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
        dataURL = tmpCanvas.toDataURL('image/png')
      } else {
        dataURL = canvas.toDataURL('image/png')
      }
    } else {
      dataURL = canvas.toDataURL('image/png')
    }

    link.href = dataURL
    link.click()
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', resize)

  if (renderer) {
    renderer.dispose()
  }
})

watch(() => props.cameraState, (newVal) => {
  if (newVal) {
    cameraStateZ.value = { ...newVal }
    updateCameraAngel()
    resize();
  }
}, {
  deep: true
})

watch(() => props.camera, (newVal) => {
  if (newVal) {
    camera = newVal
  }
})

watch(() => props.aspectRatio, (newVal) => {
  if (newVal) {
    updateCameraAngel()
    resize();
  }
}, {
  immediate: true
})

const getImageData = (): string | null => {
  if (renderer && renderer.domElement) {
    const scene = window.worldApi.scene
    if (scene && camera) {
      renderer.render(scene, camera)
    }
    return renderer.domElement.toDataURL('image/png')
  }
  return null
}

defineExpose({
  resize,
  exportImage,
  getImageData,
  getCanvas: () => renderer?.domElement ?? null
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
  // overflow: hidden;
  width: 100%;
  height: 100%;

  /* background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
  :deep(>canvas) {
    width: 100%;
    height: 100%;
    // border: 1px solid #a1a1a1;
    box-sizing: border-box;
    // border-radius: 8px;
    // box-shadow: 0 0 14px #8d8d8d;
  }
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
