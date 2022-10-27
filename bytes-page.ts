import { getElement } from './util.js'
import {
    fromBin, toBin, fromDec, toDec, fromHex, toHex, fromBase64, toBase64, fromAscii, toAscii
} from './bytes.js'
import { makeBitmapUpdater, makePaint } from './bitmap.js'

const bin = getElement('textarea#bin')
const dec = getElement('textarea#dec')
const hex = getElement('textarea#hex')
const base64 = getElement('textarea#base64')
const ascii = getElement('textarea#ascii')

const bitmap: HTMLCanvasElement = getElement('#bitmap')
const bitmapCanvasCtx = bitmap.getContext('2d')!

let data = new ArrayBuffer(2048)
let dataLength = 0

function updateDataLength(newLength: number) {
    if (newLength != dataLength) {
        const uints = new Uint8Array(data)
        dataLength = newLength
        for (let i = newLength; i < data.byteLength; i++) {
            uints[i] = 0
        }
    }
}

function makeInputHandler(omit: string, f: (s: string) => Promise<ArrayBuffer>) {
    return async function (this: HTMLTextAreaElement, e: Event) {
        try {
            const newData = await f(this.value)
            const dataUints = new Uint8Array(data)
            dataUints.set(new Uint8Array(newData))
            for (let i = newData.byteLength; i < data.byteLength; i++) {
                dataUints[i] = 0
            }
            updateDataLength(newData.byteLength)
            update(omit)
        } catch (e) {
            console.log(e)
            alert(`Invalid input for encoding ${omit}`)
            update()
        }
    }
}
function asyncify(f: (s: string) => ArrayBuffer) {
    return async function (s: string) {
        return f(s)
    }
}

bin.addEventListener('input', makeInputHandler('bin', asyncify(fromBin)))
dec.addEventListener('input', makeInputHandler('dec', asyncify(fromDec)))
hex.addEventListener('input', makeInputHandler('hex', asyncify(fromHex)))
base64.addEventListener('input', makeInputHandler('base64', fromBase64))
ascii.addEventListener('input', makeInputHandler('ascii', asyncify(fromAscii)))

async function update(omit?: string) {
    if (omit !== 'bin') {
        bin.value = toBin(data, dataLength)
    }
    if (omit !== 'dec') {
        dec.value = toDec(data, dataLength)
    }
    if (omit !== 'hex') {
        hex.value = toHex(data, dataLength)
    }
    if (omit !== 'base64') {
        base64.value = await toBase64(data, dataLength)
    }
    if (omit !== 'ascii') {
        try {
            ascii.value = toAscii(data, dataLength)
        } catch (e) {
            ascii.value = ''
        }
    }
    updateBitmap(data)
}

const updateBitmap = makeBitmapUpdater(bitmapCanvasCtx, 64, 64)
const paint = makePaint(data, bitmap, 5, update)

function setDataLengthAndPaint(e) {
    updateDataLength(512)
    paint(e)
}

bitmap.addEventListener('click', setDataLengthAndPaint)

bitmap.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) {
        setDataLengthAndPaint(e)
    }
})
