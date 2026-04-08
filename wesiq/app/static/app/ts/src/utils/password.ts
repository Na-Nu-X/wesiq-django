// Function For Verifying Password Inputs Validity
export function passwordVerification(input_1:HTMLInputElement, input_2:HTMLInputElement, report:HTMLParagraphElement):void {
    if(input_1.value == input_2.value && input_1.value != "") {
        report.textContent = gettext("Heslá sa zhodujú") // Shows Valid Report Message
        report.classList.replace("error", "success") // Adds Success Class
    }

    else if(input_1.value != input_2.value) {
        report.textContent = gettext("Heslá sa nezhodujú") // Shows Invalid Report Message
        report.classList.replace("success", "error") // Adds Error Class
    }

    else report.textContent = "" // Deletes Report Message
}

// Function For Showing Password
export function showPassword(icon:HTMLElement, input:HTMLInputElement):void {
    icon.classList.replace("fa-eye-slash", "fa-eye") // Shows Open Eye
    icon.title = gettext("Skryť heslo"); // Changes Title Attribute
    (input.style as CSSStyleDeclaration & { webkitTextSecurity?: string }).webkitTextSecurity = "none" // Shows Password (input.style.webkitTextSecurity = "none")
}

// Function For Hiding Password
export function hidePassword(icon:HTMLElement, input:HTMLInputElement):void {
    icon.classList.replace("fa-eye", "fa-eye-slash") // Shows Slashed Eye
    icon.title = gettext("Zobraziť heslo"); // Changes Title Attribute
    (input.style as CSSStyleDeclaration & { webkitTextSecurity?: string }).webkitTextSecurity = "disc" // Hides Password (input.style.webkitTextSecurity = "disc")
}

// Function For Copying Value From The Input
export function copy(input:HTMLInputElement):string {
    input.select() // Selects Everything In The Input
    return input.value // Returns Copied Value From The Input
}

// Function For Paste Value To The Input
export function paste(input:HTMLInputElement, copied_text:string|null = null):void {
    copied_text !== null ? input.value = copied_text : input.value = ""
}

// Function For Email Verification Before Password Reset
export function emailVerification(input:HTMLInputElement, report:HTMLParagraphElement, event:PointerEvent):void {
    if(input.value !== "" && input.value.includes("@") && input.value.includes(".")) {
        report.textContent = ""

        document.cookie = `email_address=${input.value}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    }

    else {
        event.preventDefault()

        report.textContent = gettext("Zadajte váš e-mail")
        report.classList.add("error")
    }
}