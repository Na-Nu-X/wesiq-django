import { 
    showPassword,
    hidePassword,
} from "../utils/password.js"

import { getCookie } from "../utils/getCookie.js"
import { generateKey } from "../utils/generateKey.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const password_container:HTMLDivElement = document.querySelector(".password_container") as HTMLDivElement // Gets Password Container
    const password_input:HTMLInputElement = password_container.querySelector(".password") as HTMLInputElement // Gets Password Input

    const otp_container:HTMLDivElement = document.querySelector(".otp_container") as HTMLDivElement // Gets OTP Container
    const password_reset_code_input:HTMLInputElement = otp_container.querySelector(".password_reset_code") as HTMLInputElement // Gets Password Reset Code Input
    const otp_inputs:NodeListOf<HTMLInputElement> = otp_container.querySelectorAll<HTMLInputElement>("input[type='text']") // Gets All OTP Inputs

    const password_reset_code:string[]|null = otp_container.dataset["password_reset_code"]?.replace(/\D/g, '').split('').slice(0, otp_inputs.length) || null; // Gets An Array Of The Password Reset Code If Is Available (Cleans The Data And Allows Only Numbers)

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

        // Keys Functionalities
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

    // Password Container Event Listener
    password_container.addEventListener("click", function(event:PointerEvent):void {
        switch(true) {
            // Toggle Show / Hide Password
            case (event.target as HTMLElement).matches(".fa-eye-slash"):
                showPassword((event.target as HTMLElement), password_input)
                break
                
            case (event.target as HTMLElement).matches(".fa-eye"):
                hidePassword((event.target as HTMLElement), password_input)
                break

            // Random Password Generator
            case (event.target as HTMLElement).matches(".fa-key"):
                password_input.value = generateKey(15) // Sets Generated Password To The Password Input
                break

            default:
                return
        }
    })

    // Timer

    const timer:HTMLHeadingElement = document.querySelector(".timer p") as HTMLHeadingElement // Gets Timer's Text From HTML

    const password_reset_timer:number = Number(getCookie("password_reset_timer")) // Time From Cookie Value
    let max_remaining_time:number = 600000 // 10 Minutes

    // Checks If Cookie Exists
    if(!password_reset_timer) {
        timer.innerText = gettext("Platnosť vypršala!") // Sets Message
        timer.style.fontFamily = "Poppins, Arial, sans-serif"
        timer.style.fontSize = "0.8em"
        timer.style.lineHeight = "1em"
        timer.style.color = "#df3535"
        return
    }

    // Progress Circle
    const progress:HTMLElement = document.querySelector(".timer svg .progress") as HTMLElement
    const radius:number = Number(progress.getAttribute("r"))
    const circum_ference:number = 2 * Math.PI * radius // 251.32741228718345
    progress.style.strokeDasharray = String(circum_ference)

    // Timer Interval (100MS)
    let timer_interval:number|null = null

    timer_interval = setInterval(function():void {
        // Timer's Numbers

        const current_time:number = Date.now()
        const remaining_time:number = password_reset_timer - current_time // Remaining Time In MS (Max 600 000)

        let remaining_minutes:number = Math.floor(((password_reset_timer - current_time) / 1000) / 60)
        let remaining_seconds:number = Math.floor((password_reset_timer - current_time) / 1000) % 60

        // Checks If There Is Still Some Remaining Time
        if(remaining_time <= 0) {
            timer.innerText = gettext("Platnosť vypršala!") // Sets Message
            timer.style.fontFamily = "Poppins, Arial, sans-serif"
            timer.style.fontSize = "0.8em"
            timer.style.lineHeight = "1em"

            // Stops Timer
            if(timer_interval !== null) {
                clearInterval(timer_interval)
                timer_interval = null
            }

            return
        }

        if(remaining_time <= 1000 * 10) timer.style.color = "#df3535" // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds

        timer.innerText = `${remaining_minutes}:${remaining_seconds.toString().padStart(2, "0")}` // Updates Numbers In Timer

        // Progress Circle

        // Length
        progress.style.strokeDashoffset = String(circum_ference / max_remaining_time * remaining_time) // Updates Progress Circle Length, 600 000 Is Maximum Remaining Time Value In MS (10 Minutes)

        // Color
        const red:number = 255 - (255 / max_remaining_time * remaining_time) // Increases Red Color In Palette
        const green:number = 255 / max_remaining_time * remaining_time // Decreases Green Color In Palette

        progress.style.stroke = `rgb(${red}, ${green}, 0)` // Updates Progress Circle Color
        progress.style.filter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
        progress.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
    }, 100)
})