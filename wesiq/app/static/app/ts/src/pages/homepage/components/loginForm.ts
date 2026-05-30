"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Login Form

    // Variables

    const login_button:HTMLAnchorElement = document.querySelector(".login_button") as HTMLAnchorElement // Gets The Login Button
    const no_logged_in_button:HTMLAnchorElement = document.querySelector(".login") as HTMLAnchorElement // Gets The No Logged In Button
    const login_form_dialog:HTMLDialogElement = document.querySelector(".login_form_dialog") as HTMLDialogElement // Gets The Login Form Dialog
    const login_form:HTMLFormElement = login_form_dialog.querySelector(".login_form") as HTMLFormElement // Gets The Login Form

    // Events

    // Login Button Click Functionality
    login_button.addEventListener("click", function():void {
        login_form_dialog.showModal() // Shows The Login Form Dialog
    })

    // No Logged In Button Click Functionality
    if(no_logged_in_button) {
        no_logged_in_button.addEventListener("click", function():void {
            login_form_dialog.showModal() // Shows The Login Form Dialog
        })
    }

    // Login Form Dialog Click Functionality
    login_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const login_form_rect:DOMRect = login_form.getBoundingClientRect() // Gets The Login Form Rect

        if (
            event.clientX < login_form_rect.left ||
            event.clientX > login_form_rect.right ||
            event.clientY < login_form_rect.top ||
            event.clientY > login_form_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Login Form Dialog
        }
    })
})