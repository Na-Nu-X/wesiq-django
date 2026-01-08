"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Timer

    const timer = document.querySelector(".timer h3") // Gets Timer's Text From HTML

    // Function For Get Cookie by Its Name
    function getCookie(cookie_name) {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${cookie_name}=`)
        if (parts.length === 2) return parts.pop().split(";")[0]
    }

    const password_reset_timer = parseInt(getCookie("password_reset_timer")) // Time From Cookie Value
    let max_remaining_time = 600000 // 10 Minutes

    // Checks If Cookie Exists
    if(!password_reset_timer) {
        timer.innerText = "Platnosť vypršala!" // Sets Message
        timer.style.fontFamily = "Poppins, Arial, sans-serif"
        timer.style.fontSize = "0.8em"
        timer.style.lineHeight = "1em"
        timer.style.color = "#df3535"
        return
    }

    // Progress Circle
    const progress = document.querySelector(".timer svg .progress")
    const radius = parseInt(progress.getAttribute("r"))
    const circum_ference = 2 * Math.PI * radius // 251.32741228718345
    progress.style.strokeDasharray = circum_ference

    // Timer Interval (100MS)
    let timer_interval = null

    timer_interval = setInterval(function() {
        // Timer's Numbers

        const current_time = Date.now()
        const remaining_time = password_reset_timer - current_time // Remaining Time In MS (Max 600 000)

        let remaining_minutes = Math.floor(((password_reset_timer - current_time) / 1000) / 60)
        let remaining_seconds = Math.floor((password_reset_timer - current_time) / 1000) % 60

        // Checks If There Is Still Some Remaining Time
        if(remaining_time <= 0) {
            timer.innerText = "Platnosť vypršala!" // Sets Message
            timer.style.fontFamily = "Poppins, Arial, sans-serif"
            timer.style.fontSize = "0.8em"
            timer.style.lineHeight = "1em"

            // Stops Timer
            clearInterval(timer_interval)
            timer_interval = null

            return
        }

        // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds
        if(remaining_time <= 1000 * 10) {
            timer.style.color = "#df3535"
        }

        timer.innerText = `${remaining_minutes}:${remaining_seconds.toString().padStart(2, "0")}` // Updates Numbers In Timer

        // Progress Circle

        // Length
        progress.style.strokeDashoffset = circum_ference / max_remaining_time * remaining_time // Updates Progress Circle Length, 600 000 Is Maximum Remaining Time Value In MS (10 Minutes)

        // Color
        const red = 255 - (255 / max_remaining_time * remaining_time) // Increases Red Color In Palette
        const green = 255 / max_remaining_time * remaining_time // Decreases Green Color In Palette

        progress.style.stroke = `rgb(${red}, ${green}, 0)` // Updates Progress Circle Color
        progress.style.filter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
        progress.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
    }, 100)
})