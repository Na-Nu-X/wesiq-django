// @ts-ignore
import { AsYouType, isValidPhoneNumber } from 'https://cdn.jsdelivr.net/npm/libphonenumber-js@1.10.44/+esm'

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
    // Registration Form

    // Variables

    const registration_form:HTMLFormElement = document.querySelector(".registration_form") as HTMLFormElement // Gets Registration Form

    const registration_form_submit:HTMLInputElement = registration_form.querySelector(".registration_form_submit") as HTMLInputElement // Gets Registration Form Submit Button

    const password_container:HTMLDivElement = registration_form.querySelector(".password_container") as HTMLDivElement // Gets Password Container
    const password_check_container:HTMLDivElement = registration_form?.querySelector(".password_check_container") as HTMLDivElement // Gets Password Check Container

    const password_input:HTMLInputElement = password_container.querySelector(".password") as HTMLInputElement // Gets Password Input
    const password_check_input:HTMLInputElement = password_check_container?.querySelector(".password_check") as HTMLInputElement // Gets Password Check Input
    
    const form_report:HTMLParagraphElement = registration_form.querySelector(".form_report") as HTMLParagraphElement // Gets Form Report

    let copied_password:string|null = null // Default Value For Copied Password

    const phone_number_container:HTMLDivElement = registration_form.querySelector(".phone_number_container") as HTMLDivElement // Gets Phone Number Container
    const phone_number:HTMLInputElement = phone_number_container.querySelector(".phone_number") as HTMLInputElement // Gets Phone Number Input
    const language:HTMLInputElement = phone_number_container.querySelector(".language") as HTMLInputElement // Gets Language Input
    const flag:HTMLImageElement = phone_number_container.querySelector(".flag") as HTMLImageElement // Gets Flag Image

    // Events

    // Phone Number Input Functionality
    phone_number.addEventListener("input", function():void {
        // Phone Number Formatting
        const phone_number_formatter = new AsYouType()
        const formatted_phone_number = phone_number_formatter.input(this.value)
        this.value = formatted_phone_number

        // Language Flag

        // Slovak
        if(
            this.value[0] === "+" && this.value[1] === "4" && this.value[2] === "2" && this.value[3] === "1") {
            flag.src = "/static/images/sk.png"
            language.value = "sk"
        }

        // Czech
        else if(this.value[0] === "+" && this.value[1] === "4" && this.value[2] === "2" && this.value[3] === "0") {
            flag.src = "/static/images/cs.png"
            language.value = "cs"
        }

        // English (England & USA)
        else if(
            this.value[0] === "+" && this.value[1] === "4" && this.value[2] === "4" ||
            this.value[0] === "+" && this.value[1] === "1"
        ) {
            flag.src = "/static/images/en.png"
            language.value = "en"
        }

        // Spanish
        else if(
            this.value[0] === "+" && this.value[1] === "3" && this.value[2] === "4") {
            flag.src = "/static/images/es.png"
            language.value = "es"
        }

        // French
        else if(
            this.value[0] === "+" && this.value[1] === "3" && this.value[2] === "3") {
            flag.src = "/static/images/fr.png"
            language.value = "fr"
        }

        // Ukrainian
        else if(
            this.value[0] === "+" && this.value[1] === "3" && this.value[2] === "8" && this.value[3] === "0") {
            flag.src = "/static/images/uk.png"
            language.value = "uk"
        }

        // Russian
        else if(
            this.value[0] === "+" && this.value[1] === "7") {
            flag.src = "/static/images/ru.png"
            language.value = "ru"
        }

        // Portuguese (Brazil)
        else if(
            this.value[0] === "+" && this.value[1] === "5" && this.value[2] === "5") {
            flag.src = "/static/images/pt-br.png"
            language.value = "pt-br"
        }

        // Simplified Chinese
        else if(
            this.value[0] === "+" && this.value[1] === "8" && this.value[2] === "6") {
            flag.src = "/static/images/zh-hans.png"
            language.value = "zh-hans"
        }

        else {
            flag.src = ""
            language.value = "en"
        }
    })

    // Phone Number Blur Functionality
    phone_number.addEventListener("blur", function():void {
        if(!this.value) return
        isValidPhoneNumber(this.value) ? this.style.borderBottomColor = "#52cf20" : this.style.borderBottomColor = "#df3535" // Validates The Phone Number
    })

    // Registration Form Submit Button Click Functionality
    registration_form_submit.addEventListener("click", function(event:PointerEvent):void {
        if(!isValidPhoneNumber(phone_number.value)) event.preventDefault() // Prevents Default Behaviour
    })

    password_input.addEventListener("input", () => passwordVerification(password_input, password_check_input, form_report)) // Verifies The Password)
    password_check_input.addEventListener("input", () => passwordVerification(password_input, password_check_input, form_report)) // Verifies The Password

    // Global Event Delegations
    
    // Password Container Click Functionalities
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
                passwordVerification(password_input, password_check_input, form_report) // Verifies The Password
                break

            // Copy Password
            case (event.target as HTMLElement).matches(".copy_password"):
                copied_password = copy(password_input) // Copies Value In The Input And Stores It To The Variable
                break

            default:
                return
        }
    })

    // Password Check Container Click Functionalities
    password_check_container.addEventListener("click", function(event:PointerEvent):void {
        // Paste Password
        if((event.target as HTMLElement).matches(".paste_password")) {
            paste(password_check_input, copied_password) // Paste Password To The Password Check Input
            passwordVerification(password_input, password_check_input, form_report) // Verifies The Password
        }
    })
})