import { 
    emailVerification,
    showPassword,
    hidePassword
} from "../utils/password.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Login Form

    // Variables

    const login_form_dialog:HTMLDialogElement|null = document.querySelector(".login_form_dialog") as HTMLDialogElement || null // Gets The Login Form Dialog If Is Available
    const login_form:HTMLFormElement = document.querySelector(".login_form") as HTMLFormElement // Gets The Login Form
    const password_container:HTMLDivElement = login_form.querySelector(".password_container") as HTMLDivElement // Gets Password Container
    const password:HTMLInputElement = password_container.querySelector(".password") as HTMLInputElement // Gets Password Input
    const password_reset:HTMLAnchorElement = login_form.querySelector(".password_reset") as HTMLAnchorElement // Gets Password Reset Button
    const email_address:HTMLInputElement = login_form.querySelector(".identifier") as HTMLInputElement // Gets Email Address Input
    const form_report:HTMLParagraphElement = login_form.querySelector(".form_report") as HTMLParagraphElement // Gets Form Report
    const show_hide_password:HTMLButtonElement = password_container.querySelector(".show_hide_password") as HTMLButtonElement // Gets The Toggle Show Hide Password Button

    // Events

    // Show Hide Password Click Functionality
    show_hide_password.addEventListener("click", function():void {
        const icon:HTMLElement = this.querySelector("i") as HTMLElement // Gets The Icon

        if(icon.matches(".fa-eye-slash")) showPassword(icon, password) // Shows The Password
        else if(icon.matches(".fa-eye")) hidePassword(icon, password) // Hides The Password
        if(login_form_dialog) login_form_dialog.showModal() // Shows The Login Form Dialog
    })

    password_reset.addEventListener("click", (event:PointerEvent) => emailVerification(email_address, form_report, event)) // Checks If The Has Entered An E-mail
})