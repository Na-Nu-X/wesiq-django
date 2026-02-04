// Function For Verifying Password Inputs Validity
export function passwordVerification(input_1, input_2, report) {
    if(input_1.value == input_2.value && input_1.value != "") {
        report.textContent = "Heslá sa zhodujú" // Shows Valid Report Message
        report.classList.replace("error", "success") // Adds Success Class
    }

    else if(input_1.value != input_2.value) {
        report.textContent = "Heslá sa nezhodujú" // Shows Invalid Report Message
        report.classList.replace("success", "error") // Adds Error Class
    }

    else {
        report.textContent = "" // Deletes Report Message
    }
}

// Function For Showing Password
export function showPassword(icon, input) {
    icon.classList.replace("fa-eye-slash", "fa-eye") // Shows Open Eye
    icon.title = "Skryť heslo" // Changes Title Attribute
    input.style.webkitTextSecurity = "none" // Shows Password
}

// Function For Hiding Password
export function hidePassword(icon, input) {
    icon.classList.replace("fa-eye", "fa-eye-slash") // Shows Slashed Eye
    icon.title = "Zobraziť heslo" // Changes Title Attribute
    input.style.webkitTextSecurity = "disc" // Hides Password
}

// Function For Copying Value From The Input
export function copy(input) {
    input.select() // Selects Everything In The Input
    return input.value // Returns Copied Value From The Input
}

// Function For Paste Value To The Input
export function paste(input, copied_text=null) {
    input.value = copied_text
}

// Function For Email Verification Before Password Reset
export function emailVerification(input, report, event) {
    if(input.value !== "" && input.value.includes("@") && input.value.includes(".")) {
        report.textContent = ""

        document.cookie = `email_address=${input.value}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    }

    else {
        event.preventDefault()

        report.textContent = "Zadajte váš e-mail"
        report.classList.add("error")
    }
}