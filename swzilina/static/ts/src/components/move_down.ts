"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Move Down

    const move_down:HTMLDivElement = document.querySelector(".move_down") as HTMLDivElement
    const navigation_bar:HTMLElement = document.querySelector(".navigation_bar") as HTMLElement

    move_down.addEventListener("click", function():void {
        window.scrollTo({
            top: window.innerHeight - navigation_bar.offsetHeight,
            behavior: "smooth"
        })
    })

    window.addEventListener("scroll", function():void {
        if(this.scrollY > 0) {
            move_down.style.opacity = "0"
            move_down.style.visibility = "hidden"
        }

        else {
            move_down.style.opacity = "1"
            move_down.style.visibility = "visible"
        }
    })
})