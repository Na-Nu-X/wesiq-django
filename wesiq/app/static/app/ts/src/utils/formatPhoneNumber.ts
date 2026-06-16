// @ts-ignore
import { AsYouType } from "https://cdn.jsdelivr.net/npm/libphonenumber-js@1.10.44/+esm"

// Function For Format The Phone Number
export function formatPhoneNumber(input:HTMLInputElement, flag:HTMLImageElement, language_input?:HTMLInputElement):void {
    // Phone Number Formatting
    const phone_number_formatter = new AsYouType()
    const formatted_phone_number = phone_number_formatter.input(input.value)

    input.value = formatted_phone_number
    flag.alt = ""

    // Language Flag

    // Slovak
    if(
        input.value[0] === "+" && input.value[1] === "4" && input.value[2] === "2" && input.value[3] === "1") {
        flag.src = "/static/images/sk.png"
        if(language_input) language_input.value = "sk"
    }

    // Czech
    else if(input.value[0] === "+" && input.value[1] === "4" && input.value[2] === "2" && input.value[3] === "0") {
        flag.src = "/static/images/cs.png"
        if(language_input) language_input.value = "cs"
    }

    // English (England & USA)
    else if(
        input.value[0] === "+" && input.value[1] === "4" && input.value[2] === "4" ||
        input.value[0] === "+" && input.value[1] === "1"
    ) {
        flag.src = "/static/images/en.png"
        if(language_input) language_input.value = "en"
    }

    // Spanish
    else if(
        input.value[0] === "+" && input.value[1] === "3" && input.value[2] === "4") {
        flag.src = "/static/images/es.png"
        if(language_input) language_input.value = "es"
    }

    // French
    else if(
        input.value[0] === "+" && input.value[1] === "3" && input.value[2] === "3") {
        flag.src = "/static/images/fr.png"
        if(language_input) language_input.value = "fr"
    }

    // Ukrainian
    else if(
        input.value[0] === "+" && input.value[1] === "3" && input.value[2] === "8" && input.value[3] === "0") {
        flag.src = "/static/images/uk.png"
        if(language_input) language_input.value = "uk"
    }

    // Russian
    else if(
        input.value[0] === "+" && input.value[1] === "7") {
        flag.src = "/static/images/ru.png"
        if(language_input) language_input.value = "ru"
    }

    // Portuguese (Brazil)
    else if(
        input.value[0] === "+" && input.value[1] === "5" && input.value[2] === "5") {
        flag.src = "/static/images/pt-br.png"
        if(language_input) language_input.value = "pt-br"
    }

    // Simplified Chinese
    else if(
        input.value[0] === "+" && input.value[1] === "8" && input.value[2] === "6") {
        flag.src = "/static/images/zh-hans.png"
        if(language_input) language_input.value = "zh-hans"
    }

    else {
        flag.src = ""
        if(language_input) language_input.value = "en"
    }
}