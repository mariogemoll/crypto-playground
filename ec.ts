import { fromBase64, toBase64 } from './bytes.js'
import { fromBase64Url, toBase64Url } from './base64url.js'

async function exportPrivateKey(privateKey: CryptoKey): Promise<ArrayBuffer> {
    const jwt = await crypto.subtle.exportKey('jwk', privateKey)
    if (jwt.d === undefined) {
        throw new Error('Not a private key')
    }
    return fromBase64(fromBase64Url(jwt.d))
}

async function exportPublicKey(publicKey: CryptoKey): Promise<ArrayBuffer> {
    const exported = await crypto.subtle.exportKey('raw', publicKey)
    return exported.slice(1)
}

export async function importPublicKey(params: EcKeyImportParams, publicKey: ArrayBuffer): Promise<CryptoKey> {
    const input = new ArrayBuffer(65)
    const view = new Uint8Array(input)
    view[0] = 0x04
    view.set(new Uint8Array(publicKey), 1)
    return crypto.subtle.importKey('raw', input, params, true, [])
}

export async function importPrivateKey(
    params: EcKeyImportParams, usages: KeyUsage[], privateKey: ArrayBuffer, publicKey: ArrayBuffer
): Promise<CryptoKey> {
    const vals = await Promise.all([ 
        toBase64(publicKey.slice(0, 32)),
        toBase64(publicKey.slice(32, 64)),
        toBase64(privateKey)
    ])
    const [ x, y, d ] = vals.map(toBase64Url)
    const jwt = { kty: 'EC', crv: 'P-256', x, y, d, ext: true }
    return crypto.subtle.importKey('jwk', jwt, params, true, usages)
}

export async function generateKeyPair(params: EcKeyGenParams, keyUsages: KeyUsage[]): Promise<[ArrayBuffer, ArrayBuffer]> {
    const keyPair = await crypto.subtle.generateKey(params, true, keyUsages)
    return Promise.all([
        exportPrivateKey(keyPair.privateKey),
        exportPublicKey(keyPair.publicKey)
    ])
}
