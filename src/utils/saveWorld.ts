import { fileData } from "@/entities"
import { Point } from "@/types"
import { CameraState } from "@/types/camera"
import { EnvironmentConfig } from "./world/entity"
import JSZip from "jszip"

async function saveWorld(
  panOffset: Point,
  zoom2DLevel: number,
  cameraStateCenter: CameraState,
  activeCameraIndex: number
) {
  const data: fileData & {
    panOffset: Point
    zoomLevel: number
    cameraState: CameraState
    activeCameraIndex: number
    allImportImgs: string[]
    environmentConfig: EnvironmentConfig
  } = {
    ...window.worldApi.getAllFileObjects() as any,
    panOffset,
    zoomLevel: zoom2DLevel,
    cameraState: cameraStateCenter,
    activeCameraIndex,
    allImportImgs: window.worldState.allImportImgs.map(v => v.fileTypeId),
    environmentConfig: window.worldApi.environmentConfig,
  }

  const zip = new JSZip();

  const json = JSON.stringify(data, null, 2)

  // 保存 JSON 配置
  zip.file(
    'scene.json',
    json
  );

  const allImportFiles = window.worldState.allImportFiles
  console.log('allImportFiles', allImportFiles)

  // 保存资源文件
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const file of allImportFiles) {
      assetsFolder.file(file.fileTypeId, file.file);
    }
  }

  const allImportImg = window.worldState.allImportImgs
  console.log('allImportImg', allImportImg)
  const imgsFolder = zip.folder('imgs');
  if (imgsFolder) {
    for (const img of allImportImg) {
      imgsFolder.file(img.fileTypeId, img.file);
    }
  }

  // 生成 ZIP
  const blob = await zip.generateAsync({
    type: 'blob'
  });

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'floor-plan.devt'
  a.click()
}
export default saveWorld