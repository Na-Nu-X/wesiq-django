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

    // Global Event Delegations

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
                break

            default:
                return
        }
    })
})