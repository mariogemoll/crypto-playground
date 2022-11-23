import { getElement, wireUpBinaryDataField, wireUpMaybeTextField } from './util.js'
import { generateKeyPair, encrypt, decrypt } from './rsa-oaep.js'

const generateKeyPairButton = getElement('button#generatekeypair')
const encryptButton = getElement('button#encrypt')
const decryptButton = getElement('button#decrypt')

const [ privateKeyField, getPrivateKey, writePrivateKey ] = wireUpBinaryDataField('privatekey')
const [ publicKeyField, , writePublicKey ] = wireUpBinaryDataField('publickey')
const [ encryptPlaintextField, getEncryptPlaintext ] = wireUpMaybeTextField('encryptplaintext')
const [ encryptCiphertextField, , writeEncryptCiphertext ] = wireUpBinaryDataField('encryptciphertext')
const [ counterpartyKeyField, getCounterpartyKey ] = wireUpBinaryDataField('counterpartykey')
const [ decryptCiphertextField, getDecryptCiphertext ] = wireUpBinaryDataField('decryptciphertext')
const [ decryptPlaintextField, , writeDecryptPlaintext ] = wireUpMaybeTextField('decryptplaintext')

async function generateNewKeyPair() {
    const [ privateKey, publicKey ] = await generateKeyPair()
    await Promise.all([ writePrivateKey(privateKey), writePublicKey(publicKey) ])
}

generateKeyPairButton.addEventListener('click', generateNewKeyPair)

encryptButton.addEventListener('click', async () => {
    try {
        const [ plaintext, publicKey ] = await Promise.all([
            getEncryptPlaintext(), getCounterpartyKey()
        ])
        const ciphertext = await encrypt(publicKey, plaintext)
        await writeEncryptCiphertext(ciphertext)
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

decryptButton.addEventListener('click', async () => {
    try {
        const [ privateKey, ciphertext ] = await Promise.all([
            getPrivateKey(), getDecryptCiphertext()
        ])
        const plaintext = await decrypt(privateKey, ciphertext)
        await writeDecryptPlaintext(plaintext)
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

privateKeyField.value = ''
publicKeyField.value = ''
encryptPlaintextField.value = ''
encryptCiphertextField.value = ''
counterpartyKeyField.value = ''
decryptCiphertextField.value = ''
decryptPlaintextField.value = ''

generateNewKeyPair()