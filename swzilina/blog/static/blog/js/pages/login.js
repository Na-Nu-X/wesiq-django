import { 
    emailVerification,
    showPassword,
    hidePassword
} from "../utils/password.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    const password_container = document.querySelector(".login_form .password_container") // Gets Password Container
    const password = password_container.querySelector(".login_form .password") // Gets Password Input

    const password_reset = document.querySelector(".login_form .password_reset") // Gets Password Reset Button
    const email_address = document.querySelector(".login_form .email_address") // Gets Email Address Input

    const form_report = document.querySelector(".login_form .form_report") // Gets Form Report

    // Password Container Event Listener
    password_container.addEventListener("click", function(event) {
        // Toggle Show / Hide Password
        if(event.target.matches(".fa-eye-slash")) {
            showPassword(event.target, password)
        }

        else if(event.target.matches(".fa-eye")) {
            hidePassword(event.target, password)
        }
    })

    // Password Reset
    password_reset.addEventListener("click", function(event) {
        emailVerification(email_address, form_report, event) // Checks If User Type An E-mail
    })
})