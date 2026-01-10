"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Delete Review Warning

    const delete_review_checkbox = document.querySelector("#delete_review")
    const delete_review_image = document.querySelector(".delete_review")
    const form_report = document.querySelector(".form_report")

    delete_review_checkbox.addEventListener("click", function() {
        if(delete_review_checkbox.checked) {
            delete_review_image.style.opacity = 1
            form_report.textContent = "Vaše hodnotenie bude odstránené"
            form_report.classList.add("error")
        }

        else {
            delete_review_image.style.opacity = 0.6
            form_report.textContent = ""
        }
    })
})