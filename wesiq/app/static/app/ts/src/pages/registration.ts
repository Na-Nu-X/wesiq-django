// @ts-ignore
import { isValidPhoneNumber } from "https://cdn.jsdelivr.net/npm/libphonenumber-js@1.10.44/+esm"

import { 
    passwordVerification,
    showPassword,
    hidePassword,
    copy,
    paste
} from "../utils/password.js"

import { generateKey } from "../utils/generateKey.js"
import { formatPhoneNumber } from '../utils/formatPhoneNumber.js'

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Registration Form

    // Variables

    const registration_form_dialog:HTMLDialogElement|null = document.querySelector(".registration_form_dialog") as HTMLDialogElement || null // Gets The Registration Form Dialog If Is Available
    const registration_form:HTMLFormElement = document.querySelector(".registration_form") as HTMLFormElement // Gets Registration Form

    const registration_form_submit:HTMLInputElement = registration_form.querySelector(".registration_form_submit") as HTMLInputElement // Gets Registration Form Submit Button

    const password_container:HTMLDivElement = registration_form.querySelector(".password_container") as HTMLDivElement // Gets Password Container
    const password_check_container:HTMLDivElement = registration_form?.querySelector(".password_check_container") as HTMLDivElement // Gets Password Check Container

    const password_input:HTMLInputElement = password_container.querySelector(".password") as HTMLInputElement // Gets Password Input
    const password_check_input:HTMLInputElement = password_check_container?.querySelector(".password_check") as HTMLInputElement // Gets Password Check Input

    const show_hide_password:HTMLButtonElement = password_container.querySelector(".show_hide_password") as HTMLButtonElement // Gets The Toggle Show Hide Password Button
    const generate_password:HTMLButtonElement = password_container.querySelector(".generate_password") as HTMLButtonElement // Gets The Generate Password Button
    const copy_password:HTMLButtonElement = password_container.querySelector(".copy_password") as HTMLButtonElement // Gets The Copy Password Button
    const paste_password:HTMLButtonElement = password_check_container.querySelector(".paste_password") as HTMLButtonElement // Gets The Paste Password Button
    
    const form_report:HTMLParagraphElement = registration_form.querySelector(".form_report") as HTMLParagraphElement // Gets Form Report

    let copied_password:string|null = null // Default Value For Copied Password

    const phone_number_container:HTMLDivElement = registration_form.querySelector(".phone_number_container") as HTMLDivElement // Gets Phone Number Container
    const phone_number:HTMLInputElement = phone_number_container.querySelector(".phone_number") as HTMLInputElement // Gets Phone Number Input
    const language:HTMLInputElement = phone_number_container.querySelector(".language") as HTMLInputElement // Gets Language Input
    const flag:HTMLImageElement = phone_number_container.querySelector(".flag") as HTMLImageElement // Gets Flag Image

    // Events

    phone_number.addEventListener("input", () => formatPhoneNumber(phone_number, flag, language)) // Formats The Phone Number

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

    // Show Hide Password Click Functionality
    show_hide_password.addEventListener("click", function():void {
        const icon:HTMLElement = this.querySelector("i") as HTMLElement // Gets The Icon
        
        if(icon.matches(".fa-eye-slash")) showPassword(this, password_input) // Shows The Password
        else if(icon.matches(".fa-eye")) hidePassword(this, password_input) // Hides The Password
        if(registration_form_dialog) registration_form_dialog.showModal() // Shows The Registration Form Dialog
    })

    // Generate Password Click Functionality
    generate_password.addEventListener("click", function():void {
        password_input.value = generateKey(15) // Sets Generated Password To The Password Input
        passwordVerification(password_input, password_check_input, form_report) // Verifies The Password
    })

    // Copy Password Click Functionality
    copy_password.addEventListener("click", function():void {
        copied_password = copy(password_input) // Copies Value In The Input And Stores It To The Variable
    })

    // Paste Password Click Functionality
    paste_password.addEventListener("click", function():void {
        paste(password_check_input, copied_password) // Paste Password To The Password Check Input
        passwordVerification(password_input, password_check_input, form_report) // Verifies The Password
    })
})