import { CanvasShape } from "@/components/GroundTextureEditor/renderer";

type DataItem = {
  name: string,
  data: {
    shape: CanvasShape,
    poleRadius: 5,
    bgColor: '#ffffff',
    poleColor: '#666666',
    img: {
      value: [],
      viewImg: '',
    },
  },
};

export default function (): DataItem[] {
  const values: DataItem[] = [
    {
      name: '方形',
      data: {
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
  return values
}
