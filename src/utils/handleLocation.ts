import { GroupBaseData } from "@/types/groupBase"
import { GroupBaseEntity } from "@/types/groupBase/entity"
import { PointEntityClass } from "@/types/pointEntity"
import canvas2DSceneManage from "./canvas2DSceneManage"
import { LineEntityClass } from "@/types/lineEntity"

export type Item = {
  id: string,
  name: string,
  type: string,
  isHidden: boolean,
  isLocked: boolean,
  icon: string,
  tip?: string,
  children?: Array<Item>,
}

export function handleEnter(
  group: GroupBaseEntity<GroupBaseData> | undefined,
  item: {
    id: string,
    name: string,
    type: string,
    isLocked: boolean,
  }
) {
  if (!group) return
  const thisObj = group.children.find(v => v.getData().id === item.id)
  if (thisObj) {
    const zoom2DLevel = canvas2DSceneManage.list[0].level;
    const worldData = group.getData();
    const canvasAction = canvas2DSceneManage.list[0].canvasList[1];
    const ctxAction = canvasAction.getContext('2d')!
    const screenX = worldData.x * zoom2DLevel + canvas2DSceneManage.list[0].panOffset.x;
    const screenY = worldData.y * zoom2DLevel + canvas2DSceneManage.list[0].panOffset.y;
    ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
    ctxAction.save()
    ctxAction.translate(screenX, screenY)
    ctxAction.rotate(worldData.angleY * -1)
    thisObj.draw2DActionHandle(ctxAction, zoom2DLevel)
    ctxAction.restore()
  }
}

export function handleLocationPosition(position: { x: number, y: number }) {
  console.log('position', position)
  const canvas = canvas2DSceneManage.list[0].canvasList[0]
  if (!canvas) return
  const canvasRect = canvas.getBoundingClientRect()
  const dx = canvasRect.width / 2
  const dy = canvasRect.height / 2
  canvas2DSceneManage.list[0].setPanOffset({
    x: dx - (position.x * canvas2DSceneManage.list[0].level),
    y: dy - (position.y * canvas2DSceneManage.list[0].level),
  })
}

export function handleLocation(group: GroupBaseEntity<GroupBaseData> | undefined, item: Item) {
  if (!group) return
  const api = group.children.find(v => v.getData().id === item.id)
  if (!api) return
  if (api instanceof PointEntityClass) {
    const { x, y } = api.getData()
    handleLocationPosition({
      x: x + group.getData().x,
      y: y + group.getData().y,
    })
    setTimeout(() => {
      handleEnter(group, item)
    }, 0)
  } else if (api instanceof LineEntityClass) {
    const points: Array<{ x: number, y: number }> = api.getData().points
    const centerX = points.reduce((acc, cur) => acc + cur.x, 0) / points.length
    const centerY = points.reduce((acc, cur) => acc + cur.y, 0) / points.length
    handleLocationPosition({ x: centerX, y: centerY })
    setTimeout(() => {
      handleEnter(group, item)
    }, 0)
  }
}