const importParams: RsaHashedImportParams = {
            name: "RSA-OAEP",
            hash: "SHA-256"
}

const keyGenParams: RsaHashedKeyGenParams = {
    ...importParams,
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1])
}

export async function generateKeyPair(): Promise<[ArrayBuffer, ArrayBuffer]> {
    const keyPair = await window.crypto.subtle.generateKey(
        keyGenParams,
        true,
        ["encrypt", "decrypt"]
    )

    return Promise.all([
        crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
        crypto.subtle.exportKey('spki', keyPair.publicKey)
    ])
}

export async function encrypt(publicKey: ArrayBuffer, m: ArrayBuffer): Promise<ArrayBuffer> {
    const key = await crypto.subtle.importKey('spki', publicKey, importParams, true, ["encrypt"])
    return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, m)
}

export async function decrypt(privateKey: ArrayBuffer, c: ArrayBuffer): Promise<ArrayBuffer> {
    const key = await crypto.subtle.importKey('pkcs8', privateKey, importParams, true, ["decrypt"])
    return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, c)
}
