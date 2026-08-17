export const headBones: string[] = [
  'mixamorigNeck',
  'mixamorigHead',
  'mixamorigHeadTop_End',
  'mixamorigHeadTop_End_end',
  'mixamorigHeadTop_End_end_end',
];

export const leftArmBones: string[] = [
  'mixamorigLeftShoulder',
  'mixamorigLeftArm',
  'mixamorigLeftForeArm',
  'mixamorigLeftHand',
  'mixamorigLeftHandThumb1',
  'mixamorigLeftHandThumb2',
  'mixamorigLeftHandThumb3',
  'mixamorigLeftHandThumb4',
  'mixamorigLeftHandThumb4_end',
  'mixamorigLeftHandThumb4_end_end',
  'mixamorigLeftHandPinky1',
  'mixamorigLeftHandPinky2',
  'mixamorigLeftHandPinky3',
  'mixamorigLeftHandPinky4',
  'mixamorigLeftHandPinky4_end',
  'mixamorigLeftHandPinky4_end_end',
  'mixamorigLeftHandMiddle1',
  'mixamorigLeftHandMiddle2',
  'mixamorigLeftHandMiddle3',
  'mixamorigLeftHandMiddle4',
  'mixamorigLeftHandMiddle4_end',
  'mixamorigLeftHandMiddle4_end_end',
  'mixamorigLeftHandRing1',
  'mixamorigLeftHandRing2',
  'mixamorigLeftHandRing3',
  'mixamorigLeftHandRing4',
  'mixamorigLeftHandRing4_end',
  'mixamorigLeftHandRing4_end_end',
  'mixamorigLeftHandIndex1',
  'mixamorigLeftHandIndex2',
  'mixamorigLeftHandIndex3',
  'mixamorigLeftHandIndex4',
  'mixamorigLeftHandIndex4_end',
  'mixamorigLeftHandIndex4_end_end',
]

export const rightArmBones = [
  'mixamorigRightShoulder',
  'mixamorigRightArm',
  'mixamorigRightForeArm',
  'mixamorigRightHand',
  'mixamorigRightHandThumb1',
  'mixamorigRightHandThumb2',
  'mixamorigRightHandThumb3',
  'mixamorigRightHandThumb4',
  'mixamorigRightHandThumb4_end',
  'mixamorigRightHandThumb4_end_end',
  'mixamorigRightHandIndex1',
  'mixamorigRightHandIndex2',
  'mixamorigRightHandIndex3',
  'mixamorigRightHandIndex4',
  'mixamorigRightHandIndex4_end',
  'mixamorigRightHandIndex4_end_end',
  'mixamorigRightHandMiddle1',
  'mixamorigRightHandMiddle2',
  'mixamorigRightHandMiddle3',
  'mixamorigRightHandMiddle4',
  'mixamorigRightHandMiddle4_end',
  'mixamorigRightHandMiddle4_end_end',
  'mixamorigRightHandRing1',
  'mixamorigRightHandRing2',
  'mixamorigRightHandRing3',
  'mixamorigRightHandRing4',
  'mixamorigRightHandRing4_end',
  'mixamorigRightHandRing4_end_end',
  'mixamorigRightHandPinky1',
  'mixamorigRightHandPinky2',
  'mixamorigRightHandPinky3',
  'mixamorigRightHandPinky4',
  'mixamorigRightHandPinky4_end',
  'mixamorigRightHandPinky4_end_end',
];

export const upperBodyBones = [
  'mixamorigSpine',
  'mixamorigSpine1',
  'mixamorigSpine2',
  ...headBones,
  ...leftArmBones,
  ...rightArmBones,
]
export const lowerBodyBones = [
  'mixamorigHips',
  'mixamorigRightUpLeg',
  'mixamorigRightLeg',
  'mixamorigRightFoot',
  'mixamorigRightToeBase',
  'mixamorigRightToe_End',
  'mixamorigRightToe_End_end',
  'mixamorigRightToe_End_end_end',
  'mixamorigLeftUpLeg',
  'mixamorigLeftLeg',
  'mixamorigLeftFoot',
  'mixamorigLeftToeBase',
  'mixamorigLeftToe_End',
  'mixamorigLeftToe_End_end',
  'mixamorigLeftToe_End_end_end',
]

export const fullBodyBones = [
  ...upperBodyBones,
  ...lowerBodyBones,
]

export type ApplyScope = 'fullBody' | 'upperBody' | 'lowerBody' | 'head' | 'leftArm' | 'rightArm'

export function getBoneFilter(scope: ApplyScope): string[] {
  switch (scope) {
    case 'fullBody':
      return fullBodyBones
    case 'upperBody':
      return upperBodyBones;
    case 'lowerBody':
      return lowerBodyBones
    case 'head':
      return headBones
    case 'leftArm':
      return leftArmBones
    case 'rightArm':
      return rightArmBones
  }
}
