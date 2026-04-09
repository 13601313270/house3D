<template>
  <div>
    <div style="display: flex;padding: 4px;align-items: center;">
      <el-button size="small" type="primary" @click="editType = 'people'">站立人物</el-button>
      <el-button size="small" type="primary" @click="editType = 'peopleSit'">坐人物</el-button>
      {{ editType }}
      <div style="display: flex;">
        <span style="color: white;">摄像机高度</span>
        {{ camera2YInput }}
        <el-input-number :step="0.1" placeholder="请输入摄像机高度" v-model="camera2YInput" @change="changeCamera2" />
      </div>
    </div>
    <div style="display: flex;">
      <canvas id="canvas3D" style="width: 600px;height: 600px;" width="1024" height="1024"></canvas>
      <div style="position: relative;">
        <canvas id="canvas3D2" style="height: 600px;" width="720" height="1080"></canvas>
        <el-button style="position: absolute;top: 2px;right: 2px;" @click="exportCanvas3D2Pic">截图</el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import axios from 'axios'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// @ts-ignore
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import addPeopleToScene from './addPeopleToScene';

const emits = defineEmits(['update']);
let renderer2: THREE.WebGLRenderer;
const editType = ref<'camera' | 'people' | 'peopleSit'>('camera');
const camera2YInput = ref<number>(1.5);
onMounted(() => {
  // 创建一个场景（Scene） - 这是你缺少的部分！
  const scene = new THREE.Scene();

  // 可选：添加一些环境光，让模型看得更清楚
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // 主光源 - 方向光，产生主要阴影和立体感
  // const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  // directionalLight.position.set(5, 10, 0);
  // directionalLight.castShadow = true;
  // directionalLight.receiveShadow = true;
  // directionalLight.shadow.mapSize.width = 1024;
  // directionalLight.shadow.mapSize.height = 1024;
  // scene.add(directionalLight);

  // // 辅助光源 - 从背面补充照明
  // const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  // backLight.position.set(-3, 2, -4);
  // scene.add(backLight);

  // // 填充光 - 从侧面补充
  // const fillLight = new THREE.PointLight(0xffaa66, 0.3);
  // fillLight.position.set(2, 1, 3);
  // scene.add(fillLight);

  const objLoader = new OBJLoader();
  const glbloader = new GLTFLoader();
  const mtlLoader = new MTLLoader();
  function initScene(model: any) {
    model.position.set(0, -1, 0);
    model.scale.set(0.15, 0.15, 0.15);

    // model会接收光照产生阴影
    model.receiveShadow = true;
    model.castShadow = true;

    model.traverse((child: any) => {
      if (child.isLight) {
        child.castShadow = true;

        if (child.name.includes('日光')) {
          child.shadow.mapSize.width = 4096;
          child.shadow.mapSize.height = 4096;
          child.shadow.camera.left = -11;
          child.shadow.camera.right = 12;
          child.shadow.camera.top = 11;
          child.shadow.camera.bottom = -10;
          // 显示光源位置
          const lightHelper = new THREE.DirectionalLightHelper(child, 1);
          scene.add(lightHelper);
        } else {
          child.shadow.mapSize.width = 2048;
          child.shadow.mapSize.height = 2048;
          child.shadow.bias = -0.0005;
        }
      } else if (child instanceof THREE.Mesh) {
        child.castShadow = true;    // 投射阴影
        child.receiveShadow = true; // 接收阴影
      }
      if (child.name === 'door001') {
        // @ts-ignore
        window.door = child;
        console.log('child-----', child);
      }
    });
    scene.add(model);
    console.log('加载成功');
  }

  glbloader.load(
    './woodenHouse/未命名.gltf', // 你的材质文件路径，通常和 .obj 放在同一目录
    (materials: any) => {
      initScene(materials.scene)
      // // 关键步骤：预加载所有材质，让纹理图片准备好
      // materials.preload();
      // objLoader.setMaterials(materials);
      // objLoader.load(
      //   './woodenHouse/1.obj',
      //   // './office2/office.gltf', // 路径
      //   // './house1/未命名.gltf', // 路径
      //   (gltf: any) => {
      //     const model = gltf;//.scene;
      //     initScene(model)
      //   },
      //   (xhr: any) => {
      //     console.log((xhr.loaded / xhr.total * 100) + '% 已加载');
      //   },
      //   (error: any) => {
      //     console.error('加载失败', error);
      //   }
      // );
    },
    (xhr: any) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error: any) => {
      console.error('An error happened while loading the MTL file', error);
    }
  );

  const canvas3D = document.getElementById('canvas3D') as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas3D,  // 直接传入 canvas 元素
    antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影（可选：PCFSoftShadowMap, PCFShadowMap）
  // renderer.toneMapping = THREE.ReinhardToneMapping;
  // renderer.sortObjects = true;  // 关键：启用物体排序，让透明物体正确渲染
  const camera = new THREE.PerspectiveCamera(
    45,
    canvas3D.clientWidth / canvas3D.clientHeight,
    0.1,
    1000
  );
  let camera1Radius = 20; // 摄像机距离
  camera.position.set(0, camera1Radius, 0);
  camera.lookAt(0, 0, 0);
  const canvas3D2 = document.getElementById('canvas3D2') as HTMLCanvasElement;
  renderer2 = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true, // 这个必须有！
    canvas: canvas3D2  // 直接传入 canvas 元素
  });
  renderer2.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影（可选：PCFSoftShadowMap, PCFShadowMap）
  const camera2 = new THREE.PerspectiveCamera(
    90,
    canvas3D2.clientWidth / canvas3D2.clientHeight,
    0.1,
    1000
  );
  // @ts-ignore
  window.camera2 = camera2;
  const camera2Positon = { x: 0, y: camera2YInput.value, z: 0 };
  camera2.position.set(camera2Positon.x, camera2Positon.y, camera2Positon.z);
  camera2.lookAt(camera2Positon.x, camera2Positon.y, camera2Positon.z);
  const camera2Mesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.5, 4),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  camera2Mesh.rotation.set(
    Math.PI / 2,
    Math.PI / 4,
    0
  );
  const camera2Cube = new THREE.Group();
  camera2Cube.add(camera2Mesh);
  // @ts-ignore
  window.camera2Cube = camera2Cube;
  camera2Cube.position.set(camera2Positon.x, camera2Positon.y, camera2Positon.z);
  scene.add(camera2Cube);

  (() => {
    let canvas2IsMouseAngel = false;
    let canvas2IsMouseMove = false;
    let canvas2LastMouseX = 0;
    let canvas2LastMouseY = 0;

    let camera2AngleY = 0; // 摄像机垂直移动
    let camera2AngleX = 0; // 摄像机横移
    let camera2AngelStartX = 0;
    let camera2AngelStartY = 0;
    let camera2PositionStartX = 0;
    let camera2PositionStartZ = 0;

    let canvas1IsMouseAngel = false;
    let canvas1IsMouseMove = false;
    let canvas1LastMouseX = 0;
    let canvas1LastMouseY = 0;
    let camera1AngleY = Math.PI / 2 - 0.1;
    let camera1AngleX = 0;
    let camera1AngelStartX = 0;
    let camera1AngelStartY = 0;
    let camera1TargetPositionStartX = 0;
    let camera1TargetPositionStartY = 0;
    let camera1TargetPositionStartZ = 0;
    let camera1TargetPositionX = 0;
    const camera1TargetPositionY = 0;
    let camera1TargetPositionZ = 0;

    function updateCameraAngel() {
      const camera1X = camera1Radius * Math.sin(camera1AngleX) * Math.cos(camera1AngleY) * -1;
      const camera1Y = camera1Radius * Math.sin(camera1AngleY);
      const camera1Z = camera1Radius * Math.cos(camera1AngleX) * Math.cos(camera1AngleY);

      const camera2X = camera1Radius * Math.sin(camera2AngleX) * Math.cos(camera2AngleY) * -1;
      const camera2Y = camera1Radius * Math.sin(camera2AngleY);
      const camera2Z = camera1Radius * Math.cos(camera2AngleX) * Math.cos(camera2AngleY);

      console.log('camera1X', camera1X, camera1Y, camera1Z)
      camera.position.set(
        camera1TargetPositionX + camera1X, // 镜头左右摇摆
        camera1TargetPositionY + camera1Y,
        camera1TargetPositionZ + camera1Z
      );
      camera.lookAt(
        camera1TargetPositionX,
        camera1TargetPositionY,
        camera1TargetPositionZ
      );
      camera2.lookAt(
        camera2.position.x - camera2X,
        camera2.position.y - camera2Y,
        camera2.position.z - camera2Z,
      );
      camera2Cube.position.set(
        camera2.position.x,
        camera2.position.y,
        camera2.position.z
      );
      camera2Cube.rotation.set(
        camera2.rotation.x,
        camera2.rotation.y,
        camera2.rotation.z
      );
    }

    updateCameraAngel();

    canvas3D.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        // 旋转
        camera1AngelStartX = camera1AngleX;
        camera1AngelStartY = camera1AngleY;
        canvas1IsMouseAngel = true;
        canvas1LastMouseX = e.clientX;
        canvas1LastMouseY = e.clientY;
        e.preventDefault();
      } else if (e.button === 0) {
        if (editType.value === 'camera') {
          // 移动
          camera1TargetPositionStartX = camera1TargetPositionX;
          camera1TargetPositionStartY = camera1TargetPositionY;
          camera1TargetPositionStartZ = camera1TargetPositionZ;
          canvas1IsMouseMove = true;
          canvas1LastMouseX = e.clientX;
          canvas1LastMouseY = e.clientY;
          e.preventDefault();
        } else {
          // 计算鼠标位置归一化坐标
          const mouse = new THREE.Vector2();
          // 获取canvas的边界矩形（推荐使用这个以确保精确）
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          // 创建Raycaster
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const targetPeoplePoint = new THREE.Vector3();

          // 计算射线与平面的交点
          if (raycaster.ray.intersectPlane(plane, targetPeoplePoint)) {
            console.log('与z=0平面的交点:', targetPeoplePoint.x, targetPeoplePoint.y, targetPeoplePoint.z);
            // 计算camera2的朝向角度（用于人物朝向）
            const forward = new THREE.Vector3();
            camera2.getWorldDirection(forward);
            const camera2Y = Math.atan2(forward.x * -1, forward.z * -1);
            console.log('camera2Y', camera2Y);

            if (editType.value === 'people') {
              addPeopleToScene(scene, editType.value, targetPeoplePoint.x, targetPeoplePoint.y, targetPeoplePoint.z, camera2Y);
            } else {
              addPeopleToScene(scene, editType.value as 'peopleSit', targetPeoplePoint.x, targetPeoplePoint.y, targetPeoplePoint.z, camera2Y);
            }
            // 可选：在交点位置添加一个标记
          } else {
            console.log('射线与z=0平面没有交点（射线平行于平面）');
          }
          editType.value = 'camera';
        }
      }
    })
    canvas3D.addEventListener('mousemove', (e) => {
      if (canvas1IsMouseAngel) {
        // 镜头旋转
        const delta2DDiffX = e.clientX - canvas1LastMouseX;
        const delta2DDiffY = e.clientY - canvas1LastMouseY;
        camera1AngleX = camera1AngelStartX + delta2DDiffX * 0.01;
        camera1AngleY = camera1AngelStartY + delta2DDiffY * 0.01;
        camera1AngleY = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, camera1AngleY)); // 因为camera，是采用控制position和lookat的逻辑，所以在angleY==Math.PI/2的定点的时候，无法控制方向，所以这里限制一下，只允许angleY在[-Math.PI/2+0.05, Math.PI/2-0.05]之间
        updateCameraAngel()
      } else if (canvas1IsMouseMove) {
        const deltaX = e.clientX - canvas1LastMouseX;
        const deltaY = e.clientY - canvas1LastMouseY;
        const sensitivity = 0.02;

        camera1TargetPositionX = camera1TargetPositionStartX - (deltaX * Math.cos(camera1AngleX) - deltaY * Math.sin(camera1AngleX)) * sensitivity;
        camera1TargetPositionZ = camera1TargetPositionStartZ - (deltaX * Math.sin(camera1AngleX) + deltaY * Math.cos(camera1AngleX)) * sensitivity;
        updateCameraAngel()
      }
    })
    canvas3D.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        canvas1IsMouseAngel = false;
      } else if (e.button === 0) {
        canvas1IsMouseMove = false;
      }
    });

    canvas3D.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const delta = e.deltaY * zoomSpeed;
      const newRadius = Math.max(5, Math.min(50, camera1Radius * (1 + delta)));
      camera1Radius = newRadius;
      updateCameraAngel();
    }, { passive: false });

    canvas3D2.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        camera2AngelStartX = camera2AngleX;
        camera2AngelStartY = camera2AngleY;
        canvas2IsMouseAngel = true;
        canvas2LastMouseX = e.clientX;
        canvas2LastMouseY = e.clientY;
        e.preventDefault();
      } else if (e.button === 0) {
        camera2PositionStartX = camera2.position.x;
        camera2PositionStartZ = camera2.position.z;
        canvas2IsMouseMove = true;
        canvas2LastMouseX = e.clientX;
        canvas2LastMouseY = e.clientY;
        e.preventDefault();
      }
    });

    canvas3D2.addEventListener('mousemove', (e) => {
      if (canvas2IsMouseAngel) {
        // 镜头旋转
        const delta2DDiffX = e.clientX - canvas2LastMouseX;
        const delta2DDiffY = e.clientY - canvas2LastMouseY;
        camera2AngleX = camera2AngelStartX + delta2DDiffX * 0.01;
        camera2AngleY = camera2AngelStartY + delta2DDiffY * 0.01;
        camera2AngleY = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, camera2AngleY)); // 因为camera，是采用控制position和lookat的逻辑，所以在angleY==Math.PI/2的定点的时候，无法控制方向，所以这里限制一下，只允许angleY在[-Math.PI/2+0.05, Math.PI/2-0.05]之间
        updateCameraAngel()
      } else if (canvas2IsMouseMove) {
        // 镜头移动
        const deltaX = e.clientX - canvas2LastMouseX;
        const deltaY = e.clientY - canvas2LastMouseY;
        const sensitivity = 0.01;
        camera2.position.x = camera2PositionStartX - (deltaX * Math.cos(camera2AngleX) - deltaY * Math.sin(camera2AngleX)) * sensitivity;
        camera2.position.z = camera2PositionStartZ - (deltaX * Math.sin(camera2AngleX) + deltaY * Math.cos(camera2AngleX)) * sensitivity;
        updateCameraAngel()
      }
    });

    canvas3D2.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        canvas2IsMouseAngel = false;
      } else if (e.button === 0) {
        canvas2IsMouseMove = false;
      }
    });

    canvas3D2.addEventListener('mouseleave', () => {
      canvas2IsMouseAngel = false;
      canvas2IsMouseMove = false;
    });

    canvas3D.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    canvas3D2.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  })();

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    renderer2.render(scene, camera2);
  }
  animate();
})
async function exportCanvas3D2Pic() {
  const canvas3D2 = document.getElementById('canvas3D2') as HTMLCanvasElement;
  const imgData = canvas3D2.toDataURL('image/jpeg');

  const base64ToBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n: number = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const formData = new FormData()
  formData.append('file', base64ToBlob(imgData))
  const res: any = await axios.post('/oss', formData)
  console.log(res);
  if (res.url) {
    emits('update', res.url);
  }
}
function changeCamera2() {
  // @ts-ignore
  window.camera2.position.y = camera2YInput.value
  // @ts-ignore
  window.camera2Cube.position.y = camera2YInput.value
}
</script>
