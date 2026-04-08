import { 
    emailVerification,
    showPassword,
    hidePassword
} from "../utils/password.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const password_container:HTMLDivElement = document.querySelector(".login_form .password_container") as HTMLDivElement // Gets Password Container
    const password:HTMLInputElement = password_container.querySelector(".login_form .password") as HTMLInputElement // Gets Password Input

    const password_reset:HTMLAnchorElement = document.querySelector(".login_form .password_reset") as HTMLAnchorElement // Gets Password Reset Button
    const email_address:HTMLInputElement = document.querySelector(".login_form .email_address") as HTMLInputElement // Gets Email Address Input

    const form_report:HTMLParagraphElement = document.querySelector(".login_form .form_report") as HTMLParagraphElement // Gets Form Report

    // Password Container Event Listener
    password_container.addEventListener("click", function(event:PointerEvent):void {
        // Toggle Show / Hide Password
        if((event.target as HTMLElement).matches(".fa-eye-slash")) showPassword((event.target as HTMLElement), password)
        else if((event.target as HTMLElement).matches(".fa-eye")) hidePassword((event.target as HTMLElement), password)
    })

    // Password Reset
    password_reset.addEventListener("click", function(event:PointerEvent):void {
        emailVerification(email_address, form_report, event) // Checks If User Type An E-mail
    })
})