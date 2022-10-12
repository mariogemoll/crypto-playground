function getElement(selector) {
    const elOrNil = document.querySelector(selector)
    if (elOrNil === null) {
        throw new Error(`No element found for selector ${selector}`)
    }
    return elOrNil
}

const base16: HTMLInputElement = getElement('#base16')
const base2: HTMLInputElement = getElement('#base2')
const canvas: HTMLCanvasElement = getElement('#canvas')
const canvasCtx = function () {
    const maybeCtx = canvas.getContext('2d')
    if (maybeCtx === null) {
        throw new Error('No canvas conttxt')
    }
    return maybeCtx
}()

function updateCanvas(newVal: bigint) {
    let str = newVal.toString(2)
    if (str.length > 256) {
        throw new Error('Value too large')
    }
    str = str.padStart(256, '0')

    const imageDataBuf = new Uint8ClampedArray(1024)

    for (let row = 0; row < 16; row++) {
        for (let column = 0; column < 16; column++) {
            const bit = str[16 * row + column] === "1"
            const offset = row * 16 * 4 + column * 4
            imageDataBuf[offset + 0] = bit ? 0 : 255 // r
            imageDataBuf[offset + 1] = bit ? 0 : 255 // g
            imageDataBuf[offset + 2] = bit ? 0 : 255 // b
            imageDataBuf[offset + 3] = 255 // a
        }
    }

    const newData = new Uint8ClampedArray(imageDataBuf)
    const newImageData = new ImageData(newData, 16, 16)
    canvasCtx.putImageData(newImageData, 0, 0)
}

base2.addEventListener('input', function (e) {
    let newValStr = base2.value.trim()
    if (newValStr.indexOf("0b") === 0) {
        newValStr = newValStr.slice(2)
    }
    if (newValStr.length > 256) {
        alert('Value too large')
        return
    }
    if (!isBinary(newValStr)) {
        alert('Not binary')
        return
    }
    update(BigInt('0b' + newValStr))
})

base16.addEventListener('input', function (e) {
    let newValStr = base16.value.trim()
    if (newValStr.indexOf("0x") === 0) {
        newValStr = newValStr.slice(2)
    }
    if (newValStr.length % 2 === 1) {
        newValStr = '0' + newValStr
    }
    if (newValStr.length > 64) {
        alert('Value too large')
        return
    }
    if (!isHex(newValStr)) {
        alert('Not hex')
        return
    }
    update(BigInt('0x' + newValStr))
})

function update(newVal: bigint) {
    base16.value = newVal.toString(16)
    base2.value = newVal.toString(2)
    updateCanvas(newVal)
}

// https://stackoverflow.com/a/50868276
const isHex = (maybeHex) =>
    maybeHex.length !== 0 && maybeHex.length % 2 === 0 && !/[^a-fA-F0-9]/u.test(maybeHex)
const fromHexString = (hexString) =>
    Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
const toHexString = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
const isBinary = (maybeBinary) => /^(0|1)*$/u.test(maybeBinary)

document.addEventListener('load', function () {
    update(BigInt(0))
})