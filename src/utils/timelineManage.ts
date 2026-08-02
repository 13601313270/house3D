export interface Keyframe {
  time: number
  value: number
  easing?: string
}

export interface TrackData {
  trackType: string
  keyframes: Keyframe[]
  interpolation?: 'linear' | 'step' | 'bezier'
}

export interface ClipData {
  clipId: string
  entityId: string
  startTime: number
  endTime: number
  tracks: TrackData[]
}

export interface ClipSegment {
  clip: ClipData
  startTime: number
  endTime: number
  rowIndex: number
}

export interface TimelineData {
  duration: number
  clips: ClipData[]
}

class TimelineStateClass {
  public isPlaying = false;

  private timelineData_: TimelineData = {
    duration: 30,
    clips: []
  };

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
}
const api = new TimelineStateClass()

export const timelineState = api;