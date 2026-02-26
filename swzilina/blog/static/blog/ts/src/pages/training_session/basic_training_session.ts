import { 
    startActivity, 
    pauseActivity, 
    stopActivity 
} from "./functions/playback.js"

import { activity_interval } from "./state.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const activity:HTMLDivElement = document.querySelector(".activity") as HTMLDivElement // Gets The Activity Container
    const playback:HTMLDivElement = activity.querySelector(".record_activity") as HTMLDivElement // Gets The Activity Playback
    const play_pause:HTMLAnchorElement = playback.querySelector(".buttons .play") as HTMLAnchorElement // Gets The Play / Pause Button
    const stop:HTMLAnchorElement = playback.querySelector(".buttons .stop") as HTMLAnchorElement // Gets The Stop Button

    // Global Event Delegations

    // Key Down Events
    document.addEventListener("keydown", function(event:KeyboardEvent):void {
        // Playback
        if(event.code === "Space") {
            event.preventDefault() // Stop Scrolling

            activity_interval.interval ? pauseActivity(playback) : startActivity(activity, playback) // Pauses Or Starts Activity
        }

        else if(event.key === "Escape") stopActivity(activity, playback) // Stops Activity
    })

    // Events

    // Play Pause
    play_pause.addEventListener("click", function():void {
        if((this.querySelector("i") as HTMLElement).classList.contains("fa-play")) startActivity(activity, playback) // Starts Activity
        else if((this.querySelector("i") as HTMLElement).classList.contains("fa-pause")) pauseActivity(playback) // Pauses Activity
    })

    // Stop
    stop.addEventListener("click", function():void {
        stopActivity(activity, playback) // Stops Activity
    })
})