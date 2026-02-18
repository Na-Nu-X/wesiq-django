import { showPassword, hidePassword, } from "../utils/password.js";
import { getCookie } from "../utils/getCookie.js";
import { generateKey } from "../utils/generateKey.js";
"use strict";
document.addEventListener("DOMContentLoaded", function () {
    const password_container = document.querySelector(".password_container"); // Gets Password Container
    const password_input = password_container.querySelector(".password"); // Gets Password Input
    // Password Container Event Listener
    password_container.addEventListener("click", function (event) {
        switch (true) {
            // Toggle Show / Hide Password
            case event.target.matches(".fa-eye-slash"):
                showPassword(event.target, password_input);
                break;
            case event.target.matches(".fa-eye"):
                hidePassword(event.target, password_input);
                break;
            // Random Password Generator
            case event.target.matches(".fa-key"):
                password_input.value = generateKey(15); // Sets Generated Password To The Password Input
                break;
            default:
                return;
        }
    });
    // Timer
    const timer = document.querySelector(".timer h3"); // Gets Timer's Text From HTML
    const password_reset_timer = Number(getCookie("password_reset_timer")); // Time From Cookie Value
    let max_remaining_time = 600000; // 10 Minutes
    // Checks If Cookie Exists
    if (!password_reset_timer) {
        timer.innerText = "Platnosť vypršala!"; // Sets Message
        timer.style.fontFamily = "Poppins, Arial, sans-serif";
        timer.style.fontSize = "0.8em";
        timer.style.lineHeight = "1em";
        timer.style.color = "#df3535";
        return;
    }
    // Progress Circle
    const progress = document.querySelector(".timer svg .progress");
    const radius = Number(progress.getAttribute("r"));
    const circum_ference = 2 * Math.PI * radius; // 251.32741228718345
    progress.style.strokeDasharray = String(circum_ference);
    // Timer Interval (100MS)
    let timer_interval = null;
    timer_interval = setInterval(function () {
        // Timer's Numbers
        const current_time = Date.now();
        const remaining_time = password_reset_timer - current_time; // Remaining Time In MS (Max 600 000)
        let remaining_minutes = Math.floor(((password_reset_timer - current_time) / 1000) / 60);
        let remaining_seconds = Math.floor((password_reset_timer - current_time) / 1000) % 60;
        // Checks If There Is Still Some Remaining Time
        if (remaining_time <= 0) {
            timer.innerText = "Platnosť vypršala!"; // Sets Message
            timer.style.fontFamily = "Poppins, Arial, sans-serif";
            timer.style.fontSize = "0.8em";
            timer.style.lineHeight = "1em";
            // Stops Timer
            if (timer_interval !== null) {
                clearInterval(timer_interval);
                timer_interval = null;
            }
            return;
        }
        if (remaining_time <= 1000 * 10)
            timer.style.color = "#df3535"; // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds
        timer.innerText = `${remaining_minutes}:${remaining_seconds.toString().padStart(2, "0")}`; // Updates Numbers In Timer
        // Progress Circle
        // Length
        progress.style.strokeDashoffset = String(circum_ference / max_remaining_time * remaining_time); // Updates Progress Circle Length, 600 000 Is Maximum Remaining Time Value In MS (10 Minutes)
        // Color
        const red = 255 - (255 / max_remaining_time * remaining_time); // Increases Red Color In Palette
        const green = 255 / max_remaining_time * remaining_time; // Decreases Green Color In Palette
        progress.style.stroke = `rgb(${red}, ${green}, 0)`; // Updates Progress Circle Color
        progress.style.filter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))`; // Updates Progress Circle Shadow Color
        progress.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))`; // Updates Progress Circle Shadow Color
    }, 100);
});
//# sourceMappingURL=password_reset.js.map