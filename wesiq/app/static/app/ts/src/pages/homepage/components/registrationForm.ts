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