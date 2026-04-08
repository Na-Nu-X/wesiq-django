"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const new_training_plan:HTMLDivElement = document.querySelector(".new_training_plan") as HTMLDivElement // Gets New Training Plan
    const edit_training_plan:HTMLDivElement = document.querySelector(".edit_training_plan") as HTMLDivElement // Gets Edit Training Plan

    const sidebar:HTMLDivElement = document.querySelector(".sidebar") as HTMLDivElement // Gets Sidebar

    const create:HTMLAnchorElement = sidebar.querySelector(".create") as HTMLAnchorElement // Gets Create Button
    const edit:HTMLAnchorElement = sidebar.querySelector(".edit") as HTMLAnchorElement // Gets Edit Button

    const page_url:URL = new URL(window.location.href) // Gets The Current URL Address

    if(page_url.searchParams.has("edit")) {
        edit_training_plan.classList.remove("hidden") // Shows Edit Training Plan
        new_training_plan.classList.add("hidden") // Hides New Training Plan

        create.classList.remove("active") // Removes Active Class From Create Button
        edit.classList.add("active") // Adds Active Class To Edit Button
    }

    else {
        new_training_plan.classList.remove("hidden") // Shows New Training Plan
        edit_training_plan.classList.add("hidden") // Hides Edit Training Plan

        edit.classList.remove("active") // Removes Active Class From Edit Button
        create.classList.add("active") // Adds Active Class To Create Button
    }
})