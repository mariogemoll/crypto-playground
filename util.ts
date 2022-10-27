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