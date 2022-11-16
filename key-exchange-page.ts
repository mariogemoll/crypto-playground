import { getElement, getData, writeData, wireUpBinaryDataField } from './util.js'
import { generateKeyPair as generateECDHKeyPair, deriveAesGcmKey } from './ecdh.js'

const privateKeyField = getElement('textarea#privatekey')
const publicKeyField = getElement('textarea#publickey')
const counterpartyKeyField = getElement('textarea#counterpartykey')
const keyField = getElement('textarea#key')
const generateKeyPairButton = getElement('button#generatekeypair')
const deriveKeyButton = getElement('button#derivekey')

const getPrivateKeyEncoding = wireUpBinaryDataField(privateKeyField, 'privatekey')
const getPublicKeyEncoding = wireUpBinaryDataField(publicKeyField, 'publickey')
const getCounterpartyKeyEncoding = wireUpBinaryDataField(counterpartyKeyField, 'counterpartykey')
const getKeyEncoding = wireUpBinaryDataField(keyField, 'key')

async function generateKeyPair() {
    const [ privateKey, publicKey ] = await generateECDHKeyPair()
    writeData(getPrivateKeyEncoding(), privateKeyField, privateKey)
    writeData(getPublicKeyEncoding(), publicKeyField, publicKey)
}

generateKeyPairButton.addEventListener('click', generateKeyPair)

deriveKeyButton.addEventListener('click', async () => {
    try {
        const d = await getData(getPrivateKeyEncoding(), privateKeyField)
        const xy = await getData(getPublicKeyEncoding(), publicKeyField)
        const counterpartyXY = await getData(getCounterpartyKeyEncoding(), counterpartyKeyField)
        const key = await deriveAesGcmKey(d, xy, counterpartyXY)
        await writeData(getKeyEncoding(), keyField, key)
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
