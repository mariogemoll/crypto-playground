import { toSimpleBase64, fromSimpleBase64 } from './simple-base64.js'

const maxVal = 2n ** 256n - 1n

function getElement(selector) {
    const elOrNil = document.querySelector(selector)
    if (elOrNil === null) {
        throw new Error(`No element found for selector ${selector}`)
    }
    return elOrNil
}

const base16: HTMLInputElement = getElement('#base16')
const base10: HTMLInputElement = getElement('#base10')
const base2: HTMLInputElement = getElement('#base2')
const simpleBase64: HTMLInputElement = getElement('#simplebase64')

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
        alert('Value too large')
        return
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

base10.addEventListener('input', function (e) {
    const newNum = parseInt(base10.value)
    if (newNum === NaN) {
        alert('Not a number')
        return
    }
    if (!Number.isInteger(newNum)) {
        alert('Not an integer')
        return
    }
    if (newNum < 0) {
        alert('Stay positive!')
        return
    }
    update(BigInt(newNum))
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

simpleBase64.addEventListener('input', function (e) {
    let newValStr = base16.value.trim()
    // TODO verify
    if (!isSimpleBase64(newValStr)) {
        alert('Not (simple) base64')
        return
    }
    const newVal = fromSimpleBase64(newValStr)
    if (newVal > maxVal) {
        alert('Value too large')
    }
    update(newVal)
})

function update(newVal: bigint) {
    base2.value = newVal.toString(2)
    base10.value = newVal.toString(10)
    base16.value = newVal.toString(16)
    simpleBase64.value = toSimpleBase64(newVal)
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
const isSimpleBase64 = (str: string): boolean => /^([0-9a-zA-Z]|\+|\/)*$/u.test(str)

document.addEventListener('load', function () {
    update(BigInt(0))
})