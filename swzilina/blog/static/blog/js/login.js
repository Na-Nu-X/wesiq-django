"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Password Reset

    const password_reset = document.querySelector(".password_reset")
    const email_address = document.querySelector(".email_address")
    const form_report = document.querySelector(".form_report")

    password_reset.addEventListener("click", function() {
        if(email_address.value !== "" && email_address.value.includes("@") && email_address.value.includes(".")) {
            form_report.textContent = ""

            document.cookie = `email_address=${email_address.value}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

            document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
        }

        else {
            event.preventDefault()

            form_report.textContent = "Zadajte váš e-mail"
            form_report.classList.add("error")
        }
    })
})