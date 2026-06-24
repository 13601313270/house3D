import { DefaultItem } from "../pluginType"
import { SignData } from "./index.d"

export default async function (): Promise<DefaultItem<SignData>[]> {
  const { default: loadData } = await import('./asyncImportDefaultValue')
  const values = loadData()
  return values.map(v => {
    const item: DefaultItem<SignData> = {
      name: v.name,
      img: v.data.img.viewImg,
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        signZ: 100,
        width: v.data.width,
        height: v.data.height,
        shape: v.data.shape,
        poleRadius: v.data.poleRadius,
        bgColor: v.data.bgColor,
        poleColor: v.data.poleColor,
        img: v.data.img,
      }
    };
    return item
  })
}
