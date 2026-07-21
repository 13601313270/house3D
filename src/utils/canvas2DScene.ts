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

  draw2DPreview() {
    this.list.forEach(item => {
      const canvas = item.canvasList[0]
      if (canvas && canvas.getContext('2d')) {
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const worldData = window.worldApi.getData()
        const screenX = worldData.x * item.level + item.panOffset.x;
        const screenY = worldData.y * item.level + item.panOffset.y;
        ctx.save()
        ctx.translate(screenX, screenY)
        window.worldApi.draw2DPreview(
          ctx,
          item.level,
        )
        ctx.restore()
      }
    })

    // window.worldApi.draw2DPreview(
    //   ctx,
    //   canvas2DScene.list[0].level,
    // )
  }
}
const api = new Canvas2DScene()
export default api;