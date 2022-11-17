import { getElement, getData, writeData, wireUpBinaryDataField } from './util.js'
import { generateKeyPair as generateECDHKeyPair, deriveAesGcmKey } from './ecdh.js'

const generateKeyPairButton = getElement('button#generatekeypair')
const deriveKeyButton = getElement('button#derivekey')

const [ privateKeyField, getPrivateKey, writePrivateKey ] = wireUpBinaryDataField('privatekey')
const [ publicKeyField, getPublicKey, writePublicKey ] = wireUpBinaryDataField('publickey')
const [ counterpartyKeyField, getCounterpartyKey ] = wireUpBinaryDataField('counterpartykey')
const [ keyField, , writeKey ] = wireUpBinaryDataField('key')

async function generateKeyPair() {
    const [ privateKey, publicKey ] = await generateECDHKeyPair()
    await Promise.all([ writePrivateKey(privateKey), writePublicKey(publicKey) ])
}

generateKeyPairButton.addEventListener('click', generateKeyPair)

deriveKeyButton.addEventListener('click', async () => {
    try {
        const [ d, xy, counterpartyXy ] = await Promise.all([
            getPrivateKey(), getPublicKey(), getCounterpartyKey()
        ])
        const key = await deriveAesGcmKey(d, xy, counterpartyXy)
        await writeKey(key)
    } catch (e) {
        console.log(e)
        alert(e)
    }
})

privateKeyField.value = ''
publicKeyField.value = ''
counterpartyKeyField.value = ''
keyField.value = ''

generateKeyPair()
