import { importPrivateKey, importPublicKey, generateKeyPair as generateECKeyPair } from './ec.js'

const params = {
    name: 'ECDSA',
    namedCurve: 'P-256'
}

export const generateKeyPair = generateECKeyPair.bind(null, params, [ 'sign' ])

export async function sign(d: ArrayBuffer, xy: ArrayBuffer, m: ArrayBuffer): Promise<ArrayBuffer> {
    const privateKey = await importPrivateKey(params, [ 'sign' ], d, xy)
    return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, m)
}

export async function verify(xy: ArrayBuffer, m: ArrayBuffer, s: ArrayBuffer): Promise<boolean> {
    const publicKey = await importPublicKey(params, [ "verify" ], xy)
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, s, m)
}
