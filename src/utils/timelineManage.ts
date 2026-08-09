export interface KeyTimePoint {
  time: number
  value: number
  easing?: string
}

export interface ObjOneColumnData {
  trackType: string
  keyTimePoints: KeyTimePoint[]
  interpolation?: 'linear' | 'step' | 'bezier'
}

export interface ObjAllColumnData {
  clipId: string
  entityId: string
  startTime: number
  endTime: number
  columns: ObjOneColumnData[]
}

export interface ClipSegment {
  clip: ObjAllColumnData
  startTime: number
  endTime: number
  rowIndex: number
}

export interface TimelineData {
  duration: number
  clips: ObjAllColumnData[]
}

class TimelineStateClass {
  public isPlaying = false;

  private timelineData_: TimelineData = {
    duration: 30,
    clips: []
  };

  currentTime_: number = 0;

  get currentTime() {
    return this.currentTime_;
  }

  set currentTime(value: number) {
    this.currentTime_ = value
    this.triggerChangeCurrentTime()
  }

  set timelineData(value: TimelineData) {
    this.timelineData_ = value
    this.triggerChange()
  }

  get timelineData(): TimelineData {
    return this.timelineData_;
  }

  private onChangeCallbacks: (() => void)[] = []

  public onChange(callback: () => void) {
    this.onChangeCallbacks.push(callback)
  }

  public triggerChange() {
    this.onChangeCallbacks.forEach(callback => callback())
  }

  private onChangeCurrentTimeCallbacks: (() => void)[] = []
  public onChangeCurrentTime(callback: () => void) {
    this.onChangeCurrentTimeCallbacks.push(callback)
  }

  public triggerChangeCurrentTime() {
    this.onChangeCurrentTimeCallbacks.forEach(callback => callback())
  }
}
const api = new TimelineStateClass()

export const timelineState = api;