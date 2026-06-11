import { 
    showPassword,
    hidePassword,
} from "../../../utils/password.js"

import { generateKey } from "../../../utils/generateKey.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Password

    // Variables

    const password_container:HTMLDivElement = document.querySelector(".password_container") as HTMLDivElement // Gets Password Container
    const password_input:HTMLInputElement = password_container.querySelector(".password") as HTMLInputElement // Gets Password Input
    const show_hide_password:HTMLButtonElement = password_container.querySelector(".show_hide_password") as HTMLButtonElement // Gets The Toggle Show Hide Password Button
    const generate_password:HTMLButtonElement = password_container.querySelector(".generate_password") as HTMLButtonElement // Gets The Generate Password Button

    // Events

    // Show Hide Password Click Functionality
    show_hide_password.addEventListener("click", function():void {
        const icon:HTMLElement = this.querySelector("i") as HTMLElement // Gets The Icon
        
        if(icon.matches(".fa-eye-slash")) showPassword(icon, password_input) // Shows The Password
        else if(icon.matches(".fa-eye")) hidePassword(icon, password_input) // Hides The Password
    })

    // Generate Password Click Functionality
    generate_password.addEventListener("click", function():void {
        password_input.value = generateKey(15) // Sets Generated Password To The Password Input
    })
})