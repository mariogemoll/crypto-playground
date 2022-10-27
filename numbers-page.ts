import { positionalNumberSystem as pns, PNSFunctions } from "./positional-number-system.js"
import { getElement } from "./util.js"
import { makeBitmapUpdater, makePaint } from "./bitmap.js"

const nBase32 = pns(32n, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567')
const nBase58 = pns(58n, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')
const nBase64 = pns(64n, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')

const maxVal = 2n ** 256n - 1n

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

const base16Field: HTMLInputElement = getElement('#base16')
const base10Field: HTMLInputElement = getElement('#base10')
const base2Field: HTMLInputElement = getElement('#base2')
const nBase32Field: HTMLInputElement = getElement('#nbase32')
const nBase58Field: HTMLInputElement = getElement('#nbase58')
const nBase64Field: HTMLInputElement = getElement('#nbase64')

const bitmap: HTMLCanvasElement = getElement('#bitmap')

const paint = makePaint(val.buffer, bitmap, 10, update)

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

const updateBitmap = makeBitmapUpdater(bitmapCanvasCtx, 16, 16)

base2Field.addEventListener('input', function (e) {
    let newValStr = base2Field.value.trim()
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

base10Field.addEventListener('input', function (e) {
    const newNum = parseInt(base10Field.value)
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

base16Field.addEventListener('input', function (e) {
    let newValStr = base16Field.value.trim()
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

function addEventListenerForNBaseField(field: HTMLInputElement, sys: PNSFunctions, label: string) {
    field.addEventListener('input', () => {
        let newValStr = field.value.trim()
        if (!sys.isValid(newValStr)) {
            alert(`Not a valid ${label} value`)
            update()
            return
        }
        const newVal = sys.decode(newValStr)
        if (newVal > maxVal) {
            alert('Value too large')
            update()
            return
        }
        updateWithNumber(newVal)
    })
}

addEventListenerForNBaseField(nBase32Field, nBase32, 'nBase32')
addEventListenerForNBaseField(nBase58Field, nBase58, 'nBase58')
addEventListenerForNBaseField(nBase64Field, nBase64, 'nBase64')

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
    base2Field.value = newVal.toString(2)
    base10Field.value = newVal.toString(10)
    base16Field.value = newVal.toString(16)
    nBase32Field.value = nBase32.encode(newVal)
    nBase58Field.value = nBase58.encode(newVal)
    nBase64Field.value = nBase64.encode(newVal)
    updateBitmap(val.buffer)
}

// https://stackoverflow.com/a/50868276
const isHex = (maybeHex) =>
    maybeHex.length !== 0 && maybeHex.length % 2 === 0 && !/[^a-fA-F0-9]/u.test(maybeHex)
const isBinary = (maybeBinary) => /^(0|1)*$/u.test(maybeBinary)

document.addEventListener('load', function () {
    updateWithNumber(BigInt(0))
})