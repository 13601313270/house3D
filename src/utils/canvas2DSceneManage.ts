import { BaseEntityClass } from "@/types/baseEntity";
import { HandelInfo, Point } from "@/types/map2d";
import { MatchCircleArea, MatchRectArea } from "./matchArea";
import { PointEntityClass } from "@/types/pointEntity";
import { WallEntity } from "@/entities/wall/entity";
import pointToLineDistance from "./pointToLineDistance";
import { getClosestPointOnLine } from "./geometry";
import { snapThreshold } from "./getNearestWall";
import getSnapPointAndLine from "./getSnapPoint";

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

  matchHandelObj: BaseEntityClass<any> | null = null;
  matchedHandelInfo: HandelInfo | null = null
  matchHandelStartPoint: Point | null = null;

  xAxisSnappedY: number | null = null;
  yAxisSnappedX: number | null = null;

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

    this.onMouseDown(async (point) => {
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
      } else {
        const worldData = window.worldApi.getData();
        const { angleY } = worldData;
        const dx = mouseXInCanvas - this.panOffset.x
        const dy = mouseYInCanvas - this.panOffset.y
        const cos = Math.cos(angleY * -1)
        const sin = Math.sin(angleY * -1)
        const xInWorld = (dx * cos + dy * sin) / this.level
        const yInWorld = (-dx * sin + dy * cos) / this.level

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
            this.matchHandelObj = classInfo
            this.matchedHandelInfo = handle
            this.matchHandelStartPoint = { x: xInGroup, y: yInGroup }
            const canvasAction = this.canvasList[1]!;
            const screenX = worldData.x * this.level + this.panOffset.x;
            const screenY = worldData.y * this.level + this.panOffset.y;
            const ctxAction = canvasAction.getContext('2d')!
            ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
            ctxAction.save()
            ctxAction.translate(screenX, screenY)
            ctxAction.rotate(worldData.angleY * -1)
            this.matchHandelObj.draw2DActionHandle(ctxAction, this.level)
            ctxAction.restore()
            return
          }
        }
        // 如果没有拖拽到任何点，开始平移
        this.isPanningScreen = true
        this.mouseStartScreenX = mouseXInCanvas
        this.mouseStartScreenY = mouseYInCanvas
        this.panStartOffsetOfWorld = {
          x: this.panOffset.x,
          y: this.panOffset.y,
        }
      }
    })

    this.onMouseMove(async (point) => {
      const mouseXInCanvas = point.x
      const mouseYInCanvas = point.y
      const self = this;
      const worldData = window.worldApi.getData();
      const angleY = worldData.angleY;// + groupAngle;
      const dx = mouseXInCanvas - this.panOffset.x
      const dy = mouseYInCanvas - this.panOffset.y
      const cos = Math.cos(angleY * -1)
      const sin = Math.sin(angleY * -1)
      const xInWorld___ = (dx * cos + dy * sin) / this.level;// - groupX
      const yInWorld___ = (-dx * sin + dy * cos) / this.level;// - groupY
      let xInGroup = xInWorld___;
      let yInGroup = yInWorld___;
      const canvasAction = this.canvasList[1]!;
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
      } else if (this.isPaningAngel) {
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
      } else if (this.isPanningScreen) {
        this.isPaningAngel = false
        const dx = mouseXInCanvas - this.mouseStartScreenX
        const dy = mouseYInCanvas - this.mouseStartScreenY

        this.setPanOffset({
          x: this.panStartOffsetOfWorld.x + dx,
          y: this.panStartOffsetOfWorld.y + dy,
        })
        this.canvasList[1]!.getContext('2d')!.clearRect(0, 0, this.width, this.height)
      } else if (this.matchHandelObj && this.matchedHandelInfo) {
        this.isPaningAngel = false
        const self = this;
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
                const screenX = worldData.x * this.level + this.panOffset.x;
                const screenY = worldData.y * this.level + this.panOffset.y;
                ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
                ctxAction.save()
                ctxAction.translate(screenX, screenY)
                ctxAction.rotate(angleY * -1)
                // 绘制操作句柄
                this.matchHandelObj.draw2DActionHandle(ctxAction, this.level)
                ctxAction.restore()
              })();
              return;
            }
          }
        }
        if (this.matchHandelObj instanceof PointEntityClass) {
          this.matchHandelObj.notInSceneSnapLineArea()
        }
        const tipTexts = this.matchHandelObj.matchHandelMoveCallback({
          x: xInGroup,
          y: yInGroup,
          startX: this.matchHandelStartPoint ? this.matchHandelStartPoint.x : undefined,
          startY: this.matchHandelStartPoint ? this.matchHandelStartPoint.y : undefined,
        }, this.matchedHandelInfo)
        // 绘制操作句柄
        ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height);

        (() => {
          const screenX = worldData.x * this.level + this.panOffset.x;
          const screenY = worldData.y * this.level + this.panOffset.y;
          ctxAction.save()
          ctxAction.translate(screenX, screenY)
          ctxAction.rotate(angleY * -1)
          if (window.globalEditGroup !== window.worldApi) {
            const groupData = window.globalEditGroup.getData()
            ctxAction.translate(
              groupData.x * this.level,
              groupData.y * this.level,
            )
            ctxAction.rotate(
              groupData.angleY * -1,
            )
          }
          this.matchHandelObj.draw2DActionHandle(ctxAction, this.level)
          ctxAction.restore()
        })();

        if (tipTexts && tipTexts.length > 0) {
          const canvasAction = this.canvasList[0]!;
          const ctxAction = canvasAction.getContext('2d')!

          const hoverScreenX = xInWorld___ * this.level + this.panOffset.x
          const hoverScreenY = yInWorld___ * this.level + this.panOffset.y
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
              worldData__.x + this.panOffset.x,
              worldData__.y + this.panOffset.y
            )
            ctxAction.rotate(worldData__.angleY * -1)
            // ctxAction.scale(canvas2DSceneManage.list[0].level, canvas2DSceneManage.list[0].level)
            if (window.globalEditGroup !== window.worldApi) {
              const groupData = window.globalEditGroup.getData()
              ctxAction.translate(
                groupData.x * this.level,
                groupData.y * this.level,
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