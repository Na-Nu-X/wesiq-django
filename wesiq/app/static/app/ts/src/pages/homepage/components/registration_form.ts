"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Registration Form

    // Variables
    
    const registration_button:HTMLAnchorElement = document.querySelector(".registration_button") as HTMLAnchorElement // Gets The Registration Button
    const registration_form_dialog:HTMLDialogElement = document.querySelector(".registration_form_dialog") as HTMLDialogElement // Gets The Registration Form Dialog
    const registration_form:HTMLFormElement = registration_form_dialog.querySelector(".registration_form") as HTMLFormElement // Gets The Registration Form

    // Events

    // Registration Button Click Functionality
    registration_button.addEventListener("click", function():void {
        registration_form_dialog.showModal() // Shows The Registration Form Dialog
    })

    // Switch To Login Click Functionality (Swaps The Dialogs Instead Of Opening The Login Page)
    const switch_to_login:HTMLAnchorElement|null = registration_form.querySelector(".switch_to_login")
    const login_form_dialog:HTMLDialogElement|null = document.querySelector(".login_form_dialog")

    if(switch_to_login && login_form_dialog) {
        switch_to_login.addEventListener("click", function(event:PointerEvent):void {
            event.preventDefault() // Stays On The Homepage
            registration_form_dialog.close() // Closes The Registration Form Dialog
            login_form_dialog.showModal() // Shows The Login Form Dialog
        })
    }

    // Registration Form Dialog Click Functionality
    registration_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const registration_form_rect:DOMRect = registration_form.getBoundingClientRect() // Gets The Registration Form Rect

        if (
            event.clientX < registration_form_rect.left ||
            event.clientX > registration_form_rect.right ||
            event.clientY < registration_form_rect.top ||
            event.clientY > registration_form_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Registration Form Dialog
        }
    })
})