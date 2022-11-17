import { importPrivateKey, importPublicKey, generateKeyPair as generateECKeyPair } from "./ec.js";

const params = {
    name: "ECDH",
    namedCurve: "P-256"
}

export async function deriveAesGcmKey(
    d: ArrayBuffer, xy: ArrayBuffer, counterpartyXy: ArrayBuffer
): Promise<ArrayBuffer> {
    const privateKey = await importPrivateKey(params, [ "deriveKey"], d, xy)
    const counterpartyPublicKey = await importPublicKey(params, counterpartyXy)
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

export const generateKeyPair = generateECKeyPair.bind(null, params, [ "deriveKey" ])
