import { BaseEntityClass } from "@/types/baseEntity";
import { HandelInfo, Point } from "@/types/map2d";

class Canvas2DScene {
  canvasList: [
    HTMLCanvasElement,
    HTMLCanvasElement
  ];

  width: number;

  height: number;

  level: number;

  panOffset: {
    x: number,
    y: number,
  }

  isPaningAngel: boolean = false;// 平移角度
  isPaningAngelMoved: boolean = false;// 平移角度时候，是否移动了
  panStartAngel: number = 0;
  isPanningScreen: boolean = false;// 平移屏幕
  panningScreenCenter: {
    x: number,
    y: number,
  } = { x: 0, y: 0 }

  panStartOffsetOfWorld: {
    x: number,
    y: number,
  } = { x: 0, y: 0 }

  mouseStartScreenX: number = 0

  mouseStartScreenY: number = 0;

  matchHandelObj: BaseEntityClass<any> | null = null;
  matchedHandelInfo: HandelInfo | null = null
  matchHandelStartPoint: Point | null = null;

  xAxisSnappedY: number | null = null;
  yAxisSnappedX: number | null = null;

  beCopyEntity: BaseEntityClass<any> | null = null;// 被复制移动中的对象
  beCopyEntityHandelInfo: HandelInfo & Point | null = null;// 被复制移动中的对象的柄信息(非引用，是拷贝)
  // 所有用连续点作为创建的元素的那个点阵
  tempPointInsertData: Array<{
    x: number,
    y: number
  }> = [];

  hoverPoint: Point | null = null;

  constructor(
    canvasList: [
      HTMLCanvasElement,
      HTMLCanvasElement
    ],
    width: number,
    height: number,
    level: number,
    panOffset: {
      x: number,
      y: number,
    }
  ) {
    this.canvasList = canvasList
    this.width = width
    this.height = height
    this.level = level
    this.panOffset = panOffset

    canvasList[1].addEventListener('mouseleave', (e) => {
      e.preventDefault()
      const canvasAction = canvasList[1];
      const ctxAction = canvasAction.getContext('2d')!
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
    })

    canvasList[1].addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  }

  setLevel(level: number) {
    this.level = level
    this.draw2DPreview()
  }

  setPanOffset(panOffset: {
    x: number,
    y: number,
  }) {
    this.panOffset = panOffset
    this.draw2DPreview()
    this.canvasList[1].getContext('2d')!.clearRect(0, 0, this.width, this.height)
  }

  draw2DPreview() {
    const canvas = this.canvasList[0]
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const screenX = this.panOffset.x;
      const screenY = this.panOffset.y;
      ctx.save()
      ctx.translate(screenX, screenY)
      window.worldApi.draw2DPreview(
        ctx,
        this.level,
      )
      ctx.restore()
    }
  }

  onClick(callBack: (point: {
    x: number,
    y: number,
  }) => void) {
    this.canvasList[1].addEventListener('click', (e) => {
      const rect = this.canvasList[0].getBoundingClientRect()
      const mouseXInCanvas = Math.round(e.clientX - rect.left)
      const mouseYInCanvas = Math.round(e.clientY - rect.top)
      callBack({
        x: mouseXInCanvas,
        y: mouseYInCanvas,
      })
    })
  }

  onMouseDown(callBack: (point: {
    button: number,
    x: number,
    y: number,
  }) => void) {
    this.canvasList[1].addEventListener('mousedown', (e) => {
      e.preventDefault()
      const rect = this.canvasList[0].getBoundingClientRect()
      const mouseXInCanvas = Math.round(e.clientX - rect.left)
      const mouseYInCanvas = Math.round(e.clientY - rect.top)
      callBack({
        button: e.button,
        x: mouseXInCanvas,
        y: mouseYInCanvas,
      })
    })
  }

  onMouseMove(callBack: (point: {
    x: number,
    y: number,
  }) => void) {
    this.canvasList[1].addEventListener('mousemove', (e) => {
      const rect = this.canvasList[0].getBoundingClientRect()
      const mouseXInCanvas = Math.round(e.clientX - rect.left)
      const mouseYInCanvas = Math.round(e.clientY - rect.top)
      callBack({
        x: mouseXInCanvas,
        y: mouseYInCanvas,
      })
    })
  }

  onMouseLeave(callBack: (point: {
    x: number,
    y: number,
  }) => void) {
    this.canvasList[1].addEventListener('mouseleave', (e) => {
      e.preventDefault()
      callBack({
        x: 0,
        y: 0,
      })
    })
  }

  onMouseUp(callBack: (point: {
    e: MouseEvent,
    x: number,
    y: number,
  }) => void) {
    this.canvasList[1].addEventListener('mouseup', (e) => {
      const rect = this.canvasList[0].getBoundingClientRect()
      const mouseXInCanvas = Math.round(e.clientX - rect.left)
      const mouseYInCanvas = Math.round(e.clientY - rect.top)
      callBack({
        e,
        x: mouseXInCanvas,
        y: mouseYInCanvas,
      })
    })
  }

  onWheel(callBack: (point: {
    deltaY: number,
    x: number,
    y: number,
  }) => void) {
    this.canvasList[1].addEventListener('wheel', (e) => {
      const rect = this.canvasList[0].getBoundingClientRect()
      const mouseXInCanvas = Math.round(e.clientX - rect.left)
      const mouseYInCanvas = Math.round(e.clientY - rect.top)
      e.preventDefault();
      callBack({
        deltaY: e.deltaY,
        x: mouseXInCanvas,
        y: mouseYInCanvas,
      })
    })
  }

  allOnInsertAddingCallBack: Array<(value: boolean) => void> = []
  insertAdding: boolean = false
  onInsertAdding(callBack: (value: boolean) => void) {
    this.allOnInsertAddingCallBack.push(callBack)
  }

  triggerInsertAdding(value: boolean) {
    this.allOnInsertAddingCallBack.forEach(callBack => {
      callBack(value)
    })
  }
}
export default Canvas2DScene