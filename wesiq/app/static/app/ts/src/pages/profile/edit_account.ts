"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const edit_account_form:HTMLFormElement = profile_container.querySelector(".edit_account_form") as HTMLFormElement // Gets The Edir Account Form
    const profile:HTMLDivElement = profile_container.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const toggle_settings:HTMLElement = profile_container.querySelector(".fa-gear") as HTMLElement // Gets The Toggle Settings Icon

    toggle_settings.addEventListener("click", function():void {
        if(edit_account_form.classList.contains("hidden")) {
            profile.classList.add("hidden")
            edit_account_form.classList.remove("hidden")
        }

        else if(profile.classList.contains("hidden")) {
            edit_account_form.classList.add("hidden")
            profile.classList.remove("hidden")
        }
    })

    // Delete Profile Picture Warning

    const delete_profile_picture_checkbox:HTMLInputElement = document.querySelector("#delete_profile_picture") as HTMLInputElement
    const delete_profile_picture_image:HTMLImageElement = document.querySelector(".delete_profile_picture") as HTMLImageElement
    const form_report:HTMLParagraphElement = document.querySelector(".form_report") as HTMLParagraphElement

    delete_profile_picture_checkbox.addEventListener("click", function():void {
        if(this.checked) {
            delete_profile_picture_image.style.opacity = "1"
            form_report.textContent = gettext("Profilový obrázok bude odstránený")
            form_report.classList.add("error")
        }

        else {
            delete_profile_picture_image.style.opacity = "0.6"
            form_report.textContent = ""
        }
    })

    // Delete Account Warning

    const delete_account_checkbox:HTMLInputElement = document.querySelector("#delete_account") as HTMLInputElement
    const delete_account_image:HTMLImageElement = document.querySelector(".delete_account") as HTMLImageElement

    delete_account_checkbox.addEventListener("click", function():void {
        if(this.checked) {
            delete_account_image.style.opacity = "1"
            form_report.textContent = gettext("Váš úcet bude odstránený")
            form_report.classList.add("error")
        }

        else {
            delete_account_image.style.opacity = "0.6"
            form_report.textContent = ""
        }
    })

    // Password Reset

    const password_reset:HTMLAnchorElement = document.querySelector(".password_reset") as HTMLAnchorElement

    password_reset.addEventListener("click", function():void {
        document.cookie = `email_address=${this.dataset["email_address"]}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    })
})