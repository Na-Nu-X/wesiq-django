import { toggleFollow } from "../../community/functions/toggleFollow.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Toggle Follow

    // Variables

    const follow_button:HTMLButtonElement|null = document.querySelector(".profile_container .profile .middle .follow_container .follow_button") as HTMLButtonElement || null // Gets The Follow Button If Is Available

    // Events

    // Follow Button Click Functionalities
    follow_button.addEventListener("click", function():void {
        const clicked_user_id:number|null = Number(follow_button.dataset["id"]) || null // Gets Clicked User ID
        toggleFollow(null, follow_button, clicked_user_id) // Adds Or Removes The Follow
    })
})