import * as THREE from 'three'
import processUploadedFile from './processUploadedFile'
import { sleep } from './sleep'

async function importOutObj(file: File, callback: (object: THREE.Group | THREE.Mesh, file: File, type: string, scaleFactor: number, position: THREE.Vector3) => Promise<void>) {
  const fileName = file.name.toLowerCase()

  // 检查文件类型
  if (!fileName.endsWith('.fbx') && !fileName.endsWith('.obj') && !fileName.endsWith('.glb')) {
    alert('请上传 FBX、OBJ 或 GLB 格式的文件')
    return
  }

  // 检查文件大小
  if (file.size === 0) {
    alert(`文件 "${file.name}" 大小为 0 字节，请检查文件是否损坏或为空`)
    return
  }

  // 检查文件大小限制
  const maxSize = 300
  if (file.size > maxSize * 1024 * 1024) {
    alert(`文件 "${file.name}" 太大（${(file.size / 1024 / 1024).toFixed(2)} MB），请上传小于 ${maxSize}MB 的文件`)
    return
  }

  try {
    await processUploadedFile(file, async (object, file, type) => {
      console.log('导入---object', object.children)
      const scaleFactor = (() => {
        // 计算模型的包围盒以确定尺寸
        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3())
        // 计算缩放因子，使模型最大边为 100
        const maxDimension = Math.max(size.x, size.y, size.z)
        const targetMaxSize = 100 // 最大边目标尺寸
        return maxDimension > 0 ? targetMaxSize / maxDimension : 1
      })();
      if (object.children && object.children.length > 10000000) {
        for (let i = 0; i < object.children.length; i++) {
          const v = object.children[i]
          console.log('导入---object', v.scale)
          if (v instanceof THREE.Mesh) {
            const vertices: any = v.geometry.attributes.position.array;
            let centerX = 0;
            let centerY = 0;
            let centerZ = 0;
            vertices.forEach((v: number, i: number) => {
              if (i % 3 === 0) {
                centerX += v
              } else if (i % 3 === 1) {
                centerY += v
              } else if (i % 3 === 2) {
                centerZ += v
              }
            })
            centerX /= vertices.length / 3
            console.log('centerX', centerX)
            centerY /= vertices.length / 3
            centerZ /= vertices.length / 3
            vertices.forEach((v: number, i: number) => {
              if (i % 3 === 0) {
                vertices[i] -= centerX
              } else if (i % 3 === 1) {
                // vertices[i] -= centerY
              }
            })
            // v.geometry.attributes.position.array = vertices;
            v.geometry.vertices = vertices;
            const zoomTemp = 100;
            const newPosition = new THREE.Vector3(
              centerX * zoomTemp,
              centerY * zoomTemp,
              v.position.z
            )
            console.log(centerZ)
            await callback(v, file, type, scaleFactor * v.scale.x, newPosition)
            await sleep(100)
          }
        }
      } else {
        await callback(object, file, type, scaleFactor, new THREE.Vector3())
      }
    })
  } catch (error) {
    console.error('文件处理失败:', error)
    alert('文件处理失败，请重试')
  }
}
export default importOutObj