class Canvas2DScene {
  list: Array<{
    canvasList: HTMLCanvasElement[],
    level: number,
    panOffset: {
      x: number,
      y: number,
    }
  }> = [];
}
export default Canvas2DScene
