import {
    getElement, getRadioButtons, DataEncoding, MaybeTextEncoding, getData, getMaybeTextData,
    getDataEncoding, getMaybeTextEncoding, writeData, writeMaybeTextData
} from './util.js'
import { makeBitmapUpdater, makePaint } from './bitmap.js'
import {
    fromDec, toDec, fromHex, toHex, fromBase64, toBase64, fromAscii, toAscii
} from './bytes.js'

const messageEncodingRadioButtons = getRadioButtons('messageencoding')
const tagEncodingRadioButtons = getRadioButtons('tagencoding')
const messageField = getElement('textarea#message')
const tagField = getElement('textarea#tag')
const verificationResult = getElement('p#verificationresult')

type KeyEncoding = DataEncoding
type MessageEncoding = MaybeTextEncoding
type TagEncoding = DataEncoding

const keyField = getElement('textarea#key') as HTMLTextAreaElement
const keyEncodingRadioButtons = getRadioButtons('keyencoding')

const getKeyEncoding = getDataEncoding.bind(null, 'key', keyEncodingRadioButtons)
const getMessageEncoding = getMaybeTextEncoding.bind(null, 'message', messageEncodingRadioButtons)
const getTagEncoding = getDataEncoding.bind(null, 'tag', tagEncodingRadioButtons)

let data = new ArrayBuffer(2048)
let dataLength = 0

const bitmap: HTMLCanvasElement = getElement('#bitmap')
const updateBitmap = makeBitmapUpdater(bitmap)
const paint = makePaint(data, bitmap, 5, updateMessage)

function setDataLengthAndPaint(e) {
    if (currentMessageEncoding === 'ascii') {
        alert('Please switch to a non-ASCII encoding for the message text field first')
        return
    }
    tagField.value = ''
    updateDataLength(512)
    paint(e)
}

function updateDataLength(newLength: number) {
    if (newLength != dataLength) {
        const uints = new Uint8Array(data)
        dataLength = newLength
        for (let i = newLength; i < data.byteLength; i++) {
            uints[i] = 0
        }
    }
}

messageField.addEventListener('input', async function () {
    try {
        let newData
        switch (currentMessageEncoding) {
            case 'dec':
                newData = fromDec(messageField.value)
                break
            case 'hex':
                newData = fromHex(messageField.value)
                break
            case 'base64':
                newData = await fromBase64(messageField.value)
                break
            case 'ascii':
                newData = fromAscii(messageField.value)
                break
            default:
                throw new Error(`Invalid message encoding ${currentMessageEncoding}`)
        }
        const dataUints = new Uint8Array(data)
        dataUints.set(new Uint8Array(newData))
        for (let i = newData.byteLength; i < data.byteLength; i++) {
            dataUints[i] = 0
        }
        updateDataLength(newData.byteLength)
        updateBitmap(data)
    } catch (e) {
        alert(e)
    }
}
)

bitmap.addEventListener('click', setDataLengthAndPaint)

bitmap.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) {
        setDataLengthAndPaint(e)
    }
})

async function generateKey() {
    const key = await window.crypto.subtle.generateKey(
        {
            name: 'HMAC',
            hash: { name: 'SHA-512' }
        },
        true,
        ['sign', 'verify']
    )
    writeKey(currentKeyEncoding, key)
}

async function readKey(encoding: KeyEncoding): Promise<CryptoKey> {
    const input = await getData(encoding, keyField)
    return crypto.subtle.importKey('raw', input, {
        name: 'HMAC',
        hash: { name: 'SHA-512' }
    }, true, ['sign', 'verify'])
}

async function writeKey(encoding: KeyEncoding, key: CryptoKey) {
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    return writeData(encoding, keyField, exportedKey)
}

let currentKeyEncoding: KeyEncoding = getKeyEncoding()
let currentMessageEncoding: MessageEncoding = getMessageEncoding()
let currentTagEncoding: TagEncoding = getTagEncoding()

const generateKeyButton = getElement('button#buttongeneratekey')

keyEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getKeyEncoding()
    if (newEncoding !== currentKeyEncoding) {
        try {
            await writeKey(newEncoding, await readKey(currentKeyEncoding))
        } catch (e) {
            alert(e)
        }
        currentKeyEncoding = newEncoding
    }
}))
messageEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getMessageEncoding()
    if (newEncoding !== currentMessageEncoding) {
        try {
            const messageContent = await getMaybeTextData(currentMessageEncoding, messageField)
            await writeMaybeTextData(newEncoding, messageField, messageContent)
        } catch (e) {
            alert(e)
        }
        currentMessageEncoding = newEncoding
    }
}))
tagEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getTagEncoding()
    if (newEncoding !== currentTagEncoding) {
        try {
            const tagContent = await getData(currentTagEncoding, tagField)
            writeData(newEncoding, tagField, tagContent)
        } catch (e) {
            alert(e)
        }
        currentTagEncoding = newEncoding
    }
}))

generateKeyButton.addEventListener('click', generateKey)

const signButton = getElement('button#sign')
signButton.addEventListener('click', sign)
async function sign() {
    const message = await getMaybeTextData(currentMessageEncoding, messageField)
    const key = await readKey(currentKeyEncoding)
    const tag = await window.crypto.subtle.sign(
        'HMAC',
        key,
        message
    )
    writeData(currentTagEncoding, tagField, tag)
}

const verifyButton = getElement('button#verify')
verifyButton.addEventListener('click', verify)
async function verify() {
    const message = await getMaybeTextData(currentMessageEncoding, messageField)
    const tag = await getData(currentTagEncoding, tagField)
    const key = await readKey(currentKeyEncoding)
    const ok = await window.crypto.subtle.verify(
        'HMAC',
        key,
        tag,
        message
    )
    verificationResult.textContent = ok ? 'OK' : 'NOT VALID'
}

async function updateMessage() {
    switch (currentMessageEncoding) {
        case 'dec':
            messageField.value = toDec(data, dataLength)
            break
        case 'hex':
            messageField.value = toHex(data, dataLength)
            break
        case 'base64':
            messageField.value = await toBase64(data, dataLength)
            break
        case 'ascii':
            messageField.value = toAscii(data, dataLength)
            break
        default:
            throw new Error(`Invalid message encoding ${currentMessageEncoding}`)
    }
    updateBitmap(data)
}

keyField.value = ''
messageField.value = ''
tagField.value = ''
generateKey()
