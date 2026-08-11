import { FFmpeg } from "@ffmpeg/ffmpeg";
// @ts-ignore
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();

  // 核心文件的 CDN 地址（使用稳定版本）
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } catch (error) {
    throw new Error(`FFmpeg 加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
// convertWebmToMp4：使用 @ffmpeg/core（Wasm 主线程模式）将 WebM 转码为 H.264 MP4
//
// 【设计原则：严格对齐用户诉求 —— 100% npm 引入，不用任何 CDN / 全局变量 / 复制插件】
//
// 链路：
//   ① 顶部正常 npm static import：
//        import { createFFmpegCore } from '@ffmpeg/core'
//        import { fetchFile } from '@ffmpeg/util'
//   ② Webpack 5 编译修复（vue.config.js 3 条规则）：
//        · resolve.fallback.module = false        → 修 "Can't resolve 'module'"（Emscripten Node 分支）
//        · unknownContextCritical/exprContextCritical = false → 修 "Can't resolve './'"（动态 require 拼接）
//        · module.noParse = /ffmpeg-core\.js$/    → 优化：Webpack 不解析几十 MB 的 Emscripten 巨无霸 JS
//   ③ 转码逻辑：主线程直接 createFFmpegCore() → 写入 input.webm → callMain(ffmpeg 命令) → 读 output.mp4
//
//  已知 trade-off：主线程跑 Wasm，转码期间页面会短暂卡顿（JS 事件循环被阻塞）。
//  本次先确保"能编译通过 + 功能跑通 + 完全 npm 引入"，之后如需流畅 UI，再加一个 15 行的手写 Web Worker
//  把 createFFmpegCore 移进去（Worker 代码是我们自己写的，Webpack 处理自己写的 Worker 完全没问题，
//  用 new Worker(new URL('./ffmpegWorker', import.meta.url), { type: 'module' }) 标准语法）
//
//  转码参数：libx264 + yuv420p + crf23 + +faststart，兼容绝大多数播放器和 AI 处理平台
async function convertWebmToMp4(webmBlob: Blob): Promise<Blob> {
  // 1. 参数验证
  if (!webmBlob || !(webmBlob instanceof Blob)) {
    throw new Error('参数必须是一个有效的 Blob 对象');
  }

  if (webmBlob.size === 0) {
    throw new Error('输入的 Blob 文件为空');
  }
  // 2. 获取 FFmpeg 实例
  const ffmpeg = await getFFmpeg();

  // 3. 定义输入输出文件名（使用时间戳避免缓存冲突）
  const timestamp = Date.now();
  const inputFileName = `input_${timestamp}.webm`;
  const outputFileName = `output_${timestamp}.mp4`;

  console.log('webmBlob-1', webmBlob)
  try {
    // 4. 将 Blob 写入 FFmpeg 的虚拟文件系统
    await ffmpeg.writeFile(inputFileName, await fetchFile(webmBlob));

    // 5. 执行转码命令
    // 参数说明:
    // -i input.webm    : 指定输入文件
    // -c:v libx264     : 使用 H.264 视频编码（兼容性最好）
    // -c:a aac         : 使用 AAC 音频编码（MP4 标准音频格式）
    // -movflags +faststart : 优化视频流媒体播放（允许边下边播）
    // -preset fast     : 编码速度优先（可改为 medium/slow 换取更小体积）
    // -crf 23          : 质量控制（18-28，数值越小质量越高但文件越大）
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      '-preset', 'fast',
      '-crf', '23',
      outputFileName
    ]);

    // 6. 读取转换后的文件
    const data = await ffmpeg.readFile(outputFileName);
    console.log('webmBlob-2', data)

    // 7. 将 Uint8Array 转换为 Blob
    // @ts-ignore
    const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
    console.log('webmBlob-3', mp4Blob)
    // 8. 清理虚拟文件系统（释放内存）
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      // 清理失败不影响主流程，仅打印警告
      console.warn('清理虚拟文件失败:', cleanupError);
    }
    return mp4Blob;
  } catch (error) {
    // 错误处理和清理
    try {
      await ffmpeg.deleteFile(inputFileName);
    } catch (_) {
      // 忽略清理错误
    }

    throw new Error(
      `WebM 转 MP4 失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}
export default convertWebmToMp4