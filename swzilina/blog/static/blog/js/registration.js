"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Password Verification

    const password = document.querySelector(".password")
    const password_check = document.querySelector(".password_check")
    const form_report = document.querySelector(".form_report")
    
    document.addEventListener("input", function() {
        if(password.value == password_check.value && password.value != "") {
            form_report.textContent = "Heslá sa zhodujú"
            form_report.classList.remove("error")
            form_report.classList.add("success")
        }

        else if(password.value != password_check.value) {
            form_report.textContent = "Heslá sa nezhodujú"
            form_report.classList.remove("success")
            form_report.classList.add("error")
        }

        else {
            form_report.textContent = ""
        }
    })
})