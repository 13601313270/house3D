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

    this.onMouseDown((point) => {
      const canvas = this.canvasList[0]
      const mouseXInCanvas = point.x
      const mouseYInCanvas = point.y
      if (point.button === 2) {
        this.isPaningAngel = true
        this.isPaningAngelMoved = false;
        this.panStartAngel = window.worldApi.getData().angleY
        console.log('panStartAngel', canvas.height / 2, mouseYInCanvas)
        let xTemp = 0;
        let yTemp = 0;
        const yDiff = canvas.height / 2 - mouseYInCanvas;
        const xDiff = canvas.width / 2 - mouseXInCanvas;
        if (Math.abs(yDiff) < 100 && Math.abs(xDiff) < 100) {
          if (Math.abs(yDiff) > Math.abs(xDiff)) {
            if (mouseYInCanvas < canvas.height / 2 && yDiff < 100) {
              yTemp = 100 - yDiff;
            } else if (mouseYInCanvas > canvas.height / 2 && -yDiff < 100) {
              yTemp = -100 - yDiff;
            }
          } else {
            if (mouseXInCanvas < canvas.width / 2 && xDiff < 100) {
              xTemp = 100 - xDiff;
            } else if (mouseXInCanvas > canvas.width / 2 && -xDiff < 100) {
              xTemp = -100 - xDiff;
            }
          }
        }

        this.panningScreenCenter = {
          x: canvas.width / 2 + xTemp,
          y: canvas.height / 2 + yTemp,
        }
        this.mouseStartScreenX = mouseXInCanvas
        this.mouseStartScreenY = mouseYInCanvas
        this.panStartOffsetOfWorld = {
          x: this.panOffset.x,
          y: this.panOffset.y,
        }
      }
    })

    this.onMouseMove((point) => {
      const mouseXInCanvas = point.x
      const mouseYInCanvas = point.y
      if (this.isPaningAngel) {
        this.isPanningScreen = false
        this.isPaningAngelMoved = true;
        const centerX = this.panningScreenCenter.x
        const centerY = this.panningScreenCenter.y

        const startVecX = this.mouseStartScreenX - centerX
        const startVecY = this.mouseStartScreenY - centerY
        const currentVecX = mouseXInCanvas - centerX
        const currentVecY = mouseYInCanvas - centerY

        const startAngle = Math.atan2(startVecY, startVecX)
        const currentAngle = Math.atan2(currentVecY, currentVecX)
        let rotateAngle = currentAngle - startAngle;
        (() => {
          // newAngleY每30度增加一个磁吸，接近这个度数上下5度，会吸附过去
          let targetAngel = this.panStartAngel + rotateAngle * -1;
          const snapAngle = 30 * (Math.PI / 180); // 30度转换为弧度
          const snapThresholdAngle = 5 * (Math.PI / 180); // 5度转换为弧度
          const nearestSnapAngle = Math.round(targetAngel / snapAngle) * snapAngle;
          const diff = Math.abs(targetAngel - nearestSnapAngle);
          if (diff < snapThresholdAngle) {
            targetAngel = nearestSnapAngle;
          }
          rotateAngle = this.panStartAngel - targetAngel;
        })()

        const newAngleY = this.panStartAngel + rotateAngle * -1

        const worldData = window.worldApi.getData();
        (() => {
          // 0, 370
          const { x: positionX, y: positionY } = this.panStartOffsetOfWorld;
          const dx = positionX - centerX
          const dy = positionY - centerY
          const cos = Math.cos(rotateAngle)
          const sin = Math.sin(rotateAngle)
          const newPositionX = centerX + dx * cos - dy * sin
          const newPositionY = centerY + dx * sin + dy * cos
          this.setPanOffset({
            x: newPositionX,
            y: newPositionY,
          })
        })();

        window.worldApi.setData({
          ...worldData,
          angleY: newAngleY,
        });
        const canvasAction = this.canvasList[1]!;
        const ctxAction = canvasAction.getContext('2d')!
        // 绘制操作句柄
        ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
        return;
      }
    })
    this.onMouseUp(() => {
      if (this.isPaningAngel) {
        this.isPaningAngel = false
      }
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
    api.onWheel((point: {
      deltaY: number,
      x: number,
      y: number,
    }) => {
      const canvas = api.canvasList[0]
      if (!canvas) return

      // 绘制操作句柄
      const canvasAction = api.canvasList[1]!;
      const ctxAction = canvasAction.getContext('2d')!
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)

      const screenX = point.x
      const screenY = point.y

      const zoomFactor = point.deltaY < 0 ? 1.1 : 0.9
      const newZoomLevel = Math.max(0.01, Math.min(5, api.level * zoomFactor))

      const zoomRatio = newZoomLevel / api.level
      const newPanX = screenX - (screenX - api.panOffset.x) * zoomRatio
      const newPanY = screenY - (screenY - api.panOffset.y) * zoomRatio

      api.setLevel(newZoomLevel)
      api.setPanOffset({
        x: newPanX,
        y: newPanY,
      })
    })
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