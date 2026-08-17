// applyEasing：缓动函数（以左关键帧 easing 为准）
//  - linear：t
//  - easeIn：二次方进入（t²）
//  - easeOut：二次方退出（2t - t²）
//  - easeInOut：前段 2t²，后段 2*(2-2t)*t -1
function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'easeIn': return t * t
    case 'easeOut': return t * (2 - t)
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    default: return t
  }
}