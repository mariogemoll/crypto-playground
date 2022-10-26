import { toSimpleBase64, fromSimpleBase64 } from './simple-base64.js'

const maxVal = 2n ** 256n - 1n
console.log('abc 1')
const val = new Uint8Array(32)

function valAsNumber(): bigint {
    const uints = new Uint8Array(val)
    const strings: string[] = []
    for (let i = 0; i < 32; i++) {
        const num = uints[i]
        const str = num.toString(2)
        const padded = str.padStart(8, '0')
        strings.push(padded)
    }
    return BigInt('0b' + strings.join(''))
}

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

const bitmap: HTMLCanvasElement = getElement('#bitmap')

function paint(e: MouseEvent) {
        const rect = bitmap.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) / 10)
        const y = Math.floor((e.clientY - rect.top) / 10)
        const byteIdx = y * 2 + Math.floor(x / 8)
        const currentByte = val[byteIdx]
        let newByte
        if (e.ctrlKey) {
            newByte = currentByte & ~(1 << (7 - (x % 8)))
        } else {
            newByte = currentByte | (1 << (7 - (x % 8)))
        }
        if (newByte !== currentByte) {
            val[byteIdx] = newByte
            update()
        }
}

bitmap.addEventListener('click', paint)

bitmap.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) {
        paint(e)
    }
})

const bitmapCanvasCtx = function () {
    const maybeCtx = bitmap.getContext('2d')
    if (maybeCtx === null) {
        throw new Error('No canvas context')
    }
    return maybeCtx
}()

function updateBitmap() {
    const imageDataBuf = new Uint8ClampedArray(1024)
    for (let row = 0; row < 16; row++) {
        let rowStr = '' + row + ' '
        for (let byteInRow = 0; byteInRow < 2; byteInRow++) {
            rowStr += val[row * 2 + byteInRow] + ' '
            for (let bitInByte = 0; bitInByte < 8; bitInByte++) {
                const bit = (val[row * 2 + byteInRow] >> (7 - bitInByte)) & 1
                const offset = (row * 16 + byteInRow * 8 + bitInByte) * 4
                imageDataBuf[offset + 0] = bit ? 0 : 255 // r
                imageDataBuf[offset + 1] = bit ? 0 : 255 // g
                imageDataBuf[offset + 2] = bit ? 0 : 255 // b
                imageDataBuf[offset + 3] = 255 // a
            }
        }
    }
    const newImageData = new ImageData(imageDataBuf, 16, 16)
    bitmapCanvasCtx.putImageData(newImageData, 0, 0)
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
    updateWithNumber(BigInt('0b' + newValStr))
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
    updateWithNumber(BigInt(newNum))
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
    updateWithNumber(BigInt('0x' + newValStr))
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
    updateWithNumber(newVal)
})

function add(val: bigint) {
    updateWithNumber(valAsNumber() + val)
}

function subtract(val: bigint) {
    updateWithNumber(valAsNumber() - val)
}

function multiply(multiplier: bigint) {
    updateWithNumber(valAsNumber() * multiplier)
}

function divide(divisor: bigint) {
    updateWithNumber(valAsNumber() / divisor)
}

getElement('#just0').addEventListener('click', () => updateWithNumber(0n))
getElement('#just1').addEventListener('click', () => updateWithNumber(1n))
getElement('#just2').addEventListener('click', () => updateWithNumber(2n))
getElement('#just10').addEventListener('click', () => updateWithNumber(10n))
getElement('#just16').addEventListener('click', () => updateWithNumber(16n))
getElement('#just32').addEventListener('click', () => updateWithNumber(32n))
getElement('#just64').addEventListener('click', () => updateWithNumber(64n))
getElement('#plus1').addEventListener('click', () => add(1n))
getElement('#plus2').addEventListener('click', () => add(2n))
getElement('#plus10').addEventListener('click', () => add(10n))
getElement('#plus16').addEventListener('click', () => add(16n))
getElement('#plus32').addEventListener('click', () => add(32n))
getElement('#plus64').addEventListener('click', () => add(64n))
getElement('#minus1').addEventListener('click', () => subtract(1n))
getElement('#minus2').addEventListener('click', () => subtract(2n))
getElement('#minus10').addEventListener('click', () => subtract(10n))
getElement('#minus16').addEventListener('click', () => subtract(16n))
getElement('#minus32').addEventListener('click', () => subtract(32n))
getElement('#minus64').addEventListener('click', () => subtract(64n))
getElement('#times2').addEventListener('click', () => multiply(2n))
getElement('#times10').addEventListener('click', () => multiply(10n))
getElement('#times16').addEventListener('click', () => multiply(16n))
getElement('#times32').addEventListener('click', () => multiply(32n))
getElement('#times64').addEventListener('click', () => multiply(64n))
getElement('#divide2').addEventListener('click', () => divide(2n))
getElement('#divide10').addEventListener('click', () => divide(10n))
getElement('#divide16').addEventListener('click', () => divide(16n))
getElement('#divide32').addEventListener('click', () => divide(32n))
getElement('#divide64').addEventListener('click', () => divide(64n))

function updateWithNumber(newVal: bigint) {
    if (newVal > maxVal) {
        newVal = newVal % (maxVal + 1n)
    }
    let str = newVal.toString(2)
    str = str.padStart(256, '0')
    for (let i = 0; i < 32; i++) {
        let byte = 0
        for (let j = 0; j < 8; j++) {
            if (str[i * 8 + j] === "1") {
                const num = 1 << (7 - j)
                byte |= num
            }
        }
        val[i] = byte
    }
    update()
}

function update() {
    const newVal = valAsNumber()
    base2.value = newVal.toString(2)
    base10.value = newVal.toString(10)
    base16.value = newVal.toString(16)
    simpleBase64.value = toSimpleBase64(newVal)
    updateBitmap()
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
    updateWithNumber(BigInt(0))
})