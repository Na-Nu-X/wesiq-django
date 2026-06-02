"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const MAX_EMPTY_BADGES:number = 12 // Defines The Amount Of The Maximum Empty Badges

    const SCROLL_STEP:number = 20
    const HOLD_INTERVAL_SPEED:number = 50 // 20-Times Per Second
    const HOLD_START_DELAY:number = 250 // Starts Hold Interval After 250MS Of Hold Time, Everything Above Is Just A Click
    
    const badges_container:HTMLDivElement = document.querySelector(".profile_container .profile .middle .badges_container") as HTMLDivElement // Gets The Badges Container
    const badges:HTMLDivElement = badges_container.querySelector(".badges") as HTMLDivElement // Gets The Badges Container
    const all_badges:NodeListOf<HTMLDivElement> = badges.querySelectorAll<HTMLDivElement>(".badge") // Gets All Badges
    const previous:HTMLDivElement = badges_container.querySelector(".previous") as HTMLDivElement // Gets The Previous Button
    const next:HTMLDivElement = badges_container.querySelector(".next") as HTMLDivElement // Gets The Next Button

    let hold_interval:number|null = null
    let hold_timeout:number|null = null

    // Initialization
    
    if(all_badges.length < 12) {
        const remaining_empty_badges:number = MAX_EMPTY_BADGES - all_badges.length // Gets The Number Of Remaining Empty Badges

        for(let i:number = 0; i < remaining_empty_badges; i++) {
            badges.appendChild(createEmptyBadge()) // Appends The Empty Badge To The Badges
        }
    }

    // Functions

    // Function For Create The Empty Badge
    function createEmptyBadge():HTMLDivElement {
        const badge:HTMLDivElement = document.createElement("div") // Creates The Badge
        badge.classList.add("badge") // Adds The Badge Class
        return badge // Returns The Badge
    }

    // Function For Start Hold Button Event
    function startHold(trigger:() => void) {
        hold_timeout = setTimeout(function() {
            hold_interval = setInterval(function() {
                trigger()
            }, HOLD_INTERVAL_SPEED)
        }, HOLD_START_DELAY)
    }

    // Function For Stop Hold Button Event
    function stopHold():void {
        if(hold_interval && hold_timeout) {
            clearInterval(hold_interval)
            clearTimeout(hold_timeout)
        }
    }

    // Events

    // Scroll To Previous Badges
    previous.addEventListener("click", function():void {
        badges.scrollLeft -= SCROLL_STEP
    })

    previous.addEventListener("pointerdown", function():void {
        startHold(() => badges.scrollLeft -= SCROLL_STEP)
    })

    previous.addEventListener("pointerup", stopHold)
    previous.addEventListener("pointercancel", stopHold)
    previous.addEventListener("pointerleave", stopHold)

    // Scroll To Next Badges
    next.addEventListener("click", function():void {
        badges.scrollLeft += SCROLL_STEP
    })

    next.addEventListener("pointerdown", function():void {
        startHold(() => badges.scrollLeft += SCROLL_STEP)
    })

    next.addEventListener("pointerup", stopHold)
    next.addEventListener("pointercancel", stopHold)
    next.addEventListener("pointerleave", stopHold)
})