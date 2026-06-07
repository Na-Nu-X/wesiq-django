import { 
    emailVerification,
    showPassword,
    hidePassword
} from "../utils/password.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Login Form

    // Variables

    const password_container:HTMLDivElement = document.querySelector(".login_form .password_container") as HTMLDivElement // Gets Password Container
    const password:HTMLInputElement = password_container.querySelector(".login_form .password") as HTMLInputElement // Gets Password Input
    const password_reset:HTMLAnchorElement = document.querySelector(".login_form .password_reset") as HTMLAnchorElement // Gets Password Reset Button
    const email_address:HTMLInputElement = document.querySelector(".login_form .identifier") as HTMLInputElement // Gets Email Address Input
    const form_report:HTMLParagraphElement = document.querySelector(".login_form .form_report") as HTMLParagraphElement // Gets Form Report

    // Global Event Delegations

    // Password Container Click Functionalities
    password_container.addEventListener("click", function(event:PointerEvent):void {
        if((event.target as HTMLElement).matches(".fa-eye-slash")) showPassword((event.target as HTMLElement), password) // Shows The Password
        else if((event.target as HTMLElement).matches(".fa-eye")) hidePassword((event.target as HTMLElement), password) // Hides The Password
    })

    // Events

    password_reset.addEventListener("click", (event:PointerEvent) => emailVerification(email_address, form_report, event)) // Checks If The Has Entered An E-mail
})