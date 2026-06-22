const imgCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imgCache.has(src)) {
      resolve(imgCache.get(src)!);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

export function clearImageCache(src?: string): void {
  if (src) {
    imgCache.delete(src);
  } else {
    imgCache.clear();
  }
}

export function getCachedImage(src: string): HTMLImageElement | undefined {
  return imgCache.get(src);
}

export function hasCachedImage(src: string): boolean {
  return imgCache.has(src);
}
