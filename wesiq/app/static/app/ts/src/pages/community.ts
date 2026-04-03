"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const search_bar_container:HTMLDivElement = document.querySelector(".search_bar_container") as HTMLDivElement // Gets Search Bar Container
    const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input

    const all_users_container:HTMLDivElement = document.querySelector(".all_users") as HTMLDivElement // Gets The All Users Container
    const all_users:NodeListOf<HTMLAnchorElement> = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users

    all_users.length <= 3 ? all_users_container.style.overflowY = "hidden" : all_users_container.style.overflowY = "auto" // Shows Scrollbar Based On The Amount Of Users

    // Search Bar Input Functionalities
    search_bar.addEventListener("input", function():void {
        all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Users

        // Gets Unmatched Users
        const filtered_users:HTMLAnchorElement[] = [...all_users].filter(function(one_user:HTMLAnchorElement):boolean {
            return !(one_user.querySelector(".user_name") as HTMLParagraphElement).textContent.toLowerCase().includes(search_bar.value.toLowerCase())
        })

        filtered_users.forEach(one_user => one_user.classList.add("hidden")) // Hides Unmatched Users
    })
})