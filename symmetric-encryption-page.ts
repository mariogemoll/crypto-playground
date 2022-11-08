import {
    getElement, getRadioButtons, DataEncoding, MaybeTextEncoding, getData,
    getMaybeTextData, getDataEncoding, getMaybeTextEncoding, writeData, writeMaybeTextData
} from './util.js'

const plaintextEncodingRadioButtons = getRadioButtons('plaintextencoding')
const ciphertextEncodingRadioButtons = getRadioButtons('ciphertextencoding')
const plaintext = getElement('textarea#plaintext')
const ciphertext = getElement('textarea#ciphertext')

type KeyEncoding = DataEncoding
type PlaintextEncoding = MaybeTextEncoding
type CiphertextEncoding = DataEncoding

const keyField = getElement('textarea#key') as HTMLTextAreaElement
const keyEncodingRadioButtons = getRadioButtons('keyencoding')

const getKeyEncoding = getDataEncoding.bind(null, 'key', keyEncodingRadioButtons)
const getPlaintextEncoding = getMaybeTextEncoding.bind(null, 'plaintext', plaintextEncodingRadioButtons)
const getCiphertextEncoding = getDataEncoding.bind(null, 'ciphertext', ciphertextEncodingRadioButtons)

async function generateKey() {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt'])

    writeKey(currentKeyEncoding, key)
    plaintext.value = ''
    ciphertext.value = ''
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
let currentCiphertextEncoding: CiphertextEncoding = getCiphertextEncoding()

const generateKeyButton = getElement('button#buttongeneratekey')

keyEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getKeyEncoding()
    if (newEncoding !== currentKeyEncoding) {
        try {
            await writeKey(newEncoding, await readKey(currentKeyEncoding))
        } catch (e) {
            console.log(e)
        }
        currentKeyEncoding = newEncoding
    }
}))
plaintextEncodingRadioButtons.forEach(x => x.addEventListener('change', async () => {
    const newEncoding = getPlaintextEncoding()
    console.log('current', currentPlaintextEncoding, 'new', newEncoding)
    if (newEncoding !== currentPlaintextEncoding) {
        try {
            const plaintextContent = await getMaybeTextData(currentPlaintextEncoding, plaintext)
            writeMaybeTextData(newEncoding, plaintext, plaintextContent)
        } catch (e) {
            console.log(e)
        }
        currentPlaintextEncoding = newEncoding
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
        }
        currentCiphertextEncoding = newEncoding
    }
}))

generateKeyButton.addEventListener('click', generateKey)

async function encrypt() {
    const input = await getMaybeTextData(currentPlaintextEncoding, plaintext)
    const key = await readKey(currentKeyEncoding)
    const iv = crypto.getRandomValues(new Uint8Array(16))
    const ciphertextData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        input
    )

    const result = new ArrayBuffer(iv.byteLength + ciphertextData.byteLength)
    const resultView = new Uint8Array(result)
    resultView.set(iv)
    resultView.set(new Uint8Array(ciphertextData), iv.byteLength)
    writeData(currentCiphertextEncoding, ciphertext, result)
}

async function decrypt() {
    const input = await getData(currentCiphertextEncoding, ciphertext)
    const iv = input.slice(0, 16)
    const ciphertextData = input.slice(16)
    const plaintextContent = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        await readKey(currentKeyEncoding),
        ciphertextData
    )
    writeMaybeTextData(currentPlaintextEncoding, plaintext, plaintextContent)
}


plaintext.addEventListener('input', async function () {
    try {
        await encrypt()
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

ciphertext.addEventListener('input', async function () {
    try {
        await decrypt()
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

keyField.value = ''
plaintext.value = ''
ciphertext.value = ''
generateKey()
