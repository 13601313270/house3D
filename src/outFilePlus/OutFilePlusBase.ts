import * as THREE from 'three'
import { editItem } from "@/entities";

export abstract class OutFilePlusBase {
  static outFileDataExtension(fileTypeId: string, data: Record<string, any>): editItem[] | Promise<editItem[]> {
    return []
  }

  static modify3DMesh(fileTypeId: string, data: Record<string, any>, mesh: THREE.Group): void {
  }
}