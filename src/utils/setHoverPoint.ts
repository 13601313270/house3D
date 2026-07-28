import { Point } from "@/types";
import canvas2DSceneManage from "./canvas2DSceneManage";

function setHoverPoint(point: Point | null) {
  canvas2DSceneManage.list[0].hoverPoint = point
  const canvasAction = canvas2DSceneManage.list[0].canvasList[1]!;
  if (!canvasAction) return
  // 绘制磁吸点的参考轴
  const level = canvas2DSceneManage.list[0].level
  const ctx = canvasAction.getContext('2d')!
  ctx.clearRect(0, 0, 100000, 100000)
  function drawTemp() {
    if (canvas2DSceneManage.list[0].hoverPoint) {
      window.globalEditGroup.drawAxis(
        ctx,
        level,
        canvas2DSceneManage.list[0].xAxisSnappedY,
        canvas2DSceneManage.list[0].yAxisSnappedX
      );
    } else {
      window.globalEditGroup.drawAxis(ctx, level, null, null);
    }
  }
  ctx.save()
  if (window.globalEditGroup !== window.worldApi) {
    const worldData = window.worldApi.getData();
    ctx.translate(
      worldData.x + canvas2DSceneManage.list[0].panOffset.x,
      worldData.y + canvas2DSceneManage.list[0].panOffset.y
    )
    ctx.rotate(worldData.angleY * -1)
  } else {
    ctx.translate(
      canvas2DSceneManage.list[0].panOffset.x,
      canvas2DSceneManage.list[0].panOffset.y
    )
  }
  drawTemp()
  ctx.restore()
}
export default setHoverPoint