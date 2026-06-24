import { DefaultItem } from "../pluginType"
import { SignData } from "./index.d"

export default function (): Promise<DefaultItem<SignData>[]> {
  const values: DefaultItem<SignData>[] = [
    {
      name: '方形',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        width: 80,
        height: 80,
        signZ: 100,
        shape: 'rect',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        img: {
          value: [],
          viewImg: '',
        },
      }
    },
    {
      name: '圆形',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        width: 80,
        height: 80,
        signZ: 100,
        shape: 'circle',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        img: {
          value: [],
          viewImg: '',
        },
      }
    },
    {
      name: '菱形',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        width: 80,
        height: 80,
        signZ: 100,
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        img: {
          value: [],
          viewImg: '',
        },
      }
    },
    {
      name: '三角形',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        width: 80,
        height: 80,
        signZ: 100,
        shape: 'triangle',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        img: {
          value: [],
          viewImg: '',
        },
      }
    }
  ]
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(values)
    }, 3000)
  })
}
