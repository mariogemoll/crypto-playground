import { getElement, getRadioButtons, getRadioButtonValue } from './util.js'
import { fromDec, toDec, fromHex, toHex, fromBase64, toBase64, fromAscii, toAscii } from './bytes.js'
import { makeBitmapUpdater } from './bitmap.js'

type InputEncoding = 'dec' | 'hex' | 'base64' | 'ascii'
type OutputEncoding = 'dec' | 'hex' | 'base64'
type HashingAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

const input = getElement('textarea#input')
const output = getElement('textarea#output')
const inputEncodingRadioButtons = getRadioButtons('inputencoding')
const outputEncodingRadioButtons = getRadioButtons('outputencoding')
const algorithmRadioButtons = getRadioButtons('algorithm')

const sha1Bitmap: HTMLCanvasElement = getElement('#sha1bitmap')
const sha256Bitmap: HTMLCanvasElement = getElement('#sha256bitmap')
const sha384Bitmap: HTMLCanvasElement = getElement('#sha384bitmap')
const sha512Bitmap: HTMLCanvasElement = getElement('#sha512bitmap')

let currentData = new ArrayBuffer(0)
let currentInputEncoding = getInputEncoding()

input.addEventListener('input', async function () {
    let newData
    try {
        newData = await getData()
    } catch (e) {
        console.log(e)
        alert(`Invalid input for encoding ${currentInputEncoding}`)
        writeInput(currentInputEncoding)
        return
    }
    currentData = newData
    update()
})

algorithmRadioButtons.forEach(x => x.addEventListener('change', update))
outputEncodingRadioButtons.forEach(x => x.addEventListener('change', update))

inputEncodingRadioButtons.forEach(x => addEventListener('change', async e => {
    const newEncoding = getInputEncoding()
    if (newEncoding !== currentInputEncoding) {
        try {
            await writeInput(newEncoding)
        } catch (e) {
            console.log(e)
            currentData = new ArrayBuffer(0)
            input.value = ''
            update()
        }
        currentInputEncoding = newEncoding
    }
}))

function getInputEncoding(): InputEncoding {
    const val = getRadioButtonValue(inputEncodingRadioButtons)
    if (val === 'dec' || val === 'hex' || val === 'base64' || val === 'ascii') {
        return val
    }
    throw new Error(`Invalid input encoding ${val}`)
}

function getAlgorithm(): HashingAlgorithm {
    const val = getRadioButtonValue(algorithmRadioButtons)
    if (val === 'SHA-1' || val === 'SHA-256' || val === 'SHA-384' || val === 'SHA-512') {
        return val
    }
    throw new Error(`Invalid hashing algorithm ${val}`)
}

function getOutputEncoding(): OutputEncoding {
    const val = getRadioButtonValue(outputEncodingRadioButtons)
    if (val === 'dec' || val === 'hex' || val === 'base64') {
        return val
    }
    throw new Error(`Invalid output encoding ${val}`)
}

async function getData(): Promise<ArrayBuffer> {
    switch (currentInputEncoding) {
        case 'dec':
            return fromDec(input.value)
        case 'hex':
            return fromHex(input.value)
        case 'base64':
            return fromBase64(input.value)
        case 'ascii':
            return fromAscii(input.value)
        default:
            throw new Error(`Unknown input encoding ${currentInputEncoding}`)
    }
}

async function writeInput(encoding: InputEncoding) {
    switch (encoding) {
        case 'dec':
            input.value = toDec(currentData)
            break
        case 'hex':
            input.value = toHex(currentData)
            break
        case 'ascii':
            input.value = toAscii(currentData)
            break
        case 'base64':
            input.value = await toBase64(currentData)
            break
        default:
            throw new Error(`Unknown input encoding ${encoding}`)
    }
}

async function update() {
    if (currentData.byteLength === 0) {
        output.value = ''
    }
    try {
        const hash = await crypto.subtle.digest(getAlgorithm(), currentData)
        const outputEncoding = getOutputEncoding()
        switch (getOutputEncoding()) {
            case 'dec':
                output.value = toDec(hash)
                break
            case 'hex':
                output.value = toHex(hash)
                break
            case 'base64':
                output.value = await toBase64(hash)
                break
            default:
                throw new Error(`Unknown output encoding ${outputEncoding}`)
        }
        for (const canvas of [sha1Bitmap, sha256Bitmap, sha384Bitmap, sha512Bitmap]) {
            canvas.style.display = 'none'
        }

        switch (getAlgorithm()) {
            case 'SHA-1':
                updateSha1Bitmap(hash)
                sha1Bitmap.style.display = 'block'
                break
            case 'SHA-256':
                updateSha256Bitmap(hash)
                sha256Bitmap.style.display = 'block'
                break
            case 'SHA-384':
                updateSha384Bitmap(hash)
                sha384Bitmap.style.display = 'block'
                break
            case 'SHA-512':
                updateSha512Bitmap(hash)
                sha512Bitmap.style.display = 'block'
                break
            default:
                throw new Error(`Unknown hashing algorithm ${getAlgorithm()}`)
        }
    } catch (e) {
        alert(e)
        return
    }
}

const updateSha1Bitmap = makeBitmapUpdater(sha1Bitmap)
const updateSha256Bitmap = makeBitmapUpdater(sha256Bitmap)
const updateSha384Bitmap = makeBitmapUpdater(sha384Bitmap)
const updateSha512Bitmap = makeBitmapUpdater(sha512Bitmap)
