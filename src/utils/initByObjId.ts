import { CameraState } from "@/components/Canvas3D.vue"
import { Point } from "@/types"

export default function (objId: number) {
  const initDefaultFile: any & {
    panOffset: Point
    zoomLevel: number
    cameraState: CameraState
    activeCameraIndex: number
  } = {
    "wall": [],
    "door": [],
    "window": [],
    "camera": [],
    "cube": [],
    "sphere": [],
    "cylinder": [],
    "cone": [],
    "plane": [],
    "curtain": [],
    "outFile": [
      {
        "id": "1780987800414",
        "x": 0,
        "y": 0,
        "z": 0,
        "tip": "",
        "tipFontSize": 96,
        "fileTypeId": objId,
        "angleY": 0,
        "bm": null,
        "color": "",
        "canAngelZ": 1
      }
    ],
    "outFileInWall": [],
    "people": [],
    "importFile": [],
    "curtainInWall": [],
    "panOffset": {
      "x": 127.0703125,
      "y": 373.5
    },
    "zoomLevel": 1,
    "cameraState": {
      "targetPositionX": 0,
      "targetPositionY": 0,
      "targetPositionZ": 0,
      "radius": 800,
      "angleX": 0,
      "angleY": 0.7853981633974483,
      "aspectW": 1,
      "aspectH": 1
    },
    "activeCameraIndex": 0,
    "allImportImgs": []
  }
  return initDefaultFile
}