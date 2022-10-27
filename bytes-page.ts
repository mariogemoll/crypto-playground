import { getElement } from './util.js'
import { 
    fromBin, toBin, fromDec, toDec, fromHex, toHex, fromBase64, toBase64, fromAscii, toAscii
} from './bytes.js'

const bin = getElement('textarea#bin')
const dec = getElement('textarea#dec')
const hex = getElement('textarea#hex')
const base64 = getElement('textarea#base64')
const ascii = getElement('textarea#ascii')

let data = new ArrayBuffer(0)

function makeInputHandler(omit: string, f: (s: string) => Promise<ArrayBuffer>) {
    return async function (this: HTMLTextAreaElement, e: Event) {
        try {
            data = await f(this.value)
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
    bin.value = toBin(data)
    }
    if (omit !== 'dec') {
    dec.value = toDec(data)
    }
    if (omit !== 'hex') {
    hex.value = toHex(data)
    }
    if (omit !== 'base64') {
    base64.value = await toBase64(data)
    }
    if (omit !== 'ascii') {
    ascii.value = toAscii(data)
    }
}