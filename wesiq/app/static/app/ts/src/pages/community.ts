import { sendPOST } from "../services/sendPOST.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const search_bar_container:HTMLDivElement = document.querySelector(".search_bar_container") as HTMLDivElement // Gets Search Bar Container
    const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input
    const delete_search_bar:HTMLElement = search_bar_container.querySelector(".fa-xmark") as HTMLElement // Gets The Delete Search Bar Icon

    const all_users_container:HTMLDivElement = document.querySelector(".all_users") as HTMLDivElement // Gets The All Users Container
    const all_users:NodeListOf<HTMLDivElement> = all_users_container.querySelectorAll<HTMLDivElement>(".one_user") // Gets All Users

    all_users.length <= 3 ? all_users_container.style.overflowY = "hidden" : all_users_container.style.overflowY = "auto" // Shows Scrollbar Based On The Amount Of Users

    // Search Bar Input Functionalities
    search_bar.addEventListener("input", function():void {
        all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Users

        // Gets Unmatched Users
        const filtered_users:HTMLDivElement[] = [...all_users].filter(function(one_user:HTMLDivElement):boolean {
            return (
                !(one_user.querySelector(".user_name") as HTMLParagraphElement).textContent.toLowerCase().includes(search_bar.value.toLowerCase()) && // Filters By User Name
                !(one_user.dataset["friend_code"]!.includes(search_bar.value)) // Filters By Friend Code
            )
        })

        filtered_users.forEach(one_user => one_user.classList.add("hidden")) // Hides Unmatched Users
    })

    // Delete Search Bar Icon Click Functionality
    delete_search_bar.addEventListener("click", function():void {
        search_bar.value = "" // Deletes Search Bar Value
        all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Users
    })

    all_users_container.addEventListener("click", function(event:PointerEvent):void {
        // Follow
        if((event.target as HTMLElement).classList.contains("fa-user-plus")) {
            const clicked_user_id:string = ((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"] || "" // Gets Clicked User ID

            sendPOST(`/follow/${clicked_user_id}/`); // Sends Clicked User ID As A POST Data To Follow Page
            (event.target as HTMLElement).classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon

            const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

            followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
        }

        // Unfollow
        else if((event.target as HTMLElement).classList.contains("fa-user-minus")) {
            const clicked_user_id:string = ((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"] || "" // Gets Clicked User ID

            sendPOST(`/unfollow/${clicked_user_id}/`); // Sends Clicked User ID As A POST Data To Unfollow Page
            (event.target as HTMLElement).classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon

            const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

            followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
        }
    })
})