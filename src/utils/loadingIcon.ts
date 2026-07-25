// ============================================
// 1. 配置
// ============================================
const FAVICON_URL = '/favicon.ico';      // 你的原始图标
const LOADING_SVG_URL = '/faviconLoading.svg';  // 你的 loading.svg 路径
const CANVAS_SIZE = 64;                  // 图标尺寸
let animationId: NodeJS.Timeout | null = null;
let rotationAngle = 0;

// ============================================
// 2. 预加载两张图片
// ============================================
function loadImages() {
  return new Promise((resolve, reject) => {
    const baseImg = new Image();
    const loadingImg = new Image();
    let loadedCount = 0;

    function checkLoaded() {
      loadedCount++;
      if (loadedCount === 2) {
        resolve({ baseImg, loadingImg });
      }
    }

    baseImg.onload = checkLoaded;
    baseImg.onerror = () => {
      console.warn('原始图标加载失败，使用纯色背景');
      // 即使失败也继续，后面会用备用方案
      checkLoaded();
    };
    loadingImg.onload = checkLoaded;
    loadingImg.onerror = () => {
      console.error('loading.svg 加载失败！');
      reject(new Error('loading.svg 加载失败'));
    };

    baseImg.src = FAVICON_URL;
    loadingImg.src = LOADING_SVG_URL;
  });
}

// ============================================
// 3. 绘制 favicon（底图 + 旋转的 loading.svg）
// ============================================
function drawFaviconWithLoading(baseImg: HTMLImageElement, loadingImg: HTMLImageElement, angle: number) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // --- 第一步：绘制原始 favicon ---
  try {
    ctx.drawImage(baseImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } catch (e) {
    // 如果底图加载失败，用渐变背景
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#667eea');
    grad.addColorStop(1, '#764ba2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // --- 第二步：叠加 loading.svg（旋转） ---
  ctx.save();

  // 将画布原点移到中心，然后旋转
  ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  ctx.rotate(angle);

  // 绘制 loading.svg（居中绘制，尺寸可以根据需要调整）
  // 这里让 loading.svg 占画布的 80%，留点边距
  const size = CANVAS_SIZE * 0.8;
  ctx.drawImage(
    loadingImg,
    -size / 2,
    -size / 2,
    size,
    size
  );

  ctx.restore();

  // --- 第三步：更新 favicon ---
  const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.rel = 'icon';
  link.href = canvas.toDataURL('image/png');
  document.head.appendChild(link);
}

// ============================================
// 4. 启动动画
// ============================================
export function startLoading() {
  // 如果已有动画，先停止
  stopLoading();

  // 加载两张图片
  loadImages()
    .then(({ baseImg, loadingImg }: any) => {
      // 图片加载完成，开始动画循环
      function animate() {
        rotationAngle += 0.05; // 旋转速度（弧度/帧）
        if (rotationAngle > Math.PI * 2) {
          rotationAngle -= Math.PI * 2;
        }
        drawFaviconWithLoading(baseImg, loadingImg, rotationAngle);
      }
      animationId = setInterval(animate, 24);
    })
    .catch((error) => {
      console.error('启动动画失败:', error);
      alert('无法加载 loading.svg，请检查路径是否正确');
    });
}

// ============================================
// 5. 停止动画，恢复原始图标
// ============================================
export function stopLoading() {
  if (animationId) {
    clearInterval(animationId);
    animationId = null;
  }

  // 恢复原始 favicon
  const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (link) {
    link.href = FAVICON_URL + '?v=' + Date.now();
  }
  rotationAngle = 0;
}

// ============================================
// 6. 页面关闭时清理
// ============================================
window.addEventListener('beforeunload', function () {
  if (animationId) {
    clearInterval(animationId);
  }
});