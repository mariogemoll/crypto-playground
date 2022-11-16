import { fromBase64, toBase64 } from "./bytes.js";
import { fromBase64Url, toBase64Url } from "./base64url.js";

async function exportPrivateKey(privateKey: CryptoKey): Promise<ArrayBuffer> {
    const jwt = await crypto.subtle.exportKey("jwk", privateKey)
    if (jwt.d === undefined) {
        throw new Error("Not a private key")
    }
    return fromBase64(fromBase64Url(jwt.d))
}

async function exportPublicKey(publicKey: CryptoKey): Promise<ArrayBuffer> {
    const exported = await crypto.subtle.exportKey("raw", publicKey)
    return exported.slice(1)
}

const algorithm = {
            name: "ECDH",
            namedCurve: "P-256"
        }

async function importPublicKey(publicKey: ArrayBuffer): Promise<CryptoKey> {
    const input = new ArrayBuffer(65)
    const view = new Uint8Array(input)
    view[0] = 0x04
    view.set(new Uint8Array(publicKey), 1)
    return crypto.subtle.importKey("raw", input, algorithm, true, [])
}

async function importPrivateKey(
    privateKey: ArrayBuffer, publicKey: ArrayBuffer
): Promise<CryptoKey> {
    const x = publicKey.slice(0, 32)
    const y = publicKey.slice(32, 64)
    const jwt = {
        kty: "EC",
        crv: "P-256",
        x: toBase64Url(await toBase64(x)),
        y: toBase64Url(await toBase64(y)),
        d: toBase64Url(await toBase64(privateKey)),
        ext: true
    }
    return crypto.subtle.importKey("jwk", jwt, algorithm, true, ["deriveKey"])
}

export async function generateKeyPair(): Promise<[ArrayBuffer, ArrayBuffer]> {
    const keyPair = await crypto.subtle.generateKey(
        algorithm,
        true,
        ["deriveKey"]
    )
    return Promise.all([
        exportPrivateKey(keyPair.privateKey),
        exportPublicKey(keyPair.publicKey)
    ])
}

export async function deriveAesGcmKey(
    d: ArrayBuffer, xy: ArrayBuffer, counterpartyXy: ArrayBuffer
): Promise<ArrayBuffer> {
    const privateKey = await importPrivateKey(d, xy)
    const counterpartyPublicKey = await importPublicKey(counterpartyXy)
    const key = await crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: counterpartyPublicKey
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
    return crypto.subtle.exportKey('raw', key)
}