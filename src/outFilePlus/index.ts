import * as THREE from 'three'
import { editItem } from "@/entities";
import { OutFilePlusBase } from './OutFilePlusBase';

const allPlugins: Record<number, () => Promise<{ default: typeof OutFilePlusBase }>> = {
  68: () => import('./68/index'),
}
// 暂时没有扩展项，原本是考虑根据fileTypeId来扩展项，比如窗帘，控制是否折叠
export async function outFileDataExtension(fileTypeId: string, data: Record<string, any>): Promise<editItem[]> {
  console.log('fileTypeId', fileTypeId)
  try {
    if (allPlugins[+fileTypeId]) {
      const plugin = await allPlugins[+fileTypeId]()
      return await plugin.default.outFileDataExtension(fileTypeId, data)
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

export function modify3DMesh(fileTypeId: string, data: Record<string, any>, mesh: THREE.Group): void {
  if (allPlugins[+fileTypeId]) {
    allPlugins[+fileTypeId]().then(plugin => {
      console.log('plugin', plugin.default)
      plugin.default.modify3DMesh(fileTypeId, data, mesh)
    })
  }
}
