import { getCookie } from "../../../utils/getCookie.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Timer

    // Variables

    const timer:HTMLHeadingElement = document.querySelector(".timer p") as HTMLHeadingElement // Gets Timer's Text From HTML

    const password_reset_timer:number = Number(getCookie("password_reset_timer")) // Time From Cookie Value
    let max_remaining_time:number = 600000 // 10 Minutes

    const progress:HTMLElement = document.querySelector(".timer svg .progress") as HTMLElement
    const radius:number = Number(progress.getAttribute("r"))
    const circum_ference:number = 2 * Math.PI * radius // 251.32741228718345

    // Initialization

    // Checks If Cookie Exists
    if(!password_reset_timer) {
        timer.innerText = gettext("Platnosť vypršala!") // Sets Message
        timer.style.fontFamily = "Poppins, Arial, sans-serif"
        timer.style.fontSize = "0.8em"
        timer.style.lineHeight = "1em"
        timer.style.color = "#df3535"
        return
    }

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