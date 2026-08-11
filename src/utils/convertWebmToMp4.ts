import { FFmpeg } from "@ffmpeg/ffmpeg";
// @ts-ignore
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  const ffmpeg = new FFmpeg();

  // 安装日志监听器（必须在 load 之前绑定，否则加载期间日志丢失）
  // 注意：@ffmpeg/ffmpeg 0.12.x 只有 'log' 和 'progress' 两个事件。
  // log 的 type = 'ffout' 是 stdout，type = 'fferr' 是 stderr（含错误信息）。
  ffmpeg.on('log', ({ type, message }: { type: string; message: string }) => {
    if (type === 'fferr') {
      console.error('[ffmpeg:err]', message);
    } else {
      console.log('[ffmpeg:out]', message);
    }
  });
  ffmpeg.on('progress', ({ progress, time }: { progress: number; time: number }) => {
    console.debug(`[ffmpeg:progress] ${(progress * 100).toFixed(1)}% time=${time}us`);
  });

  // 核心文件的 CDN 地址（必须与 package.json 中 @ffmpeg/core 版本一致！）
  // package.json: "@ffmpeg/core": "0.12.6"
  const coreVersion = '0.12.6';
  const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${coreVersion}/dist/umd`;

  const loadTask = (async () => {
    try {
      console.log(`[getFFmpeg] 从 CDN 加载 @ffmpeg/core@${coreVersion} ...`);
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      console.log('[getFFmpeg] FFmpeg 加载成功 ✓');
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (error) {
      ffmpegLoadingPromise = null;
      throw new Error(`FFmpeg 加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  })();

  ffmpegLoadingPromise = loadTask;
  return loadTask;
}

// convertWebmToMp4：使用 @ffmpeg/ffmpeg（Wasm 主线程模式）将 WebM 转码为 H.264 MP4
//
// 转码参数：libx264 + yuv420p + crf23 + +faststart，兼容绝大多数播放器和 AI 处理平台
async function convertWebmToMp4(webmBlob: Blob): Promise<Blob> {
  // 1. 参数验证
  if (!webmBlob || !(webmBlob instanceof Blob)) {
    throw new Error('参数必须是一个有效的 Blob 对象');
  }
  if (webmBlob.size === 0) {
    throw new Error('输入的 Blob 文件为空');
  }
  console.log('[convertWebmToMp4] 输入 webmBlob size =', webmBlob.size, 'type =', webmBlob.type);

  // 2. 获取 FFmpeg 实例
  const ffmpeg = await getFFmpeg();

  // 3. 定义输入输出文件名（使用时间戳避免缓存冲突）
  const timestamp = Date.now();
  const inputFileName = `input_${timestamp}.webm`;
  const outputFileName = `output_${timestamp}.mp4`;

  try {
    // 4. 将 Blob 写入 FFmpeg 的虚拟文件系统
    const inputData = await fetchFile(webmBlob);
    console.log('[convertWebmToMp4] 写入虚拟文件:', inputFileName, 'data length =', inputData.length);
    await ffmpeg.writeFile(inputFileName, inputData);

    // 5. 执行转码命令
    // 参数说明:
    // -y               : 自动覆盖输出文件（避免 FFmpeg 交互提示导致卡住）
    // -i input.webm    : 指定输入文件
    // -c:v libx264     : 使用 H.264 视频编码（兼容性最好）
    // -pix_fmt yuv420p : 像素格式（保证 QuickTime 等播放器兼容，否则可能无法播放）
    // -c:a aac         : 使用 AAC 音频编码（MP4 标准音频格式）
    // -movflags +faststart : 优化视频流媒体播放（允许边下边播）
    // -preset fast     : 编码速度优先（可改为 medium/slow 换取更小体积）
    // -crf 23          : 质量控制（18-28，数值越小质量越高但文件越大）
    console.log('[convertWebmToMp4] 开始执行转码命令...');
    const exitCode = await ffmpeg.exec([
      '-y',
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      '-preset', 'fast',
      '-crf', '23',
      outputFileName
    ]);
    console.log('[convertWebmToMp4] 转码命令退出码 exitCode =', exitCode);

    if (exitCode !== 0) {
      throw new Error(`FFmpeg 转码命令执行失败，退出码: ${exitCode}。请查看控制台 [ffmpeg:error] 日志获取详情。`);
    }

    // 6. 检查输出文件是否存在 + 读取转换后的文件
    //    先用 listDir 列出目录，验证输出文件确实被创建了
    const dirEntries = await ffmpeg.listDir('/');
    console.log('[convertWebmToMp4] 虚拟文件系统根目录列表:', dirEntries);

    const outputEntry = dirEntries.find((e) => !e.isDir && e.name === outputFileName);
    if (!outputEntry) {
      throw new Error(`转码完成但输出文件 ${outputFileName} 未在虚拟文件系统中找到。`);
    }

    const data = await ffmpeg.readFile(outputFileName);
    // readFile 返回 FileData = Uint8Array | string。视频必然是 Uint8Array（二进制）
    const uint8Data = data as Uint8Array;
    console.log('[convertWebmToMp4] 读取输出文件 data 长度 =', uint8Data.length, 'constructor =', uint8Data.constructor.name);

    if (!uint8Data || uint8Data.length === 0) {
      throw new Error('转码输出文件内容为空（0 字节）。可能原因：输入 WebM 编码格式不被 FFmpeg WASM 支持，或转码过程中出现了静默错误。');
    }

    // 7. 将 Uint8Array 转换为 Blob
    //    FFmpeg WASM 返回的 Uint8Array 底层 buffer 可能是 SharedArrayBuffer，
    //    而 TS 5.9+ 的 BlobPart 不接受 SharedArrayBuffer。
    //    解决方案：用 slice() 把实际数据段拷贝成一个纯 ArrayBuffer，再传给 Blob。
    const arrayBuf = uint8Data.buffer.slice(
      uint8Data.byteOffset,
      uint8Data.byteOffset + uint8Data.byteLength
    ) as ArrayBuffer;
    const mp4Blob = new Blob([arrayBuf], { type: 'video/mp4' });
    console.log('[convertWebmToMp4] 最终 mp4Blob size =', mp4Blob.size);

    // 8. 清理虚拟文件系统（释放内存）
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      console.warn('清理虚拟文件失败:', cleanupError);
    }
    return mp4Blob;
  } catch (error) {
    // 错误处理和清理
    try {
      await ffmpeg.deleteFile(inputFileName).catch(() => {});
      await ffmpeg.deleteFile(outputFileName).catch(() => {});
    } catch (_) {
      // 忽略清理错误
    }

    const msg = error instanceof Error ? error.message : '未知错误';
    console.error('[convertWebmToMp4] 失败:', msg, error);
    throw new Error(`WebM 转 MP4 失败: ${msg}`);
  }
}

export default convertWebmToMp4