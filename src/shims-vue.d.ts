/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// @ffmpeg/core 0.12.x 没有自带 TypeScript 声明，加上兜底声明避免 TS 报模块找不到
declare module '@ffmpeg/core' {
  export interface FFmpegCore {
    FS: {
      writeFile(name: string, data: Uint8Array | string): void;
      readFile(name: string, opts?: { encoding?: 'binary' }): Uint8Array;
      unlink(name: string): void;
    };
    callMain(args: string[]): number;
    exit(code: number): void;
  }
  export function createFFmpegCore(
    factoryOptions?: {
      locateFile?: (path: string, prefix: string) => string;
      print?: (text: string) => void;
      printErr?: (text: string) => void;
    }
  ): Promise<FFmpegCore>;
}

// @ffmpeg/util 的 fetchFile 简单兜底声明（如果包自带 d.ts 会覆盖这个）
declare module '@ffmpeg/util' {
  export function fetchFile(
    data: Blob | File | string | Uint8Array
  ): Promise<Uint8Array>;
}

// .wasm 文件导入：Webpack 5 asset/resource 模式下返回 URL 字符串
//   （Emscripten FFmpeg 内部自己 fetch + 实例化 wasm，我们只需给它 URL）
declare module '*.wasm' {
  const content: string;
  export default content;
}

// @ffmpeg/core/wasm：package.json exports 暴露的子路径，返回 wasm URL（Webpack 5 asset/resource）
declare module '@ffmpeg/core/wasm' {
  const content: string;
  export default content;
}

// 【扩展 Window 全局：配合 script-loader!@ffmpeg/core 使用】
//   script-loader 会把 UMD 版 ffmpeg-core.js 作为全局 <script> 注入，
//   UMD 内的顶层 var createFFmpegCore = ... 会挂到 window.createFFmpegCore。
//   这里把 TS 类型补全，避免使用时必须 cast (window as any)。
interface FFmpegCore {
  FS: {
    writeFile(name: string, data: Uint8Array | string): void;
    readFile(name: string, opts?: { encoding?: 'binary' }): Uint8Array;
    unlink(name: string): void;
  };
  callMain(args: string[]): number;
  exit(code: number): void;
}
type CreateFFmpegCoreFn = (
  factoryOptions?: {
    locateFile?: (path: string, prefix: string) => string;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
  }
) => Promise<FFmpegCore>;
// ali-oss 简单兜底类型声明
declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    stsToken?: string;
    bucket: string;
    secure?: boolean;
    endpoint?: string;
    internal?: boolean;
    cname?: boolean;
    timeout?: string | number;
  }
  interface PutOptions {
    headers?: Record<string, string>;
    mime?: string;
  }
  interface PutResult {
    url: string;
    name: string;
    data?: any;
    res?: any;
  }
  class OSS {
    constructor(options: OSSOptions);
    put(name: string, file: File | Blob | Uint8Array | Buffer | string, options?: PutOptions): Promise<PutResult>;
  }
  export default OSS;
}

interface Window {
  createFFmpegCore: CreateFFmpegCoreFn;
}
