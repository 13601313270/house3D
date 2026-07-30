
export interface Keyframe {
  time: number
  value: any
  easing?: string
}

export interface TrackData {
  trackType: string
  keyframes: Keyframe[]
  interpolation?: 'linear' | 'step' | 'bezier'
}

interface ClipData {
  clipId: string
  entityId: string
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