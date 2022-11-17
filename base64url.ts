export function toBase64Url(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function fromBase64Url(b64url: string): string {
    let result = b64url.replace(/-/g, '+').replace(/_/g, '/')
    while (result.length % 4 !== 0) {
        result += '='
    }
    return result
}
