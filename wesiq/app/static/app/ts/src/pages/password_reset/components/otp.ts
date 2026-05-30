"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // OTP

    // Variables

    const otp_container:HTMLDivElement = document.querySelector(".otp_container") as HTMLDivElement // Gets OTP Container
    const password_reset_code_input:HTMLInputElement = otp_container.querySelector(".password_reset_code") as HTMLInputElement // Gets Password Reset Code Input
    const otp_inputs:NodeListOf<HTMLInputElement> = otp_container.querySelectorAll<HTMLInputElement>("input[type='text']") // Gets All OTP Inputs

    const password_reset_code:string[]|null = otp_container.dataset["password_reset_code"]?.replace(/\D/g, '').split('').slice(0, otp_inputs.length) || null; // Gets An Array Of The Password Reset Code If Is Available (Cleans The Data And Allows Only Numbers)

    // Initialization

    // OTP
    (otp_inputs[0] as HTMLInputElement).focus() // Sets Focus On The First OTP Input

    otp_inputs.forEach(function(one_input:HTMLInputElement, index:number):void {
        // Auto Fill
        if(password_reset_code && password_reset_code.length === 6) {
            password_reset_code.forEach(function(one_number:string, index:number):void {
                if(otp_inputs[index]) {
                    otp_inputs[index].setAttribute("disabled", "true") // Disables All Filled Inputs
                    otp_inputs[index].classList.add("active") // Adds Active Class To All Filled Inputs
                    otp_inputs[index].value = one_number // Sets Value For Every Filled Input
                }
            })

            const last_filled_index:number = password_reset_code.length > 0 ? password_reset_code.length - 1 : 0 // Gets Last Filled Index
            const focused_index:number = Math.min(last_filled_index + 1, otp_inputs.length - 1); // Gets Focused Index

            (otp_inputs[focused_index] as HTMLInputElement).classList.add("active"); // Adds Active Class To Current Input
            (otp_inputs[focused_index] as HTMLInputElement).removeAttribute("disabled"); // Enables Current Input
            (otp_inputs[focused_index] as HTMLInputElement).focus() // Sets Focus On Current Input
        }

        // Input Functionality
        one_input.addEventListener("input", function():void {
            // Allows Only Numbers
            if(!/^\d$/.test(one_input.value)) {
                one_input.value = ''
                return
            }
        })

        // Key Up Functionalities
        one_input.addEventListener("keyup", function(event:KeyboardEvent):void {
            const current_input:HTMLInputElement = this // Gets Current Input
            const next_input:HTMLInputElement|null = this.nextElementSibling as HTMLInputElement || null // Gets Next Input
            const previous_input:HTMLInputElement|null = this.previousElementSibling as HTMLInputElement || null // Gets Previous Input

            // Next Step
            if(next_input && next_input.hasAttribute("disabled") && current_input.value !== "") {
                current_input.setAttribute("disabled", "true") // Disables Current Input
                next_input.classList.add("active") // Adds Active Class To Next Input
                next_input.removeAttribute("disabled") // Enables Next Input
                next_input.focus() // Sets Focus On Next Input
            }

            // Back Step
            if(event.key === "Backspace") {
                if(previous_input && previous_input.hasAttribute("disabled")) {
                    current_input.setAttribute("disabled", "true") // Disables Current Input
                    current_input.classList.remove("active") // Removes Active Class From Current Input
                    previous_input.removeAttribute("disabled") // Enables Previous Input
                    previous_input.focus() // Sets Focus On Previous Input
                    previous_input.value = "" // Deletes Previous Input Value
                }
            }

            // Final Code
            if(index === otp_inputs.length - 1 && !this.disabled && this.value !== "") {
                otp_inputs.forEach((one_input:HTMLInputElement) => password_reset_code_input.value += one_input.value) // Sets Final Code Value
            }

            else password_reset_code_input.value = "" // Deletes Final Code Value
        })

        // Paste Functionality
        one_input.addEventListener("paste", function(event:ClipboardEvent):void {
            event.preventDefault()

            const pasted_code:string[] = event.clipboardData!.getData('text').replace(/\D/g, '').split('').slice(0, otp_inputs.length) // Gets Array Of Numbers Of Pasted Text

            if(pasted_code.length === 0) return // Do Nothing If Pasted Code Isn't Valid

            pasted_code.forEach(function(one_number:string, index:number):void {
                if(otp_inputs[index]) {
                    otp_inputs[index].setAttribute("disabled", "true") // Disables All Filled Inputs
                    otp_inputs[index].classList.add("active") // Adds Active Class To All Filled Inputs
                    otp_inputs[index].value = one_number // Sets Value For Every Filled Input
                }
            })

            const last_filled_index:number = pasted_code.length > 0 ? pasted_code.length - 1 : 0 // Gets Last Filled Index
            const focused_index:number = Math.min(last_filled_index + 1, otp_inputs.length - 1); // Gets Focused Index

            (otp_inputs[focused_index] as HTMLInputElement).classList.add("active"); // Adds Active Class To Current Input
            (otp_inputs[focused_index] as HTMLInputElement).removeAttribute("disabled"); // Enables Current Input
            (otp_inputs[focused_index] as HTMLInputElement).focus() // Sets Focus On Current Input
        })
    })
})