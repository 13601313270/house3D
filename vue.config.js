const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 【最小化配置】：仅加入修复 @ffmpeg/core Webpack 5 编译错误的 3 条规则
  configureWebpack: {
    resolve: {
      // 【新增：修复 ESM → SyntaxError】强制 @ffmpeg/core 使用 UMD 构建入口
      //   @ffmpeg/core/package.json exports 配置：
      //     import → dist/esm/ffmpeg-core.js（含 ESM import 语法，Emscripten 内部运行时按 classic script 加载 → SyntaxError）
      //     require → dist/umd/ffmpeg-core.js（UMD 无 import 语法，classic script 加载完全没问题）
      //   用 alias 强制把 import '@ffmpeg/core' 解析到 UMD 入口，同时保持 TS 类型声明路径匹配（@ffmpeg/core）
      alias: {
        '@ffmpeg/core$': require('path').resolve(__dirname, 'node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js'),
      },
      // 【修复错误 1】Can't resolve 'module'
      //   @ffmpeg/core 是 Emscripten 自动生成的 FFmpeg WASM 封装，内部有针对 Node 环境的分支：
      //     if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      //       var Module = require('module'); ...
      //     }
      //   Webpack 5 默认 browser 目标不 polyfill Node 内置模块（module/fs/path 等），
      //   静态扫描时发现 require('module') 就直接报错。虽然浏览器端这个分支永远走不到，
      //   但还是要显式告诉 Webpack：遇到 'module' 直接用空模块替代（false），不要报错。
      fallback: {
        module: false,
        // 同理，其他 Emscripten 产物可能尝试引用的 Node 内置模块也一并 false，避免未来其他错误
        fs: false,
        path: false,
        crypto: false,
        events: false,
        stream: false,
        util: false,
        buffer: false,
        // 【补充：解决新的 Module not found 错误】
        //   perf_hooks: Node.js performance hooks（浏览器端永远不会走到 require 分支，但 Webpack 扫描要兜底）
        //   os / url / assert / tty / child_process / worker_threads: 其他 Emscripten 可能扫描到的 Node 内置模块
        perf_hooks: false,
        os: false,
        url: false,
        assert: false,
        tty: false,
        child_process: false,
        worker_threads: false,
      },
    },
    module: {
      // 【新增：修复 FFmpeg Wasm 加载 404】
      //   我们在代码中 `import ffmpegCoreWasmUrl from '@ffmpeg/core/dist/umd/ffmpeg-core.wasm'`
      //   期望得到一个可访问的 URL 字符串（然后通过 locateFile 交给 Emscripten 自己去 fetch）。
      //   但 Webpack 5 默认对 .wasm 后缀走 `webassembly/async` 模块（会尝试编译 Wasm 模块），
      //   与 Emscripten 的使用方式冲突。这里强制把 ffmpeg-core 的 wasm 按 `asset/resource` 处理
      //   → 产出独立静态文件，import 时直接返回其 URL 字符串。
      rules: [
        {
          test: /ffmpeg-core\.wasm$/,
          type: 'asset/resource',
        },
      ],
      // 【修复错误 2】Can't resolve './'
      //   Emscripten 产物里有类似 `require('./' + someVar)` 的动态 require 路径拼接，
      //   Webpack 5 静态分析时找不到所有可能的文件，就会抛 "Module not found: Can't resolve './'"。
      //   同样，浏览器端实际运行时不会走这些分支，但 Webpack 需要我们关闭这个「上下文关键提示」
      //   （unknownContextCritical / exprContextCritical 分别对应动态 require 和表达式 require）
      unknownContextCritical: false,
      exprContextCritical: false,
      // 【注意：之前用 noParse 跳过 ffmpeg-core.js 导致 require 不被转译】
      //   UMD 版 ffmpeg-core.js 内部有 CommonJS 的 require('module')/require('fs') 等调用。
      //   如果启用 noParse → Webpack 不 parse/转译这些 require → 浏览器端 require 全局不存在 → ReferenceError。
      //   现在删除 noParse：虽然 parse 几十 MB 巨无霸 JS 会慢一点，但 require 会被 Webpack 正常转成 __webpack_require__，
      //   配合 resolve.fallback.* = false 让这些 Node 分支 require 到空模块，浏览器端不再报错。
    },
  },
  pages: {
    // 默认的 index 页面
    index: {
      entry: 'src/welcome.ts',          // 入口文件
      template: 'public/index.html', // 使用的 HTML 模板
      filename: 'index.html',        // 打包后生成的文件名
    },
    // 新增一个 admin 页面
    admin: {
      entry: 'src/main.ts',
      template: 'public/admin.html', // 使用自定义的 admin.html 模板
      filename: 'admin.html',
    }
  }
})
