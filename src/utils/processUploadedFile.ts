import * as THREE from 'three'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// import { ImportFileData } from '@/entities/importFile/index.d'
import JSZip from "jszip"

const processUploadedFile = async (file: File, callback: (object: THREE.Group, file: File, type: string) => void): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file);
      const allFileName = Object.keys(zip.files);
      for (const fileName of allFileName) {
        const modelFileType = 'obj';
        if (fileName.endsWith('.' + modelFileType)) {
          const obj = zip.files[fileName];
          console.log('objfile', obj)
          const blob = await obj.async('blob');
          const fileObj = new File([blob], 'a.' + modelFileType, { type: blob.type || 'application/octet-stream' });
          const objectUrl = URL.createObjectURL(fileObj)
          const loader = new OBJLoader()
          loader.load(
            objectUrl,
            (object: THREE.Group) => {
              callback(object, file, 'obj')
              URL.revokeObjectURL(objectUrl)
              resolve()
            },
            (xhr: any) => {
              console.log(`OBJ 加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`)
            },
            (error: any) => {
              console.error('OBJ 文件加载失败:', error)
              URL.revokeObjectURL(objectUrl)
              reject(error)
            }
          )
          break;
        }
      }
    }
    else if (fileName.endsWith('.obj')) {
      const objectUrl = URL.createObjectURL(file)
      const loader = new OBJLoader()
      loader.load(
        objectUrl,
        (object: THREE.Group) => {
          callback(object, file, 'obj')
          URL.revokeObjectURL(objectUrl)
          resolve()
        },
        (xhr: any) => {
          console.log(`OBJ 加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`)
        },
        (error: any) => {
          console.error('OBJ 文件加载失败:', error)
          URL.revokeObjectURL(objectUrl)
          reject(error)
        }
      )
    } else if (fileName.endsWith('.fbx')) {
      console.log('开始读取 FBX 文件:', file.name, '大小:', file.size, 'bytes')
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          console.log('FBX 文件读取成功，开始解析')
          const arrayBuffer = event.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            reject(new Error('文件读取失败'))
            return
          }

          console.log('ArrayBuffer 大小:', arrayBuffer.byteLength)
          const loader = new FBXLoader()
          const object = loader.parse(arrayBuffer, '')
          console.log('FBX 文件解析成功，对象:', object)
          callback(object, file, 'fbx')
          resolve()
        } catch (error) {
          console.error('FBX 文件解析失败:', error)
          reject(error)
        }
      }
      reader.onerror = (error) => {
        console.error('FBX 文件读取失败:', error)
        console.error('文件信息:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        })
        reject(new Error('文件读取失败'))
      }
      reader.readAsArrayBuffer(file)
    } else if (fileName.endsWith('.glb')) {
      console.log('开始读取 GLB 文件:', file.name, '大小:', file.size, 'bytes')
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          console.log('GLB 文件读取成功，开始解析')
          const arrayBuffer = event.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            reject(new Error('文件读取失败'))
            return
          }

          console.log('ArrayBuffer 大小:', arrayBuffer.byteLength)
          const loader = new GLTFLoader()
          loader.parse(arrayBuffer, '', (gltf: any) => {
            console.log('GLB 文件解析成功，对象:', gltf.scene)
            callback(gltf.scene, file, 'glb')
            resolve()
          }, (error: any) => {
            console.error('GLB 文件解析失败:', error)
            reject(error)
          })
        } catch (error) {
          console.error('GLB 文件解析失败:', error)
          reject(error)
        }
      }
      reader.onerror = (error) => {
        console.error('GLB 文件读取失败:', error)
        console.error('文件信息:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        })
        reject(new Error('文件读取失败'))
      }
      reader.readAsArrayBuffer(file)
    } else {
      reject(new Error('不支持的文件格式'))
    }
  })
}
export default processUploadedFile
