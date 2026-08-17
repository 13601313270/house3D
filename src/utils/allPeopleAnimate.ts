export type AnimationItem = {
  key: string,
  name: string,
  img: string,
  file: string,
}
const allPeopleAnimate: Array<AnimationItem> = [
  {
    key: 'standing',
    name: '垂手站立',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/131220901/animated.gif',
    file: 'standing.fbx',
  },
  {
    key: 'walking',
    name: '走路',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/118080901/animated.gif',
    file: 'walking.fbx',
  },
  {
    key: 'plank',
    name: '趴下',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/120040901/animated.gif',
    file: 'plank.fbx',
  },
  {
    key: 'run',
    name: '跑',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/128630905/animated.gif',
    file: 'run.fbx',
  },
  {
    key: 'laying',
    name: '躺',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/130560901/animated.gif',
    file: 'laying.fbx',
  },
  {
    key: 'swimming',
    name: '游泳',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/110800901/animated.gif',
    file: 'swimming.fbx',
  },
  {
    key: 'layingPose',
    name: '侧躺',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140400905/animated.gif',
    file: 'layingPose.fbx',
  },
  {
    key: 'sit4',
    name: '坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/116270901/animated.gif',
    file: 'sit4.fbx',
  },
  {
    key: 'jump',
    name: '跳跃',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/124500902/animated.gif',
    file: 'jump.fbx',
  },
  {
    key: 'sit2',
    name: '翘腿坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/116560901/animated.gif',
    file: 'sit2.fbx',
  },
  {
    key: 'sit3',
    name: '倚靠坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140600901/animated.gif',
    file: 'sit3.fbx',
  },
  {
    key: 'sit',
    name: '前倾坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/137570901/animated.gif',
    file: 'sit.fbx',
  },
  {
    key: 'femaleSittingPose',
    name: '倚靠坐2',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140600908/animated.gif',
    file: 'femaleSittingPose.fbx',
  },
  {
    key: 'squat',
    name: '蹲下',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/137630901/animated.gif',
    file: 'squat.fbx',
  },
  {
    key: 'praying',
    name: '跪下',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/103130903/animated.gif',
    file: 'praying.fbx',
  },
  {
    key: 'punchingBag',
    name: '拳击',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/113930901/animated.gif',
    file: 'punchingBag.fbx',
  },
  {
    key: 'maleLayingPose',
    name: '手撑躺',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/150400906/animated.gif',
    file: 'maleLayingPose.fbx',
  },
  {
    key: 'femaleStandingPose',
    name: '单腿俏皮站立',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140700904/animated.gif',
    file: 'femaleStandingPose.fbx',
  },
  {
    key: 'kick',
    name: '踢人',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/124070904/animated.gif',
    file: 'kick.fbx',
  },
  {
    key: 'walk',
    name: '大摇大摆走',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/102230901/animated.gif',
    file: 'walk.fbx',
  },
  {
    key: 'hanging',
    name: '吊',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/114390901/animated.gif',
    file: 'hanging.fbx',
  },
  {
    key: 'flair',
    name: '托马斯',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/121780901/animated.gif',
    file: 'flair.fbx',
  },
  {
    key: 'running',
    name: '前滚翻',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/130030901/animated.gif',
    file: 'running.fbx',
  },
  {
    key: 'shootingArrow',
    name: '射箭',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/112390901/animated.gif',
    file: 'shootingArrow.fbx',
  },
  {
    key: 'baseballHit',
    name: '棒球击打',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/125420901/animated.gif',
    file: 'baseballHit.fbx',
  },
  {
    key: 'breakdanceFreezeVar3',
    name: '街舞扫腿',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/121890901/animated.gif',
    file: 'breakdanceFreezeVar3.fbx'
  },
  {
    key: 'femaleDancePose',
    name: '舞蹈舒展',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140200906/animated.gif',
    file: 'femaleDancePose.fbx'
  },
  {
    key: 'hipHopDancing',
    name: '霹雳舞波浪',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/101960901/animated.gif',
    file: 'hipHopDancing.fbx',
  },
  {
    key: 'kneelingDown',
    name: '单膝跪',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/135940901/animated.gif',
    file: 'kneelingDown.fbx',
  },
  {
    key: 'salute',
    name: '单膝跪',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/120580901/animated.gif',
    file: 'Salute.fbx',
  },
  {
    key: 'joggingWithBox',
    name: '抱着盒子',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/111220901/animated.gif',
    file: 'joggingWithBox.fbx',
  },
  {
    key: 'waving',
    name: '挥手',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/136290901/animated.gif',
    file: 'waving.fbx'
  }
]
export default allPeopleAnimate
