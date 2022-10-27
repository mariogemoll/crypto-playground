export function makeBitmapUpdater(bitmap: HTMLCanvasElement) {
    if (bitmap.width % 8 !== 0) {
        throw new Error('width must be a multiple of 8')
    }
    const bytesPerRow = bitmap.width / 8

    const ctx = bitmap.getContext('2d')
    if (ctx === null) {
        throw new Error('No canvas context')
    }

    return function updateBitmap(data: ArrayBuffer) {
        const uints = new Uint8Array(data)
        const imageDataBuf = new Uint8ClampedArray(bitmap.width * bitmap.height * 4)
        for (let row = 0; row < bitmap.height; row++) {
            for (let byteInRow = 0; byteInRow < bytesPerRow; byteInRow++) {
                const byteIdx = row * bytesPerRow + byteInRow
                let byte = uints[byteIdx]
                if (byte === undefined) {
                    byte = 0
                }
                for (let bitInByte = 0; bitInByte < 8; bitInByte++) {
                    const bit = (byte >> (7 - bitInByte)) & 1
                    const offset = (row * bitmap.width + byteInRow * 8 + bitInByte) * 4
                    imageDataBuf[offset + 0] = bit ? 0 : 255 // r
                    imageDataBuf[offset + 1] = bit ? 0 : 255 // g
                    imageDataBuf[offset + 2] = bit ? 0 : 255 // b
                    imageDataBuf[offset + 3] = 255 // a
                }
            }
        }
        const newImageData = new ImageData(imageDataBuf, bitmap.width, bitmap.height)
        ctx.putImageData(newImageData, 0, 0)
    }
}

export function makePaint(
    val: ArrayBuffer, bitmap: HTMLCanvasElement, magnification: number, update: () => void) {
    const uints = new Uint8Array(val)
    if (bitmap.width % 8 !== 0) {
        throw new Error('bitmap width must be a multiple of 8')
    }
    const bytesPerRow = bitmap.width / 8
    return function paint(e: MouseEvent) {
        const rect = bitmap.getBoundingClientRect()
        const x = Math.round((e.clientX - rect.left) / magnification)
        const y = Math.round((e.clientY - rect.top) / magnification)
        const byteIdx = y * bytesPerRow + Math.floor(x / 8)
        const currentByte = uints[byteIdx]
        let newByte
        if (e.ctrlKey) {
            newByte = currentByte & ~(1 << (7 - (x % 8)))
        } else {
            newByte = currentByte | (1 << (7 - (x % 8)))
        }
        if (newByte !== currentByte) {
            uints[byteIdx] = newByte
            update()
        }
    }
}