"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const sidebar:HTMLDivElement = document.querySelector(".sidebar") as HTMLDivElement // Gets Sidebar

    const create:HTMLAnchorElement = sidebar.querySelector(".create") as HTMLAnchorElement // Gets Create Button
    const edit:HTMLAnchorElement = sidebar.querySelector(".edit") as HTMLAnchorElement // Gets Edit Button

    create.addEventListener("mouseover", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.add("show") // Shows Label
    })

    edit.addEventListener("mouseover", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.add("show") // Shows Label
    })

    create.addEventListener("mouseleave", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.remove("show") // Hides Label
    })

    edit.addEventListener("mouseleave", function():void {
        const label:HTMLSpanElement = this.nextSibling as HTMLSpanElement // Gets Label
        label.classList.remove("show") // Hides Label
    })
})