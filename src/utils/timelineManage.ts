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
}
const api = new TimelineStateClass()

export const timelineState = api;