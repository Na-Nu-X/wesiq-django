import { 
    passwordVerification,
    showPassword,
    hidePassword,
    copy,
    paste
} from "../utils/password.js"

import { generateKey } from "../utils/generateKey.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    const password_container = document.querySelector(".registration_form .password_container") // Gets Password Container
    const password_check_container = document?.querySelector(".registration_form .password_check_container") // Gets Password Check Container

    const password_input = password_container.querySelector(".registration_form .password") // Gets Password Input
    const password_check_input = password_check_container?.querySelector(".registration_form .password_check") // Gets Password Check Input
    
    const form_report = document.querySelector(".registration_form .form_report") // Gets Form Report

    let copied_password = null // Default Value For Copied Password
    
    // Password Container Event Listener
    password_container.addEventListener("click", function(event) {
        switch(true) {
            // Toggle Show / Hide Password
            case event.target.matches(".fa-eye-slash"):
                showPassword(event.target, password_input)
                break
                
            case event.target.matches(".fa-eye"):
                hidePassword(event.target, password_input)
                break

            // Random Password Generator
            case event.target.matches(".fa-key"):
                password_input.value = generateKey(15) // Sets Generated Password To The Password Input
                passwordVerification(password_input, password_check_input, form_report) // Password Verification
                break

            // Copy Password
            case event.target.matches(".copy_password"):
                copied_password = copy(password_input) // Copies Value In The Input And Stores It To The Variable
                break

            default:
                return
        }
    })

    // Password Check Container Event Listener
    password_check_container.addEventListener("click", function(event) {
        // Paste Password
        if(event.target.matches(".paste_password")) {
            paste(password_check_input, copied_password) // Paste Password To The Password Check Input
            passwordVerification(password_input, password_check_input, form_report) // Password Verification
        }
    })

    // Password Verification
    password_input.addEventListener("input", function() {
        passwordVerification(password_input, password_check_input, form_report)
    })

    password_check_input.addEventListener("input", function() {
        passwordVerification(password_input, password_check_input, form_report)
    })
})