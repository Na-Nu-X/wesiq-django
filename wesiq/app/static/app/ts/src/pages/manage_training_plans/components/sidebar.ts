"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Sidebar

    // Variables

    const sidebar:HTMLDivElement = document.querySelector(".sidebar") as HTMLDivElement // Gets Sidebar
    const create:HTMLAnchorElement = sidebar.querySelector(".create") as HTMLAnchorElement // Gets Create Button
    const edit:HTMLAnchorElement = sidebar.querySelector(".edit") as HTMLAnchorElement // Gets Edit Button

    // Events

    // Create Button Mouse Over Functionality
    create.addEventListener("mouseover", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.add("show") // Shows Label
    })

    // Create Button Mouse Leave Functionality
    create.addEventListener("mouseleave", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.remove("show") // Hides Label
    })

    // Edit Button Mouse Over Functionality
    edit.addEventListener("mouseover", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.add("show") // Shows Label
    })

    // Edit Button Mouse Leave Functionality
    edit.addEventListener("mouseleave", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.remove("show") // Hides Label
    })
})