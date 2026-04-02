"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Move Up

    const move_up:HTMLDivElement = document.querySelector(".move_up") as HTMLDivElement

    window.addEventListener("scroll", function():void {
        if(this.scrollY >= 1000) {
            move_up.style.opacity = "1"
            move_up.style.visibility = "visible"
        }

        else {
            move_up.style.opacity = "0"
            move_up.style.visibility = "hidden"
        }
    })

    move_up.addEventListener("click", function():void {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    })
})