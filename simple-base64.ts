const letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';

export function toSimpleBase64(num: bigint): string {
    if (num === 0n) {
        return '0'
    }
    let str = ''
    while (num > 0) {
        const quotient = num / 64n
        const remainder = num % 64n
        str = letters[Number(remainder)] + str
        num = quotient
    }
    return str
}

export function fromSimpleBase64(str: string): bigint {
    let num = 0n
    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        const index = letters.indexOf(char)
        if (index === -1) {
            throw new Error('Invalid character: ' + char)
        }
        num = num * 64n + BigInt(index)
    }
    return num
}
