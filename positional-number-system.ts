
export type PNSFunctions = {
    isValid: (str: string) => boolean
    encode: (num: bigint) => string
    decode: (str: string) => bigint
}

export function positionalNumberSystem(base: bigint, alphabet: string): PNSFunctions {
    if (BigInt(alphabet.length) !== base) {
        throw new Error(
            `Alphabet length is ${alphabet.length}, but base is ${base})`)
    }

    function isValid(str: string): boolean {
        for (let i = 0; i < str.length; i++) {
            if (alphabet.indexOf(str[i]) === -1) {
                return false
            }
        }
        return true
    }

    function encode(num: bigint): string {
        if (num === 0n) {
            return alphabet[0]
        }
        let str = ''
        while (num > 0) {
            const quotient = num / base
            const remainder = num % base
            str = alphabet[Number(remainder)] + str
            num = quotient
        }
        return str
    }

    function decode(str: string): bigint {
        let num = 0n
        for (let i = 0; i < str.length; i++) {
            const char = str[i]
            const index = alphabet.indexOf(char)
            if (index === -1) {
                throw new Error('Invalid character: ' + char)
            }
            num = num * base + BigInt(index)
        }
        return num
    }

    return { isValid, encode, decode }
}