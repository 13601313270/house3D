import { CanvasShape } from "@/components/GroundTextureEditor/renderer";

type DataItem = {
  name: string,
  data: {
    shape: CanvasShape,
    poleRadius: 5,
    bgColor: '#ffffff',
    poleColor: '#666666',
    img: {
      value: any,
      viewImg: string,
      backgroundColor: string,
    },
  },
};

export default function (): DataItem[] {
  const values: DataItem[] = [
    {
      name: '方形',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        img: {
          "value": [
            {
              "type": "arrow",
              "data": {
                "id": "1782232025898",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -10,
                    "y": 20
                  },
                  {
                    "x": -10,
                    "y": -21
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782232057319",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 10,
                    "y": -20
                  },
                  {
                    "x": 10,
                    "y": 20
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
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
          backgroundColor: '#ffffff',
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
          backgroundColor: '#ffffff',
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
          backgroundColor: '#ffffff',
          viewImg: '',
        },
      }
    }
  ]
  return values
}
