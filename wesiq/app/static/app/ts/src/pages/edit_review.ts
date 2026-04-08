"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Delete Review Warning

    const delete_review_checkbox:HTMLInputElement = document.querySelector("#delete_review") as HTMLInputElement
    const delete_review_image:HTMLImageElement = document.querySelector(".delete_review") as HTMLImageElement
    const form_report:HTMLParagraphElement = document.querySelector(".form_report") as HTMLParagraphElement

    delete_review_checkbox.addEventListener("click", function():void {
        if(this.checked) {
            delete_review_image.style.opacity = "1"
            form_report.textContent = gettext("Vaše hodnotenie bude odstránené")
            form_report.classList.add("error")
        }

        else {
            delete_review_image.style.opacity = "0.6"
            form_report.textContent = ""
        }
    })
})