import { ImportFileType, ImportImgType, ObjOutputFileType } from "@/entities/allObjs"

class WorldState {
  allImportImgs: ImportImgType[] = []
  allImportFiles: ImportFileType[] = []
  ObjFileTypes: ObjOutputFileType[] = []
}
export default WorldState