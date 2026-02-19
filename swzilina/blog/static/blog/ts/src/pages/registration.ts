import { 
    passwordVerification,
    showPassword,
    hidePassword,
    copy,
    paste
} from "../utils/password.js"

import { generateKey } from "../utils/generateKey.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const password_container:HTMLDivElement = document.querySelector(".registration_form .password_container") as HTMLDivElement // Gets Password Container
    const password_check_container:HTMLDivElement = document?.querySelector(".registration_form .password_check_container") as HTMLDivElement // Gets Password Check Container

    const password_input:HTMLInputElement = password_container.querySelector(".registration_form .password") as HTMLInputElement // Gets Password Input
    const password_check_input:HTMLInputElement = password_check_container?.querySelector(".registration_form .password_check") as HTMLInputElement // Gets Password Check Input
    
    const form_report:HTMLParagraphElement = document.querySelector(".registration_form .form_report") as HTMLParagraphElement // Gets Form Report

    let copied_password:string|null = null // Default Value For Copied Password
    
    // Password Container Event Listener
    password_container.addEventListener("click", function(event:PointerEvent):void {
        switch(true) {
            // Toggle Show / Hide Password
            case (event.target as HTMLElement).matches(".fa-eye-slash"):
                showPassword((event.target as HTMLElement), password_input)
                break
                
            case (event.target as HTMLElement).matches(".fa-eye"):
                hidePassword((event.target as HTMLElement), password_input)
                break

            // Random Password Generator
            case (event.target as HTMLElement).matches(".fa-key"):
                password_input.value = generateKey(15) // Sets Generated Password To The Password Input
                passwordVerification(password_input, password_check_input, form_report) // Password Verification
                break

            // Copy Password
            case (event.target as HTMLElement).matches(".copy_password"):
                copied_password = copy(password_input) // Copies Value In The Input And Stores It To The Variable
                break

            default:
                return
        }
    })

    // Password Check Container Event Listener
    password_check_container.addEventListener("click", function(event:PointerEvent):void {
        // Paste Password
        if((event.target as HTMLElement).matches(".paste_password")) {
            paste(password_check_input, copied_password) // Paste Password To The Password Check Input
            passwordVerification(password_input, password_check_input, form_report) // Password Verification
        }
    })

    // Password Verification
    password_input.addEventListener("input", function():void {
        passwordVerification(this, password_check_input, form_report)
    })

    password_check_input.addEventListener("input", function():void {
        passwordVerification(password_input, this, form_report)
    })
})