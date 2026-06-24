import { OutFileData } from "./index.d"

export default function () {
  // @ts-ignore
  const findObjInfo = window.ObjFiles[0];
  const data: OutFileData = {
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    angleY: 0,
    bm: null,
    x: 0,
    y: 0,
    z: findObjInfo.defaultZ || 0,
    color: '#0c7f25',
    canAngelZ: findObjInfo.canAngelZ,
  }
  const values: OutFileData[] = [
    data
  ]
  return values
}