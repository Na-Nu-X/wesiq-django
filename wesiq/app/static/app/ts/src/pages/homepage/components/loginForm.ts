"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Login Form Dialog

    // Variables

    const login_button:HTMLAnchorElement = document.querySelector(".login_button") as HTMLAnchorElement // Gets The Login Button
    const no_logged_in_button:HTMLAnchorElement = document.querySelector(".login") as HTMLAnchorElement // Gets The No Logged In Button
    const login_form_dialog:HTMLDialogElement = document.querySelector(".login_form_dialog") as HTMLDialogElement // Gets The Login Form Dialog
    const login_form:HTMLFormElement = login_form_dialog.querySelector(".login_form") as HTMLFormElement // Gets The Login Form

    // Events

    login_button.addEventListener("click", function():void {
        login_form_dialog.showModal()
    })

    if(no_logged_in_button) {
        no_logged_in_button.addEventListener("click", function():void {
            login_form_dialog.showModal()
        })
    }

    login_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const login_form_dimensions:DOMRect = login_form.getBoundingClientRect()

        if (
            event.clientX < login_form_dimensions.left ||
            event.clientX > login_form_dimensions.right ||
            event.clientY < login_form_dimensions.top ||
            event.clientY > login_form_dimensions.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Login Form Dialog
        }
    })
})