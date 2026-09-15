const computeFileMD5 = async (file: File): Promise<string> => {
  const { default: md5 } = await import('md5')
  // 小文件(≤4MB)读全部，大文件只读前2MB+后2MB+文件大小，兼顾速度和区分度
  const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB
  const fileSize = file.size

  let combinedBuffer: ArrayBuffer
  if (fileSize <= CHUNK_SIZE * 2) {
    combinedBuffer = await file.arrayBuffer()
  } else {
    const headBlob = file.slice(0, CHUNK_SIZE)
    const tailBlob = file.slice(fileSize - CHUNK_SIZE, fileSize)
    const headBuffer = await headBlob.arrayBuffer()
    const tailBuffer = await tailBlob.arrayBuffer()
    // 拼接 head + fileSize(8字节) + tail
    const combined = new Uint8Array(headBuffer.byteLength + 8 + tailBuffer.byteLength)
    combined.set(new Uint8Array(headBuffer), 0)
    // 将 fileSize 写入中间 8 字节（小端序 uint64）
    const dataView = new DataView(combined.buffer, combined.byteOffset, combined.byteLength)
    let offset = headBuffer.byteLength
    const lo = fileSize % 0x100000000
    const hi = (fileSize - lo) / 0x100000000
    dataView.setUint32(offset, lo, true)
    dataView.setUint32(offset + 4, hi, true)
    offset += 8
    combined.set(new Uint8Array(tailBuffer), offset)
    combinedBuffer = combined.buffer
  }

  const uint8Array = new Uint8Array(combinedBuffer)
  // 用数组收集 + 最后join，避免 O(n²) 字符串拼接
  const chars: string[] = new Array(uint8Array.length)
  for (let i = 0; i < uint8Array.length; i++) {
    chars[i] = String.fromCharCode(uint8Array[i])
  }
  return md5(chars.join(''))
}
export default computeFileMD5