import { getElement, getData, writeData, wireUpBinaryDataField, wireUpMaybeTextField } from './util.js'
import { generateKeyPair, sign } from './ecdsa.js'

const generateKeyPairButton = getElement('button#generatekeypair')
const signButton = getElement('button#sign')

const [ privateKeyField, getPrivateKey, writePrivateKey ] = wireUpBinaryDataField('privatekey')
const [ publicKeyField, getPublicKey, writePublicKey ] = wireUpBinaryDataField('publickey')
const [ messageField, getMessage ] = wireUpMaybeTextField('message')
const [ signatureField, getSignature, writeSignature ] = wireUpBinaryDataField('signature')

async function generateNewKeyPair() {
    const [ privateKey, publicKey ] = await generateKeyPair()
    await Promise.all([ writePrivateKey(privateKey), writePublicKey(publicKey) ])
}

generateKeyPairButton.addEventListener('click', generateKeyPair)

signButton.addEventListener('click', async () => {
    try {
        const [ d, xy, message ] = await Promise.all([
            getPrivateKey(), getPublicKey(), getMessage()
        ])
        const signature = await sign(d, xy, message)
        await writeSignature(signature)
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

privateKeyField.value = ''
publicKeyField.value = ''
messageField.value = ''
signatureField.value = ''

generateNewKeyPair()
