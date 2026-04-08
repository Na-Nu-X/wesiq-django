"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Preloader
    
    window.addEventListener("load", function():void {
        const preloader:HTMLSpanElement = document.querySelector(".preloader") as HTMLSpanElement
        preloader.classList.add("hidden")
    })
})