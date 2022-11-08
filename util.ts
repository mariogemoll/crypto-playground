import { fromDec, toDec, fromHex, toHex, fromBase64, toBase64, fromAscii, toAscii } from './bytes.js'

export function getElement(selector) {
    const elOrNil = document.querySelector(selector)
    if (elOrNil === null) {
        throw new Error(`No element found for selector ${selector}`)
    }
    return elOrNil
}

export function getRadioButtons(name: string): NodeListOf<HTMLInputElement> {
    return document.querySelectorAll(`input[type="radio"][name="${name}"]`)
}

export function getRadioButtonValue(radioButtons: NodeListOf<HTMLInputElement>): string {
    let val: string | undefined
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            val = radioButton.value
            break
        }
    }
    if (val === undefined) {
        throw new Error('No radio button selected')
    }
    return val
}

export type DataEncoding = 'dec' | 'hex' | 'base64'
export type MaybeTextEncoding = DataEncoding | 'ascii'

export function getDataEncoding(label: string, radioButtons: NodeListOf<HTMLInputElement>): DataEncoding {
    const val = getRadioButtonValue(radioButtons)
    if (val === 'dec' || val === 'hex' || val === 'base64') {
        return val
    }
    throw new Error(`Invalid ${label} encoding ${val}`)
}

export function getMaybeTextEncoding(label: string, radioButtons: NodeListOf<HTMLInputElement>): MaybeTextEncoding {
    const val = getRadioButtonValue(radioButtons)
    if (val === 'dec' || val === 'hex' || val === 'base64' || val === 'ascii') {
        return val
    }
    throw new Error(`Invalid ${label} encoding ${val}`)
}

export async function getData(encoding: DataEncoding, el: HTMLInputElement | HTMLTextAreaElement): Promise<ArrayBuffer> {
    switch (encoding) {
        case 'dec':
            return fromDec(el.value)
        case 'hex':
            return fromHex(el.value)
        case 'base64':
            return fromBase64(el.value)
        default:
            throw new Error(`Invalid encoding "${encoding}"`)
    }
}

export async function getMaybeTextData(encoding: MaybeTextEncoding, el: HTMLInputElement | HTMLTextAreaElement
): Promise<ArrayBuffer> {
    switch (encoding) {
        case 'dec':
            return fromDec(el.value)
        case 'hex':
            return fromHex(el.value)
        case 'base64':
            return fromBase64(el.value)
        case 'ascii':
            return fromAscii(el.value)
        default:
            throw new Error(`Invalid encoding "${encoding}"`)
    }
}

export async function writeData(encoding: DataEncoding, el: HTMLInputElement | HTMLTextAreaElement,
    data: ArrayBuffer) {
    switch (encoding) {
        case 'dec':
            el.value = toDec(data)
            break
        case 'hex':
            el.value = toHex(data)
            break
        case 'base64':
            el.value = await toBase64(data)
            break
        default:
            throw new Error(`Invalid encoding "${encoding}"`)
    }
}

export async function writeMaybeTextData(encoding: MaybeTextEncoding,
    el: HTMLInputElement | HTMLTextAreaElement, data: ArrayBuffer) {
    switch (encoding) {
        case 'dec':
            el.value = toDec(data)
            break
        case 'hex':
            el.value = toHex(data)
            break
        case 'base64':
            el.value = await toBase64(data)
            break
        case 'ascii':
            el.value = toAscii(data)
            break
        default:
            throw new Error(`Invalid encoding "${encoding}"`)
    }
}