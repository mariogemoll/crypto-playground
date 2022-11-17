import { getElement, getData, writeData, wireUpBinaryDataField, wireUpMaybeTextField } from './util.js'
import { generateKeyPair, sign, verify } from './ecdsa.js'

const generateKeyPairButton = getElement('button#generatekeypair')
const signButton = getElement('button#sign')
const verifyButton = getElement('button#verify')

const [ privateKeyField, getPrivateKey, writePrivateKey ] = wireUpBinaryDataField('privatekey')
const [ publicKeyField, getPublicKey, writePublicKey ] = wireUpBinaryDataField('publickey')
const [ messageField, getMessage ] = wireUpMaybeTextField('message')
const [ signatureField, , writeSignature ] = wireUpBinaryDataField('signature')
const [ counterpartyKeyField, getCounterpartyKey ] = wireUpBinaryDataField('counterpartykey')
const [ receivedMessageField, getReceivedMessage ] = wireUpMaybeTextField('receivedmessage')
const [ receivedSignatureField, getReceivedSignature ] = wireUpBinaryDataField('receivedsignature')

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

verifyButton.addEventListener('click', async () => {
    try {
        const [ xy, message, signature ] = await Promise.all([
            getCounterpartyKey(), getReceivedMessage(), getReceivedSignature()
        ])
        const result = await verify(xy, message, signature)
        alert(result)
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

privateKeyField.value = ''
publicKeyField.value = ''
messageField.value = ''
signatureField.value = ''
counterpartyKeyField.value = ''
receivedMessageField.value = ''
receivedSignatureField.value = ''

generateNewKeyPair()
