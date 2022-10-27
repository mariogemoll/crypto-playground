const decRegex = /^[\d,]*/

export function fromDec(str: string): ArrayBuffer {
    if (str.length === 0) {
        return new ArrayBuffer(0)
    }
    if (!decRegex.test(str)) {
        throw new Error(`Invalid decimal string ${str}`)
    }
    if (str.slice(-1) === ',') {
        str = str.slice(0, -1)
    }
    const segments = str.split(',')
    const bytes = new ArrayBuffer(segments.length)
    const uints = new Uint8Array(bytes)
    for (let i = 0; i < segments.length; i++) {
        let s = segments[i]
        const byte = parseInt(s, 10)
        if (isNaN(byte)) {
            throw new Error(`${s} is not a valid decimal number representation of a byte`)
        }
        if (byte > 255) {
            throw new Error(`${s} is too large to be a byte`)
        }
        uints[i] = byte
    }
    return bytes
}

export function toDec(buf: ArrayBuffer): string {
    const uints = new Uint8Array(buf)
    const bytesInDec: string[] = []
    for (let i = 0; i < uints.length; i++) {
        bytesInDec[i] = uints[i].toString(10)
    }
    return bytesInDec.join(',')
}

export function fromHex(str: string): ArrayBuffer {
    if (str.length % 2 !== 0) {
        throw new Error(`Invalid hex string length ${str.length}`)
    }
    const bytes = new ArrayBuffer(str.length / 2)
    const uints = new Uint8Array(bytes)
    for (let i = 0; i < uints.length; i++) {
        const characterPair = str.slice(i * 2, i * 2 + 2)
        const byte = parseInt(characterPair, 16)
        if (isNaN(byte)) {
            throw new Error(`Invalid character pair ${characterPair}`)
        }
        uints[i] = byte
    }
    return bytes
}

export function toHex(buf: ArrayBuffer): string {
    const uints = new Uint8Array(buf)
    const bytesInHex: string[] = []
    for (let i = 0; i < uints.length; i++) {
        bytesInHex[i] = uints[i].toString(16).padStart(2, '0')
    }
    return bytesInHex.join('')
}

export async function fromBase64(str: string): Promise<ArrayBuffer> {
    const url = "data:application/octet-stream;base64," + str
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        return blob.arrayBuffer()
    } catch (e) {
        console.log(e)
        throw (e)
    }
}

export function toBase64(buf: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {

        const blob = new Blob([buf], { type: 'application/octet-stream' })

        var reader = new FileReader();
        reader.onload = function (event) {
            if (event === null) {
                reject(new Error('No event'))
                return
            }
            if (event.target === null) {
                reject(new Error('No target'))
                return
            }
            const result = event.target.result as string
            // Strip off the "data:application/octet-stream;base64," prefix
            resolve(result.slice(37))
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

export function fromAscii(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length)
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < str.length; i++) {
        const byte = str.charCodeAt(i)
        if (byte > 127) {
            throw new Error(`Invalid ASCII character ${str[i]}`)
        }
        bytes[i] = byte
    }
    return buf
}

export function toAscii(buf: ArrayBuffer): string {
    const uints = new Uint8Array(buf)
    const result: string[] = []
    for (let i = 0; i < uints.length; i++) {
        const byte = uints[i]
        if (byte > 127) {
            throw new Error(`Invalid ASCII value ${byte}`)
        }
        result[i] = String.fromCharCode(byte)
    }
    return result.join('')
}