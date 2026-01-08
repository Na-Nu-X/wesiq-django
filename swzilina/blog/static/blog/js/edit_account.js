"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Delete Profile Picture Warning

    const delete_profile_picture_checkbox = document.querySelector("#delete_profile_picture")
    const delete_profile_picture_image = document.querySelector(".delete_profile_picture")
    const form_report = document.querySelector(".form_report")

    delete_profile_picture_checkbox.addEventListener("click", function() {
        if(delete_profile_picture_checkbox.checked) {
            delete_profile_picture_image.style.opacity = 1
            form_report.textContent = "Profilový obrázok bude odstránený"
            form_report.classList.add("error")
        }

        else {
            delete_profile_picture_image.style.opacity = 0.6
            form_report.textContent = ""
        }
    })

    // Delete Account Warning

    const delete_account_checkbox = document.querySelector("#delete_account")
    const delete_account_image = document.querySelector(".delete_account")

    delete_account_checkbox.addEventListener("click", function() {
        if(delete_account_checkbox.checked) {
            delete_account_image.style.opacity = 1
            form_report.textContent = "Váš úcet bude odstránený"
            form_report.classList.add("error")
        }

        else {
            delete_account_image.style.opacity = 0.6
            form_report.textContent = ""
        }
    })

    // Password Reset

    const password_reset = document.querySelector(".password_reset")

    password_reset.addEventListener("click", function() {
        document.cookie = `email_address=${password_reset.dataset.email_address}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    })
})