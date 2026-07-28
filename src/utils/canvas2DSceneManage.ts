import Canvas2DScene from "./canvas2DScene";

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