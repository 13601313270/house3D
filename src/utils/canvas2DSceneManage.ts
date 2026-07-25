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
}

class Canvas2DSceneManage {
  list_: Array<Canvas2DScene> = [];

  get list() {
    return this.list_
  }

  addScene(
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
  ): Canvas2DScene {
    const api = new Canvas2DScene(canvasList, width, height, level, panOffset);
    this.list_.push(api)
    return api;
  }

  renderPreview() {
    this.list.forEach(canvas2DSceneItem => {
      canvas2DSceneItem.draw2DPreview()
    })
  }

  resize() {
    this.list.forEach(canvas2DSceneItem => {
      const ctxList = canvas2DSceneItem.canvasList;
      const canvasRect = ctxList[0].getBoundingClientRect()
      const width = Math.floor(canvasRect.width)
      const height = Math.floor(canvasRect.height)
      if (width > 0 && height > 0) {
        ctxList.forEach(ctx => {
          if (ctx) {
            ctx.width = width
            ctx.height = height
          }
        })
      }
      canvas2DSceneItem.draw2DPreview()
    })
  }
}
const api = new Canvas2DSceneManage()
export default api;