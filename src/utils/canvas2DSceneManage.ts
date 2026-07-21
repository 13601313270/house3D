class Canvas2DScene {
  canvasList: [
    HTMLCanvasElement,
    HTMLCanvasElement
  ];

  level: number;

  panOffset: {
    x: number,
    y: number,
  }

  constructor(canvasList: [
    HTMLCanvasElement,
    HTMLCanvasElement
  ], level: number, panOffset: {
    x: number,
    y: number,
  }) {
    this.canvasList = canvasList
    this.level = level
    this.panOffset = panOffset
  }

  draw2DPreview() {
    const canvas = this.canvasList[0]
    if (canvas && canvas.getContext('2d')) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const worldData = window.worldApi.getData()
      const screenX = worldData.x * this.level + this.panOffset.x;
      const screenY = worldData.y * this.level + this.panOffset.y;
      ctx.save()
      ctx.translate(screenX, screenY)
      window.worldApi.draw2DPreview(
        ctx,
        this.level,
      )
      ctx.restore()
    }
  }
}

class Canvas2DSceneManage {
  list_: Array<Canvas2DScene> = [];

  get list() {
    return this.list_
  }

  addScene(canvasList: [
    HTMLCanvasElement,
    HTMLCanvasElement
  ], level: number, panOffset: {
    x: number,
    y: number,
  }) {
    this.list_.push(new Canvas2DScene(canvasList, level, panOffset))
  }

  draw2DPreview() {
    this.list.forEach(canvas2DSceneItem => {
      canvas2DSceneItem.draw2DPreview()
    })
  }
}
const api = new Canvas2DSceneManage()
export default api;