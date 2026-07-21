class Canvas2DScene {
  list: Array<{
    canvasList: [
      HTMLCanvasElement,
      HTMLCanvasElement
    ],
    level: number,
    panOffset: {
      x: number,
      y: number,
    }
  }> = [];
}
const api = new Canvas2DScene()
export default api;