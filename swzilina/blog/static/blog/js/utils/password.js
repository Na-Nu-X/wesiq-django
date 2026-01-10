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

// Function For Shuffle String
export function shuffleString(string) {
    let array = string.split("") // Creates An Array From A String

    // Shuffles Array
    for(let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }

    return array.join("") // Converts An Array Back To A String
}

// Function For Generating Random Password
export function generatePassword() {
    // Possible Characters
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const special_chars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', ';', ':', "'", '"', ',', '.', '<', '>', '/', '?', '\\', '|', '`', '~']

    let generated_password = "" // Sets Generated Password To An Empty String

    // Creates Random 15 Characters Long Password (5 Letters, 5 Numbers, 5 Characters)
    for(let i = 0; i < 5; i++) {
        generated_password = generated_password + alphabet[Math.floor(Math.random() * alphabet.length)] + numbers[Math.floor(Math.random() * numbers.length)] + special_chars[Math.floor(Math.random() * special_chars.length)] // Generates Pattern Of Letter, Number, Character
    }

    return shuffleString(generated_password) // Returns Shuffled Generated Password Value
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