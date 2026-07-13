import { GroupBaseEntity } from '@/types/GroupBaseEntity'

export const canvasHeight = 600
export const snapThreshold = 20
type WorldChangeType = 'add' | 'remove' | 'change'

export interface EnvironmentConfig {
  skyType: number
  ambientLightIntensity?: number
  showGround?: boolean
}

export class GroupEntity extends GroupBaseEntity {
}
