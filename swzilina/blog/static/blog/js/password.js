"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Toggle Show / Hide Password

    const password_input = document.querySelector(".password")
    const show_password = document.querySelector(".fa-eye-slash")
    const hide_password = document.querySelector(".fa-eye")

    show_password.addEventListener("click", function() {
        show_password.style.display = "none"
        hide_password.style.display = "block"

        password_input.style.webkitTextSecurity = "none"
    })

    hide_password.addEventListener("click", function() {
        hide_password.style.display = "none"
        show_password.style.display = "block"

        password_input.style.webkitTextSecurity = "disc"
    })

    // Random Password Generator
    
    const generate_password = document.querySelector(".fa-key")

    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const special_chars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', ';', ':', "'", '"', ',', '.', '<', '>', '/', '?', '\\', '|', '`', '~']

    generate_password.addEventListener("click", function() {
        function shuffleString(string) {
            let array = string.split("")

            for(let i = array.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]
            }

            return array.join("");
        }

        let generated_password = ""

        for(let x = 0; x < 5; x++) {
            generated_password = generated_password + alphabet[Math.floor(Math.random() * alphabet.length)] + numbers[Math.floor(Math.random() * numbers.length)] + special_chars[Math.floor(Math.random() * special_chars.length)]
        }

        password_input.value = shuffleString(generated_password)
    })

    // Copy Password To Clipboard

    const copy_password = document.querySelector(".copy_password")

    copy_password.addEventListener("click", function() {
        password_input.select()
        password_input.setSelectionRange(0, password_input.value.length)
        document.execCommand("copy")
        // navigator.clipboard.writeText(password.value) // Only HTTPS
    })

    // Paste From Clipboard

    const password_check_input = document.querySelector(".password_check")
    const paste_password = document.querySelector(".paste_password")

    paste_password.addEventListener("click", function() {
        // password_check_input.value = navigator.clipboard.readText() // Only HTTPS
        password_check_input.value = password_input.value
    })
})