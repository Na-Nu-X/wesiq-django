"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Delete Profile Picture Warning

    const delete_profile_picture_checkbox:HTMLInputElement = document.querySelector("#delete_profile_picture") as HTMLInputElement
    const delete_profile_picture_image:HTMLImageElement = document.querySelector(".delete_profile_picture") as HTMLImageElement
    const form_report:HTMLParagraphElement = document.querySelector(".form_report") as HTMLParagraphElement

    delete_profile_picture_checkbox.addEventListener("click", function():void {
        if(delete_profile_picture_checkbox.checked) {
            delete_profile_picture_image.style.opacity = "1"
            form_report.textContent = "Profilový obrázok bude odstránený"
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
        if(delete_account_checkbox.checked) {
            delete_account_image.style.opacity = "1"
            form_report.textContent = "Váš úcet bude odstránený"
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
        document.cookie = `email_address=${password_reset.dataset.email_address}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    })
})