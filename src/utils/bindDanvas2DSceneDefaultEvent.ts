import { PointEntityClass } from "@/types/pointEntity";
import Canvas2DScene from "./canvas2DScene";
import { LineEntityClass } from "@/types/lineEntity";
import { WallEntity } from "@/entities/wall/entity";
import getSnapPointAndLine from "./getSnapPoint";
import { Point } from "@/types";
import pointToLineDistance from "./pointToLineDistance";
import { getClosestPointOnLine } from "./geometry";
import { snapThreshold } from "./getNearestWall";
import { MatchCircleArea, MatchRectArea } from "./matchArea";

function bindDanvas2DSceneDefaultEvent(sense: Canvas2DScene) {
  sense.onMouseDown(async (point) => {
    const canvas = sense.canvasList[0]
    const mouseXInCanvas = point.x
    const mouseYInCanvas = point.y
    if (point.button === 2) {
      sense.isPaningAngel = true
      sense.isPaningAngelMoved = false;
      sense.panStartAngel = window.worldApi.getData().angleY
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

      sense.panningScreenCenter = {
        x: canvas.width / 2 + xTemp,
        y: canvas.height / 2 + yTemp,
      }
      sense.mouseStartScreenX = mouseXInCanvas
      sense.mouseStartScreenY = mouseYInCanvas
      sense.panStartOffsetOfWorld = {
        x: sense.panOffset.x,
        y: sense.panOffset.y,
      }
    } else {
      const worldData = window.worldApi.getData();
      const { angleY } = worldData;
      const dx = mouseXInCanvas - sense.panOffset.x
      const dy = mouseYInCanvas - sense.panOffset.y
      const cos = Math.cos(angleY * -1)
      const sin = Math.sin(angleY * -1)
      const xInWorld = (dx * cos + dy * sin) / sense.level
      const yInWorld = (-dx * sin + dy * cos) / sense.level

      let xInGroup = xInWorld;
      let yInGroup = yInWorld;
      // 先平移，再旋转，再缩放
      if (window.globalEditGroup !== window.worldApi) {
        const { x: groupX, y: groupY, angleY: groupAngle } = window.globalEditGroup.getData()
        const dx2 = xInWorld - groupX
        const dy2 = yInWorld - groupY
        const cosGroup = Math.cos(groupAngle * -1)
        const sinGroup = Math.sin(groupAngle * -1)
        xInGroup = dx2 * cosGroup + dy2 * sinGroup
        yInGroup = -dx2 * sinGroup + dy2 * cosGroup
      }
      const { getHandleInfoByXY } = await import('./getHandleInfoByXY') // 因为循环import，所以不能定义在头部。（canvas2DSceneManage->getHandleInfoByXY->lineEntity->baseEntity->canvas2DSceneManage）
      const handleInfoList = getHandleInfoByXY(window.globalEditGroup, xInGroup, yInGroup)
      if (handleInfoList) {
        const { classInfo, handle, startPoint } = handleInfoList
        if (!classInfo.getData().isLocked) {
          sense.matchHandelObj = classInfo
          sense.matchedHandelInfo = handle
          sense.matchHandelStartPoint = { x: xInGroup, y: yInGroup }
          const canvasAction = sense.canvasList[1]!;
          const screenX = worldData.x * sense.level + sense.panOffset.x;
          const screenY = worldData.y * sense.level + sense.panOffset.y;
          const ctxAction = canvasAction.getContext('2d')!
          ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
          ctxAction.save()
          ctxAction.translate(screenX, screenY)
          ctxAction.rotate(worldData.angleY * -1)
          sense.matchHandelObj.draw2DActionHandle(ctxAction, sense.level)
          ctxAction.restore()
          return
        }
      }
      // 如果没有拖拽到任何点，开始平移
      sense.isPanningScreen = true
      sense.mouseStartScreenX = mouseXInCanvas
      sense.mouseStartScreenY = mouseYInCanvas
      sense.panStartOffsetOfWorld = {
        x: sense.panOffset.x,
        y: sense.panOffset.y,
      }
    }
  })

  sense.onMouseMove(async (point) => {
    const mouseXInCanvas = point.x
    const mouseYInCanvas = point.y
    const self = sense;
    const worldData = window.worldApi.getData();
    const angleY = worldData.angleY;// + groupAngle;
    const dx = mouseXInCanvas - sense.panOffset.x
    const dy = mouseYInCanvas - sense.panOffset.y
    const cos = Math.cos(angleY * -1)
    const sin = Math.sin(angleY * -1)
    const xInWorld___ = (dx * cos + dy * sin) / sense.level;// - groupX
    const yInWorld___ = (-dx * sin + dy * cos) / sense.level;// - groupY
    let xInGroup = xInWorld___;
    let yInGroup = yInWorld___;
    const canvasAction = sense.canvasList[1]!;
    const ctxAction = canvasAction.getContext('2d')!
    // 先平移，再旋转，再缩放
    if (window.globalEditGroup !== window.worldApi) {
      const { x: groupX, y: groupY, angleY: groupAngle } = window.globalEditGroup.getData()
      const dx2 = xInWorld___ - groupX
      const dy2 = yInWorld___ - groupY
      const cosGroup = Math.cos(groupAngle * -1)
      const sinGroup = Math.sin(groupAngle * -1)
      xInGroup = dx2 * cosGroup + dy2 * sinGroup
      yInGroup = -dx2 * sinGroup + dy2 * cosGroup
    }
    if (window.globalEditGroup.insertTempObj) {

      
    } else if (sense.beCopyEntity) {
      if (sense.beCopyEntity instanceof PointEntityClass) {
        sense.beCopyEntity.setData({
          ...sense.beCopyEntity.getData(),
          x: xInGroup,
          y: yInGroup,
        })
      } else if (sense.beCopyEntity instanceof LineEntityClass) {
        if (sense.beCopyEntityHandelInfo) {
          sense.beCopyEntity.offset.x = xInGroup - sense.beCopyEntityHandelInfo.x
          sense.beCopyEntity.offset.y = yInGroup - sense.beCopyEntityHandelInfo.y
        }
      }
    } else if (sense.isPaningAngel) {
      sense.isPanningScreen = false
      sense.isPaningAngelMoved = true;
      const centerX = sense.panningScreenCenter.x
      const centerY = sense.panningScreenCenter.y

      const startVecX = sense.mouseStartScreenX - centerX
      const startVecY = sense.mouseStartScreenY - centerY
      const currentVecX = mouseXInCanvas - centerX
      const currentVecY = mouseYInCanvas - centerY

      const startAngle = Math.atan2(startVecY, startVecX)
      const currentAngle = Math.atan2(currentVecY, currentVecX)
      let rotateAngle = currentAngle - startAngle;
      (() => {
        // newAngleY每30度增加一个磁吸，接近这个度数上下5度，会吸附过去
        let targetAngel = sense.panStartAngel + rotateAngle * -1;
        const snapAngle = 30 * (Math.PI / 180); // 30度转换为弧度
        const snapThresholdAngle = 5 * (Math.PI / 180); // 5度转换为弧度
        const nearestSnapAngle = Math.round(targetAngel / snapAngle) * snapAngle;
        const diff = Math.abs(targetAngel - nearestSnapAngle);
        if (diff < snapThresholdAngle) {
          targetAngel = nearestSnapAngle;
        }
        rotateAngle = sense.panStartAngel - targetAngel;
      })()

      const newAngleY = sense.panStartAngel + rotateAngle * -1

      const worldData = window.worldApi.getData();
      (() => {
        // 0, 370
        const { x: positionX, y: positionY } = sense.panStartOffsetOfWorld;
        const dx = positionX - centerX
        const dy = positionY - centerY
        const cos = Math.cos(rotateAngle)
        const sin = Math.sin(rotateAngle)
        const newPositionX = centerX + dx * cos - dy * sin
        const newPositionY = centerY + dx * sin + dy * cos
        sense.setPanOffset({
          x: newPositionX,
          y: newPositionY,
        })
      })();

      window.worldApi.setData({
        ...worldData,
        angleY: newAngleY,
      });
      const canvasAction = sense.canvasList[1]!;
      const ctxAction = canvasAction.getContext('2d')!
      // 绘制操作句柄
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
      return;
    } else if (sense.isPanningScreen) {
      sense.isPaningAngel = false
      const dx = mouseXInCanvas - sense.mouseStartScreenX
      const dy = mouseYInCanvas - sense.mouseStartScreenY

      sense.setPanOffset({
        x: sense.panStartOffsetOfWorld.x + dx,
        y: sense.panStartOffsetOfWorld.y + dy,
      })
      sense.canvasList[1]!.getContext('2d')!.clearRect(0, 0, sense.width, sense.height)
    } else if (sense.matchHandelObj && sense.matchedHandelInfo) {
      sense.isPaningAngel = false
      const self = sense;
      function matchWall(wall: WallEntity): boolean {
        if (self.matchHandelObj && self.matchedHandelInfo) {
          const beMatchPoints = wall.getMineBeSnapPoints(self.matchedHandelInfo)
          if (beMatchPoints.length > 0) {
            const snapped33 = getSnapPointAndLine(
              { x: xInGroup, y: yInGroup },
              [],
              [],
              beMatchPoints,
            )
            if (snapped33 !== null) {
              self.xAxisSnappedY = snapped33.xAxisSnappedY || null
              self.yAxisSnappedX = snapped33.yAxisSnappedX || null
              const result = self.matchHandelObj.inSceneSnapPointArea(
                {
                  objType: wall.type,
                  snapFromType: 'point',
                  point: snapped33.point
                },
                self.matchedHandelInfo,
              )
              if (result) {
                return true;
              }
            }
          }
          const beMatchLines = wall.getMineBeSnapLines()
          if (beMatchLines.length > 0 && self.matchHandelObj instanceof PointEntityClass) {
            let nearestPoint: Point | null = null
            let minDistance = Infinity
            let matchLine = null;
            for (let j = 0; j < beMatchLines.length; j++) {
              const line = beMatchLines[j]
              const distance = pointToLineDistance({ x: xInGroup, y: yInGroup }, line[0], line[1])
              if (distance < minDistance) {
                matchLine = line
                minDistance = distance
                nearestPoint = getClosestPointOnLine({ x: xInGroup, y: yInGroup }, line[0], line[1])
              }
            }
            if (nearestPoint && minDistance < snapThreshold && matchLine) {
              const result2 = self.matchHandelObj.inSceneSnapLineArea(wall, matchLine, nearestPoint)
              if (result2) {
                return true;
              }
            }
          }
        }
        return false;
      }
      if (window.globalEditGroup.getTypeListEntity('wall')) {
        for (let i = 0; i < window.globalEditGroup.getTypeObjectsData('wall').length; i++) {
          const api: WallEntity = window.globalEditGroup.getTypeListEntity('wall')[i] as WallEntity;
          // 类型“WallEntity”的参数不能赋给类型“BaseEntityClass<PointObjData>”的参数。
          if (matchWall(api)) {
            (() => {
              const screenX = worldData.x * sense.level + sense.panOffset.x;
              const screenY = worldData.y * sense.level + sense.panOffset.y;
              ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
              ctxAction.save()
              ctxAction.translate(screenX, screenY)
              ctxAction.rotate(angleY * -1)
              // 绘制操作句柄
              sense.matchHandelObj.draw2DActionHandle(ctxAction, sense.level)
              ctxAction.restore()
            })();
            return;
          }
        }
      }
      if (sense.matchHandelObj instanceof PointEntityClass) {
        sense.matchHandelObj.notInSceneSnapLineArea()
      }
      const tipTexts = sense.matchHandelObj.matchHandelMoveCallback({
        x: xInGroup,
        y: yInGroup,
        startX: sense.matchHandelStartPoint ? sense.matchHandelStartPoint.x : undefined,
        startY: sense.matchHandelStartPoint ? sense.matchHandelStartPoint.y : undefined,
      }, sense.matchedHandelInfo)
      // 绘制操作句柄
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height);

      (() => {
        const screenX = worldData.x * sense.level + sense.panOffset.x;
        const screenY = worldData.y * sense.level + sense.panOffset.y;
        ctxAction.save()
        ctxAction.translate(screenX, screenY)
        ctxAction.rotate(angleY * -1)
        if (window.globalEditGroup !== window.worldApi) {
          const groupData = window.globalEditGroup.getData()
          ctxAction.translate(
            groupData.x * sense.level,
            groupData.y * sense.level,
          )
          ctxAction.rotate(
            groupData.angleY * -1,
          )
        }
        sense.matchHandelObj.draw2DActionHandle(ctxAction, sense.level)
        ctxAction.restore()
      })();

      if (tipTexts && tipTexts.length > 0) {
        const canvasAction = sense.canvasList[0]!;
        const ctxAction = canvasAction.getContext('2d')!

        const hoverScreenX = xInWorld___ * sense.level + sense.panOffset.x
        const hoverScreenY = yInWorld___ * sense.level + sense.panOffset.y
        const startY = hoverScreenY + 14;
        // 绘制一个背景矩形
        ctxAction.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctxAction.fillRect(hoverScreenX - 60, startY, 120, 8 + 15 * tipTexts.length);
        ctxAction.font = '14px Arial'
        ctxAction.textBaseline = 'middle'
        ctxAction.strokeStyle = 'white'
        ctxAction.fillStyle = 'white'
        ctxAction.textAlign = 'center'
        tipTexts.forEach((v, index) => {
          ctxAction.fillText(v, hoverScreenX, startY + 15 * index + 13)
        })
      }
    } else {
      // 鼠标浮动而过
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
      const { getHandleInAreaInfoByXY } = await import('./getHandleInfoByXY') // 因为循环import，所以不能定义在头部。（canvas2DSceneManage->getHandleInfoByXY->lineEntity->baseEntity->canvas2DSceneManage）
      const handleInfo = getHandleInAreaInfoByXY(window.globalEditGroup, xInGroup, yInGroup)
      if (handleInfo) {
        const { classInfo, matchArea } = handleInfo;
        (() => {
          // 暂无操作句柄
          // 先平移，再旋转，再缩放
          const worldData__ = window.worldApi.getData(); // window.globalEditGroup
          ctxAction.save()
          ctxAction.translate(
            worldData__.x + sense.panOffset.x,
            worldData__.y + sense.panOffset.y
          )
          ctxAction.rotate(worldData__.angleY * -1)
          // ctxAction.scale(sense.level, sense.level)
          if (window.globalEditGroup !== window.worldApi) {
            const groupData = window.globalEditGroup.getData()
            ctxAction.translate(
              groupData.x * sense.level,
              groupData.y * sense.level,
            )
            ctxAction.rotate(
              groupData.angleY * -1,
            )
            drawFUnc()
          } else {
            drawFUnc()
          }
          function drawFUnc() {
            if (matchArea instanceof MatchRectArea) {
              ctxAction.lineWidth = 2
              ctxAction.strokeStyle = 'yellow'
              ctxAction.save()
              ctxAction.translate(
                matchArea.data.x * self.level,
                matchArea.data.y * self.level
              ); // 移动原点到目标中心
              ctxAction.rotate(matchArea.data.angleY * -1);
              // 绘制一个方块
              ctxAction.strokeRect(
                matchArea.data.width / -2 * self.level,
                matchArea.data.depth / -2 * self.level,
                matchArea.data.width * self.level,
                matchArea.data.depth * self.level,
              )
              ctxAction.restore()
            } else if (matchArea instanceof MatchCircleArea) {
              ctxAction.lineWidth = 2
              ctxAction.strokeStyle = 'yellow'
              // 绘制一个圆
              ctxAction.beginPath()
              ctxAction.arc(
                matchArea.data.x * self.level,
                matchArea.data.y * self.level,
                matchArea.data.r * self.level,
                0,
                Math.PI * 2,
              )
              ctxAction.stroke()
            }
            classInfo.draw2DActionHandle(ctxAction, self.level)
          }
          ctxAction.restore()
          if (classInfo instanceof PointEntityClass) {
            ctxAction.font = `${Math.max(14 * self.level, 14)}px '微软雅黑'`
            ctxAction.textAlign = 'center'
            ctxAction.strokeStyle = 'white'
            ctxAction.lineWidth = 2
            const text = classInfo.inAreaHoverText()
            ctxAction.strokeText(
              text,
              mouseXInCanvas,
              mouseYInCanvas - 10,
            )
            ctxAction.fillStyle = 'black'
            ctxAction.fillText(
              `${text}`,
              mouseXInCanvas,
              mouseYInCanvas - 10,
            )
          }
        })();
      }
    }
  })

  sense.onMouseUp(() => {
    if (sense.isPaningAngel) {
      sense.isPaningAngel = false
    }
  })
}
export default bindDanvas2DSceneDefaultEvent