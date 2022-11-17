import {
    getElement, getRadioButtons, DataEncoding, MaybeTextEncoding, getData,
    getMaybeTextData, getDataEncoding, getMaybeTextEncoding, writeData, writeMaybeTextData
} from './util.js'
import { makeBitmapUpdater, makePaint } from './bitmap.js'
import {
    fromDec, toDec, fromHex, toHex, fromBase64, toBase64, fromAscii, toAscii
} from './bytes.js'

const IV_LENGTH = 12

const plaintextEncodingRadioButtons = getRadioButtons('plaintextencoding')
const additionalDataEncodingRadioButtons = getRadioButtons('additionaldataencoding')
const ciphertextEncodingRadioButtons = getRadioButtons('ciphertextencoding')
const plaintext = getElement('textarea#plaintext')
const additionalData = getElement('textarea#additionaldata')
const ciphertext = getElement('textarea#ciphertext')

type KeyEncoding = DataEncoding
type PlaintextEncoding = MaybeTextEncoding
type AdditionalDataEncoding = MaybeTextEncoding
type CiphertextEncoding = DataEncoding

const keyField = getElement('textarea#key') as HTMLTextAreaElement
const keyEncodingRadioButtons = getRadioButtons('keyencoding')

const getKeyEncoding = getDataEncoding.bind(null, 'key', keyEncodingRadioButtons)
const getPlaintextEncoding = getMaybeTextEncoding.bind(null, 'plaintext', plaintextEncodingRadioButtons)
const getAdditionalDataEncoding = getMaybeTextEncoding.bind(null, 'additionaldata', additionalDataEncodingRadioButtons)
const getCiphertextEncoding = getDataEncoding.bind(null, 'ciphertext', ciphertextEncodingRadioButtons)

let plaintextData = new ArrayBuffer(2048)
let plaintextDataLength = 0

const plaintextBitmap: HTMLCanvasElement = getElement('#plaintextbitmap')
const updatePlaintextBitmap = makeBitmapUpdater(plaintextBitmap)
const paintPlaintext = makePaint(plaintextData, plaintextBitmap, 5, updatePlaintextFieldAndBitmap)

function updatePlaintextDataLength(newLength: number) {
    if (newLength != plaintextDataLength) {
        const uints = new Uint8Array(plaintextData)
        plaintextDataLength = newLength
        for (let i = newLength; i < plaintextData.byteLength; i++) {
            uints[i] = 0
        }
    }
}
function updatePlaintextData(newData: ArrayBuffer) {
        const dataUints = new Uint8Array(plaintextData)
        dataUints.set(new Uint8Array(newData))
        for (let i = newData.byteLength; i < plaintextData.byteLength; i++) {
            dataUints[i] = 0
        }
    }

async function updatePlaintextFieldAndBitmap() {
    switch (currentPlaintextEncoding) {
        case 'dec':
            plaintext.value = toDec(plaintextData, plaintextDataLength)
            break
        case 'hex':
            plaintext.value = toHex(plaintextData, plaintextDataLength)
            break
        case 'base64':
            plaintext.value = await toBase64(plaintextData, plaintextDataLength)
            break
        case 'ascii':
            plaintext.value = toAscii(plaintextData, plaintextDataLength)
            break
        default:
            throw new Error(`Invalid plaintext encoding ${currentPlaintextEncoding}`)
    }
    updatePlaintextBitmap(plaintextData)
}

function setPlaintextDataLengthAndPaint(e) {
    if (currentPlaintextEncoding === 'ascii') {
        alert('Please switch to a non-ASCII encoding for the plaintext field first')
        return
    }
    ciphertext.value = ''
    updatePlaintextDataLength(512)
    paintPlaintext(e)
}

plaintext.addEventListener('input', async function () {
    try {
        let newData
        switch (currentPlaintextEncoding) {
            case 'dec':
                newData = fromDec(plaintext.value)
                break
            case 'hex':
                newData = fromHex(plaintext.value)
                break
            case 'base64':
                newData = await fromBase64(plaintext.value)
                break
            case 'ascii':
                newData = fromAscii(plaintext.value)
                break
            default:
                throw new Error(`Invalid plaintext encoding ${currentPlaintextEncoding}`)
        }
        updatePlaintextData(newData)
        updatePlaintextDataLength(newData.byteLength)
        updatePlaintextBitmap(plaintextData)
    } catch (e) {
        alert(e)
    }
})

plaintextBitmap.addEventListener('click', setPlaintextDataLengthAndPaint)

plaintextBitmap.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) {
        setPlaintextDataLengthAndPaint(e)
    }
})

async function generateKey() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt'])
    writeKey(currentKeyEncoding, key)
}

async function readKey(encoding: KeyEncoding): Promise<CryptoKey> {
    const input = await getData(encoding, keyField)
    return crypto.subtle.importKey('raw', input, 'AES-GCM', true, ['encrypt', 'decrypt'])
}

async function writeKey(encoding: KeyEncoding, key: CryptoKey) {
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    return writeData(encoding, keyField, exportedKey)
}

let currentKeyEncoding: KeyEncoding = getKeyEncoding()
let currentPlaintextEncoding: PlaintextEncoding = getPlaintextEncoding()
let currentAdditionalDataEncoding: AdditionalDataEncoding = getAdditionalDataEncoding()
let currentCiphertextEncoding: CiphertextEncoding = getCiphertextEncoding()

const generateKeyButton = getElement('button#buttongeneratekey')

keyEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getKeyEncoding()
    if (newEncoding !== currentKeyEncoding) {
        try {
            await writeKey(newEncoding, await readKey(currentKeyEncoding))
        } catch (e) {
            console.log(e)
            alert(e)
        }
        currentKeyEncoding = newEncoding
    }
}))

plaintextEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getPlaintextEncoding()
    if (newEncoding !== currentPlaintextEncoding) {
        try {
            const plaintextContent = await getMaybeTextData(currentPlaintextEncoding, plaintext)
            await writeMaybeTextData(newEncoding, plaintext, plaintextContent)
            currentPlaintextEncoding = newEncoding
        } catch (e) {
            console.log(e)
            alert(e)
            updatePlaintextFieldAndBitmap()
            for (let i = 0; i < plaintextEncodingRadioButtons.length; i++) {
                if (plaintextEncodingRadioButtons[i].value === currentPlaintextEncoding) {
                    plaintextEncodingRadioButtons[i].checked = true
                    break
                }
            }
        }
    }
}))

ciphertextEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getCiphertextEncoding()
    if (newEncoding !== currentCiphertextEncoding) {
        try {
            const ciphertextContent = await getData(currentCiphertextEncoding, ciphertext)
            writeData(newEncoding, ciphertext, ciphertextContent)
        } catch (e) {
            console.log(e)
            alert(e)
        }
        currentCiphertextEncoding = newEncoding
    }
}))

generateKeyButton.addEventListener('click', generateKey)

async function encrypt() {
    const plaintextBytes = await getMaybeTextData(currentPlaintextEncoding, plaintext)
    const additionalDataBytes = await getMaybeTextData(currentAdditionalDataEncoding, additionalData)
    const key = await readKey(currentKeyEncoding)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    console.log('key', key)
    console.log('plaintext', plaintextBytes)
    console.log('additionalData', additionalDataBytes)
    console.log('iv', iv)
    const ciphertextData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
            additionalData: additionalDataBytes
        },
        key,
        plaintextBytes
    )

    const result = new ArrayBuffer(iv.byteLength + ciphertextData.byteLength)
    const resultView = new Uint8Array(result)
    resultView.set(iv)
    resultView.set(new Uint8Array(ciphertextData), iv.byteLength)
    writeData(currentCiphertextEncoding, ciphertext, result)
}

async function decrypt() {
    const ciphertextBytes = await getData(currentCiphertextEncoding, ciphertext)
    const additionalDataBytes = await getMaybeTextData(currentAdditionalDataEncoding, additionalData)
    const iv = ciphertextBytes.slice(0, IV_LENGTH)
    const ciphertextData = ciphertextBytes.slice(IV_LENGTH)
    const key = await readKey(currentKeyEncoding)
    console.log('key', key)
    console.log('ciphertext', ciphertextData)
    console.log('additionalData', additionalDataBytes)
    console.log('iv', iv)
    const newPlaintextData = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
            additionalData: additionalDataBytes
        },
        key,
        ciphertextData
    )
    updatePlaintextData(newPlaintextData)
    updatePlaintextDataLength(newPlaintextData.byteLength)
    await updatePlaintextFieldAndBitmap()
}


getElement('button#encrypt').addEventListener('click', async function () {
    try {
        await encrypt()
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

getElement('button#decrypt').addEventListener('click', async function () {
    try {
        await decrypt()
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

keyField.value = ''
plaintext.value = ''
additionalData.value = ''
ciphertext.value = ''
generateKey()
